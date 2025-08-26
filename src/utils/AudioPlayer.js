import { API_URL } from "../config";

const INITIAL_BUFFER_SIZE = 3;
const ROLLING_BUFFER_TARGET = 2;
const MAX_BUFFER_SIZE = 4;
const FRAGMENT_DURATION_SECONDS = 10;
const FETCH_TRIGGER_FACTOR = 1.5;
const CROSSFADE_DURATION = 0.01;

export class AudioPlayer {
  constructor({ onStateChange, onSeekUpdate, onSongEnd, onBufferStateChange }) {
    this.onStateChange = onStateChange;
    this.onSeekUpdate = onSeekUpdate;
    this.onSongEnd = onSongEnd;
    this.onBufferStateChange = onBufferStateChange;

    this._initAudioEngine();

    this.song = null;
    this.masterBuffer = null;
    this.sourceNode = null;
    this.playbackState = "stopped";
    this.startTime = 0;
    this.pauseOffset = 0;
    this.basePlaybackTime = 0;
    this.updateInterval = null;

    this.fragmentCache = new Map();
    this.nextFragmentToAppend = 1;
    this.appendedFragments = [];
    this.isFetching = false;
  }

  _initAudioEngine() {
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);

    if (this.worker) this.worker.terminate();
    this.worker = new Worker("/audio-worker.js");
  }

  async loadSong(song, shouldPlay = false) {
    if (this.song?.uuid === song.uuid) return;
    this.stop();
    this.song = song;
    this.playbackState = "loading";
    this.onBufferStateChange(true);

    try {
      // La carga inicial sigue siendo de 3 para un arranque robusto
      await this._loadFromFragment(1, INITIAL_BUFFER_SIZE);
      if (shouldPlay) this.play();
    } catch (error) {
      this.playbackState = "stopped";
      this.onBufferStateChange(false);
    }
  }

  async _loadFromFragment(startFragment, numFragmentsToLoad) {
    this.fragmentCache.clear();
    this.appendedFragments = [];
    this.basePlaybackTime = (startFragment - 1) * FRAGMENT_DURATION_SECONDS;
    this.nextFragmentToAppend = startFragment;

    const fragmentsToLoad = Array.from({ length: numFragmentsToLoad }, (_, i) => startFragment + i).filter((index) => index <= this.song.fragmentos);

    await this._fetchAndCacheFragments(fragmentsToLoad);

    const initialBuffers = fragmentsToLoad.map((index) => this.fragmentCache.get(index)).filter(Boolean);
    if (initialBuffers.length === 0) throw new Error(`Failed to load fragment ${startFragment}`);

    this.masterBuffer = this._createMasterBufferWithCrossfade(initialBuffers);
    this.appendedFragments = fragmentsToLoad.filter((index) => this.fragmentCache.has(index));
    this.nextFragmentToAppend = Math.max(...this.appendedFragments) + 1;

    this.playbackState = "ready";
    this.onBufferStateChange(false);
  }

  async _fetchAndCacheFragments(fragmentIndexes) {
    const urlsToFetch = fragmentIndexes.filter((index) => !this.fragmentCache.has(index));
    if (urlsToFetch.length === 0) return;

    const start = Math.min(...urlsToFetch);
    const count = Math.max(...urlsToFetch) - start + 1;

    const urlsRes = await fetch(`${API_URL}/api/canciones/${this.song.uuid}/fragments/secure-urls?start=${start}&count=${count}`);
    const urlsData = await urlsRes.json();
    const urlMap = new Map(urlsData.map((item) => [item.index, item.url]));

    const decodePromises = urlsToFetch.map((index) => {
      const url = urlMap.get(index);
      if (!url) return Promise.resolve();
      return fetch(url)
        .then((res) => res.arrayBuffer())
        .then((buffer) => this.audioContext.decodeAudioData(buffer))
        .then((audioBuffer) => this.fragmentCache.set(index, audioBuffer));
    });
    await Promise.all(decodePromises);
  }

  _createMasterBufferWithCrossfade(buffers) {
    if (!buffers || buffers.length === 0) return null;

    const crossfadeSamples = Math.floor(CROSSFADE_DURATION * this.audioContext.sampleRate);
    const totalSamples = buffers.reduce((sum, b) => sum + b.length, 0) - crossfadeSamples * (buffers.length - 1);
    const channels = buffers[0].numberOfChannels;
    const masterBuffer = this.audioContext.createBuffer(channels, totalSamples, this.audioContext.sampleRate);

    let currentPosition = 0;
    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      for (let channel = 0; channel < channels; channel++) {
        const masterData = masterBuffer.getChannelData(channel);
        const bufferData = buffer.getChannelData(channel % buffer.numberOfChannels);

        if (i > 0) {
          for (let j = 0; j < crossfadeSamples; j++) {
            const masterIndex = currentPosition - crossfadeSamples + j;
            const fadeInGain = j / crossfadeSamples;
            const fadeOutGain = 1 - fadeInGain;
            masterData[masterIndex] = masterData[masterIndex] * fadeOutGain + bufferData[j] * fadeInGain;
          }
          masterData.set(bufferData.subarray(crossfadeSamples), currentPosition);
        } else {
          masterData.set(bufferData, currentPosition);
        }
      }
      currentPosition += buffer.length - (i > 0 ? crossfadeSamples : 0);
    }
    return masterBuffer;
  }

  play() {
    if (this.playbackState === "playing" || !this.masterBuffer) return;
    if (this.audioContext.state === "suspended") this.audioContext.resume();

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.masterBuffer;
    this.sourceNode.connect(this.gainNode);

    const offset = this.pauseOffset;
    this.sourceNode.start(0, offset);

    this.startTime = this.audioContext.currentTime - offset;
    this.playbackState = "playing";
    this.onStateChange(true);
    this._startUpdateLoop();
  }

  pause() {
    if (this.playbackState !== "playing") return;
    this.pauseOffset = this.audioContext.currentTime - this.startTime;
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {}
    }

    this.playbackState = "paused";
    this.onStateChange(false);
    this._stopUpdateLoop();
  }

  stop() {
    if (this.playbackState === "stopped") return;
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {}
    }

    this.playbackState = "stopped";
    this.onStateChange(false);
    this.pauseOffset = 0;
    this.basePlaybackTime = 0;
    this.nextFragmentToAppend = 1;
    this.appendedFragments = [];
    this.fragmentCache.clear();
    this.masterBuffer = null;
    this._stopUpdateLoop();
  }

  _startUpdateLoop() {
    this._stopUpdateLoop();
    this.updateInterval = setInterval(() => {
      if (this.playbackState !== "playing") return;

      const elapsedTimeInCurrentBuffer = this.audioContext.currentTime - this.startTime;
      const totalElapsedTime = this.basePlaybackTime + elapsedTimeInCurrentBuffer;
      this.onSeekUpdate(totalElapsedTime);

      if (totalElapsedTime >= this.song.duracion - 0.25) {
        this.stop();
        this.onSongEnd();
        return;
      }

      const remainingTime = this.masterBuffer.duration - elapsedTimeInCurrentBuffer;

      if (remainingTime < FRAGMENT_DURATION_SECONDS * FETCH_TRIGGER_FACTOR && !this.isFetching && this.nextFragmentToAppend <= this.song.fragmentos) {
        this._fetchNextBatch();
      }

      if (this.fragmentCache.has(this.nextFragmentToAppend)) {
        this._appendToMasterBuffer();
      }
    }, 250);
  }

  _stopUpdateLoop() {
    if (this.updateInterval) clearInterval(this.updateInterval);
  }

  async _fetchNextBatch() {
    this.isFetching = true;
    const fragmentsToLoad = Array.from({ length: ROLLING_BUFFER_TARGET }, (_, i) => this.nextFragmentToAppend + i).filter(
      (index) => index <= this.song.fragmentos
    );

    if (fragmentsToLoad.length > 0) {
      await this._fetchAndCacheFragments(fragmentsToLoad);
    }
    this.isFetching = false;
  }

  _appendToMasterBuffer() {
    if (!this.fragmentCache.has(this.nextFragmentToAppend)) return;

    const elapsedTime = this.audioContext.currentTime - this.startTime;

    this.appendedFragments.push(this.nextFragmentToAppend);

    let fragmentToDiscard = null;
    if (this.appendedFragments.length > MAX_BUFFER_SIZE) {
      const discardedIndex = this.appendedFragments.shift();
      fragmentToDiscard = this.fragmentCache.get(discardedIndex);
      this.fragmentCache.delete(discardedIndex);
    }

    const buffersToConcatenate = this.appendedFragments.map((index) => this.fragmentCache.get(index));
    const newMasterBuffer = this._createMasterBufferWithCrossfade(buffersToConcatenate);

    let newElapsedTime = elapsedTime;
    if (fragmentToDiscard) {
      newElapsedTime -= fragmentToDiscard.duration - CROSSFADE_DURATION;
      this.basePlaybackTime += fragmentToDiscard.duration - CROSSFADE_DURATION;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {}
    }

    this.masterBuffer = newMasterBuffer;
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.masterBuffer;
    this.sourceNode.connect(this.gainNode);
    this.sourceNode.start(0, newElapsedTime);

    this.startTime = this.audioContext.currentTime - newElapsedTime;
    this.nextFragmentToAppend++;
  }

  async seek(time) {
    if (!this.song) return;
    const wasPlaying = this.playbackState === "playing";

    this.stop();
    this.playbackState = "loading";
    this.onBufferStateChange(true);

    this.worker.postMessage({ type: "cancel" });

    const targetFragment = Math.floor(time / FRAGMENT_DURATION_SECONDS) + 1;
    const seekOffset = time % FRAGMENT_DURATION_SECONDS;

    try {
      // --- LÓGICA DE SEEK PRIORITARIO ---
      // 1. Cargar solo UN fragmento, el de destino, para una respuesta inmediata.
      await this._loadFromFragment(targetFragment, 1);
      this.pauseOffset = seekOffset;
      this.onSeekUpdate(time);

      if (wasPlaying) {
        this.play();
        // 2. Inmediatamente después de empezar a reproducir, pedir los siguientes fragmentos en segundo plano.
        setTimeout(() => this._fetchNextBatch(), 500); // Pequeño delay para dar prioridad al play
      } else {
        this.playbackState = "paused";
      }
    } catch (error) {
      this.playbackState = "stopped";
    } finally {
      this.onBufferStateChange(false);
    }
  }

  destroy() {
    this.stop();
    if (this.audioContext) this.audioContext.close().catch(() => {});
    if (this.worker) this.worker.terminate();
  }

  setVolume(volume) {
    if (this.gainNode) this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
  }
}
