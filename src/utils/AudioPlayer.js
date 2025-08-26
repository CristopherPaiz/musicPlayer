import { API_URL } from "../config";

const INITIAL_FRAGMENTS_TO_LOAD = 3;
const ROLLING_FRAGMENTS_TO_LOAD = 2;
const PRELOAD_AHEAD_SECONDS = 15;
const FRAGMENT_DURATION_SECONDS = 10; // Usado solo como una *estimación* para el 'seek' inicial.
const CROSSFADE_DURATION = 0.01; // Crossfade ultra corto de 10ms, ahora posible por la alta precisión.

export class AudioPlayer {
  constructor({ onStateChange, onSeekUpdate, onSongEnd, onBufferStateChange }) {
    this.onStateChange = onStateChange;
    this.onSeekUpdate = onSeekUpdate;
    this.onSongEnd = onSongEnd;
    this.onBufferStateChange = onBufferStateChange;

    this._initAudioEngine();

    this.scheduledSources = [];
    this.fragmentCache = new Map();
    this.pendingFragments = new Set();
    this.updateInterval = null;

    this._resetState();

    this.worker = new Worker("/audio-worker.js");
    this.worker.onmessage = this._handleWorkerMessage.bind(this);
  }

  _initAudioEngine() {
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGainNode = this.audioContext.createGain();
    this.masterGainNode.connect(this.audioContext.destination);

    this.faderGainA = this.audioContext.createGain();
    this.faderGainA.connect(this.masterGainNode);
    this.faderGainB = this.audioContext.createGain();
    this.faderGainB.connect(this.masterGainNode);
  }

  _resetState(keepSong = false) {
    if (this.updateInterval) clearInterval(this.updateInterval);
    this.updateInterval = null;

    this.scheduledSources.forEach((source) => {
      try {
        source.onended = null;
        source.stop();
      } catch (e) {}
    });

    this.worker?.postMessage({ type: "cancel" });

    if (!keepSong) {
      this.song = null;
    }
    this.playbackState = "stopped";
    this.fragmentCache.clear();
    this.pendingFragments.clear();
    this.scheduledSources = [];

    this.songStartTime = 0;
    this.pauseTime = 0;
    this.nextFragmentToSchedule = 1;
    this.nextScheduleTime = 0; // El tiempo absoluto en el AudioContext para el siguiente fragmento.
    this.faderToggle = true;
  }

  async loadSong(song, shouldPlay = false) {
    if (this.song?.uuid === song.uuid) return;

    this._resetState();
    this.song = song;
    this.playbackState = "loading";
    this.onBufferStateChange(true);

    try {
      await this._fetchFragments(1, INITIAL_FRAGMENTS_TO_LOAD);
      this.playbackState = "ready";
      this.onBufferStateChange(false);
      if (shouldPlay) this.play();
    } catch (error) {
      this.playbackState = "stopped";
      this.onBufferStateChange(false);
    }
  }

  play() {
    if (this.playbackState === "playing" || !this.song) return;
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    this.songStartTime = this.audioContext.currentTime - this.pauseTime;
    this.nextFragmentToSchedule = Math.floor(this.pauseTime / FRAGMENT_DURATION_SECONDS) + 1;
    this.faderToggle = this.nextFragmentToSchedule % 2 !== 0;

    this._scheduleAvailableFragments();
    this.playbackState = "playing";
    this.onStateChange(true);
    this._startUpdateLoop();
  }

  pause() {
    if (this.playbackState !== "playing") return;
    this.pauseTime = this.audioContext.currentTime - this.songStartTime;

    this.scheduledSources.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
    });
    this.scheduledSources = [];

    this.playbackState = "paused";
    this.onStateChange(false);
    this._stopUpdateLoop();
  }

  stop() {
    this._resetState();
    this.onStateChange(false);
    this.onSeekUpdate(0);
  }

  async seek(time) {
    if (!this.song) return;
    const wasPlaying = this.playbackState === "playing";

    this._resetState(true);
    this.onBufferStateChange(true);

    this.pauseTime = time;
    const targetFragment = Math.floor(time / FRAGMENT_DURATION_SECONDS) + 1;
    await this._fetchFragments(targetFragment, INITIAL_FRAGMENTS_TO_LOAD);

    if (wasPlaying) {
      this.play();
    }
    this.onBufferStateChange(false);
  }

  _startUpdateLoop() {
    this._stopUpdateLoop();
    this.updateInterval = setInterval(() => {
      if (this.playbackState !== "playing") return;

      const currentPlaybackTime = this.audioContext.currentTime - this.songStartTime;
      this.onSeekUpdate(currentPlaybackTime);

      if (currentPlaybackTime >= this.song.duracion) {
        this.stop();
        this.onSongEnd();
        return;
      }

      const secondsUntilEnd = this.nextScheduleTime - this.audioContext.currentTime;
      if (secondsUntilEnd < PRELOAD_AHEAD_SECONDS) {
        this._fetchFragments(this.nextFragmentToSchedule, ROLLING_FRAGMENTS_TO_LOAD);
      }
    }, 250);
  }

  _stopUpdateLoop() {
    if (this.updateInterval) clearInterval(this.updateInterval);
  }

  async _fetchFragments(startFragment, numFragments) {
    const fragmentIndexes = Array.from({ length: numFragments }, (_, i) => startFragment + i).filter(
      (index) => index <= this.song.fragmentos && !this.fragmentCache.has(index) && !this.pendingFragments.has(index)
    );
    if (fragmentIndexes.length === 0) return;

    fragmentIndexes.forEach((index) => this.pendingFragments.add(index));

    try {
      const urlsRes = await fetch(`${API_URL}/api/canciones/${this.song.uuid}/fragments/secure-urls?start=${startFragment}&count=${numFragments}`);
      const urlsData = await urlsRes.json();
      const urlMap = new Map(urlsData.map((item) => [item.index, item.url]));

      fragmentIndexes.forEach((index) => {
        const url = urlMap.get(index);
        if (url) {
          this.worker.postMessage({ type: "load", url, index });
        } else {
          this.pendingFragments.delete(index);
        }
      });
    } catch (error) {
      fragmentIndexes.forEach((index) => this.pendingFragments.delete(index));
    }
  }

  async _handleWorkerMessage(event) {
    const { status, index, arrayBuffer } = event.data;
    this.pendingFragments.delete(index);

    if (status === "success" && arrayBuffer) {
      try {
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.fragmentCache.set(index, audioBuffer);
        if (this.playbackState === "playing") {
          this._scheduleAvailableFragments();
        }
      } catch (e) {}
    }
  }

  _scheduleAvailableFragments() {
    while (this.fragmentCache.has(this.nextFragmentToSchedule)) {
      const audioBuffer = this.fragmentCache.get(this.nextFragmentToSchedule);
      if (!audioBuffer) break;

      const isFirstFragmentOfPlayback = this.scheduledSources.length === 0;
      const measuredDuration = audioBuffer.duration;

      const targetGain = this.faderToggle ? this.faderGainA : this.faderGainB;
      const otherGain = this.faderToggle ? this.faderGainB : this.faderGainA;

      let scheduleAt;
      let offset = 0;

      if (isFirstFragmentOfPlayback) {
        const fragmentStartTime = (this.nextFragmentToSchedule - 1) * FRAGMENT_DURATION_SECONDS;
        offset = this.pauseTime - fragmentStartTime;
        scheduleAt = this.audioContext.currentTime;
        this.nextScheduleTime = scheduleAt + measuredDuration - offset;
      } else {
        scheduleAt = this.nextScheduleTime - CROSSFADE_DURATION;
        this.nextScheduleTime += measuredDuration - CROSSFADE_DURATION;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(targetGain);

      if (isFirstFragmentOfPlayback) {
        targetGain.gain.setValueAtTime(1, this.audioContext.currentTime);
        otherGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      } else {
        targetGain.gain.setValueAtTime(0, scheduleAt);
        targetGain.gain.linearRampToValueAtTime(1, scheduleAt + CROSSFADE_DURATION);
        otherGain.gain.setValueAtTime(1, scheduleAt);
        otherGain.gain.linearRampToValueAtTime(0, scheduleAt + CROSSFADE_DURATION);
      }

      source.start(scheduleAt, offset);

      source.onended = () => {
        this.scheduledSources = this.scheduledSources.filter((s) => s !== source);
      };

      this.scheduledSources.push(source);
      this.nextFragmentToSchedule++;
      this.faderToggle = !this.faderToggle;
    }
  }

  destroy() {
    this.stop();
    if (this.audioContext) this.audioContext.close().catch(() => {});
    if (this.worker) this.worker.terminate();
  }

  setVolume(volume) {
    if (this.masterGainNode) this.masterGainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
  }
}
