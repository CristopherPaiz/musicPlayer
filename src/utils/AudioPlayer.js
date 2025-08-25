const FRAGMENT_DURATION = 10;
const PRELOAD_AHEAD = 3; // Descargaremos de 3 en 3 después de la carga inicial

export class AudioPlayer {
  constructor({ song, songUrl, totalFragments, onStateChange, onSeekUpdate, onSongEnd, onPreviousSong, onNextSong }) {
    this.song = song;
    this.songUrl = songUrl;
    this.totalFragments = totalFragments;
    this.onStateChange = onStateChange;
    this.onSeekUpdate = onSeekUpdate;
    this.onSongEnd = onSongEnd;
    this.onPreviousSong = onPreviousSong;
    this.onNextSong = onNextSong;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);

    this.bufferCache = new Map();
    this.sourceNode = null;
    this.currentFragmentIndex = 1;
    this.playbackState = "paused";
    this.seekUpdateTimer = null;
    this.fragmentStartTime = 0;
    this.pausedTime = 0;
    this.isReadyToPlay = false;
    this.playWhenReady = false;

    this.downloadQueue = new Set();
    this.priorityFragment = null;
    this.wakeLock = null;

    this.worker = new Worker("/audio-worker.js");
    this.worker.onmessage = this._handleWorkerMessage.bind(this);

    this._setupMediaSessionHandlers();
  }

  async _acquireWakeLock() {
    if ("wakeLock" in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request("screen");
      } catch (err) {
        console.error(`[WakeLock] Falló la adquisición: ${err.name}, ${err.message}`);
      }
    }
  }

  _releaseWakeLock() {
    if (this.wakeLock !== null) {
      this.wakeLock.release().then(() => {
        this.wakeLock = null;
      });
    }
  }

  _handleWorkerMessage(event) {
    const { status, index, arrayBuffer, error } = event.data;
    this.downloadQueue.delete(index);

    if (status === "success") {
      this.audioContext
        .decodeAudioData(arrayBuffer)
        .then((audioBuffer) => {
          this.bufferCache.set(index, audioBuffer);

          if (index === this.priorityFragment) {
            this.isReadyToPlay = true;
            this.priorityFragment = null;
            if (this.playWhenReady) {
              this._playFragment(this.currentFragmentIndex, this.pausedTime % FRAGMENT_DURATION);
            }
            this._managePreloadBuffer(); // Iniciar descargas en paralelo
          }
        })
        .catch((e) => console.error(`[AudioPlayer] Error decodificando fragmento ${index}:`, e));
    } else {
      console.error(`[Worker] Falló la descarga del fragmento ${index}:`, error);
      // Podríamos reintentar la descarga aquí si es necesario
    }
  }

  _setupMediaSessionHandlers() {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => this.play());
      navigator.mediaSession.setActionHandler("pause", () => this.pause());
      navigator.mediaSession.setActionHandler("previoustrack", () => this.onPreviousSong());
      navigator.mediaSession.setActionHandler("nexttrack", () => this.onNextSong());
    }
  }

  _updateMediaSession() {
    if (!("mediaSession" in navigator) || !this.song) {
      return;
    }
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: this.song.title,
      artist: this.song.artist,
      album: this.song.album,
      artwork: [{ src: `${this.songUrl}/cover.webp`, sizes: "512x512", type: "image/webp" }],
    });
    navigator.mediaSession.playbackState = this.playbackState;
  }

  _requestFragment(index) {
    if (this.bufferCache.has(index) || this.downloadQueue.has(index) || index > this.totalFragments || index < 1) {
      return;
    }
    this.downloadQueue.add(index);
    this.worker.postMessage({ type: "load", url: `${this.songUrl}/${index}.mp3`, index });
  }

  _prioritizeFragment(index) {
    this.isReadyToPlay = false;
    this.priorityFragment = index;
    this._requestFragment(index);
  }

  _managePreloadBuffer() {
    if (this.priorityFragment !== null) return; // No pre-cargar si hay un fragmento prioritario
    for (let i = 1; i <= PRELOAD_AHEAD; i++) {
      const preloadIndex = this.currentFragmentIndex + i;
      this._requestFragment(preloadIndex);
    }
  }

  async _getBuffer(index) {
    if (!this.bufferCache.has(index)) {
      this._prioritizeFragment(index);
      while (!this.bufferCache.has(index)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return this.bufferCache.get(index);
  }

  async _playFragment(index, offset = 0) {
    if (this.audioContext.state === "closed" || this.playbackState !== "playing") return;

    this.currentFragmentIndex = index;
    if (index > this.totalFragments) {
      this.onSongEnd();
      return;
    }

    const buffer = await this._getBuffer(index);
    if (!buffer) {
      this.pause();
      return;
    }

    if (this.sourceNode) {
      this.sourceNode.onended = null;
      this.sourceNode.stop();
    }

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.connect(this.gainNode);
    this.sourceNode.onended = () => {
      if (this.playbackState === "playing") {
        this._playFragment(this.currentFragmentIndex + 1);
      }
    };
    this.sourceNode.start(0, offset);
    this.fragmentStartTime = this.audioContext.currentTime - offset;

    this._managePreloadBuffer();
  }

  _startSeekUpdater() {
    cancelAnimationFrame(this.seekUpdateTimer);
    const update = () => {
      if (this.playbackState === "playing" && this.isReadyToPlay) {
        const baseTime = (this.currentFragmentIndex - 1) * FRAGMENT_DURATION;
        const elapsedInFragment = this.audioContext.currentTime - this.fragmentStartTime;
        const currentTime = baseTime + elapsedInFragment;
        this.onSeekUpdate(Math.min(currentTime, this.song.length));
      }
      this.seekUpdateTimer = requestAnimationFrame(update);
    };
    this.seekUpdateTimer = requestAnimationFrame(update);
  }

  play(startTime = null) {
    if (this.playbackState === "playing") return;
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    this.playbackState = "playing";
    this.onStateChange("playing");
    this._updateMediaSession();
    this._acquireWakeLock();
    this._startSeekUpdater();

    if (startTime !== null) {
      this.pausedTime = startTime;
    }

    this.playWhenReady = true;
    const fragmentToPlay = Math.floor(this.pausedTime / FRAGMENT_DURATION) + 1;
    const offset = this.pausedTime % FRAGMENT_DURATION;
    this.currentFragmentIndex = fragmentToPlay;

    if (this.bufferCache.has(fragmentToPlay)) {
      this.isReadyToPlay = true;
      this._playFragment(fragmentToPlay, offset);
    } else {
      this._prioritizeFragment(fragmentToPlay);
    }
  }

  pause() {
    if (this.playbackState === "paused") return;
    this.playWhenReady = false;
    this.playbackState = "paused";
    this.onStateChange("paused");
    this._updateMediaSession();
    this._releaseWakeLock();
    cancelAnimationFrame(this.seekUpdateTimer);

    if (this.sourceNode) {
      const baseTime = (this.currentFragmentIndex - 1) * FRAGMENT_DURATION;
      const elapsedInFragment = this.audioContext.currentTime - this.fragmentStartTime;
      this.pausedTime = Math.min(baseTime + elapsedInFragment, this.song.length);
      this.sourceNode.onended = null;
      this.sourceNode.stop();
      this.sourceNode = null;
    }
  }

  seek(time) {
    this.worker.postMessage({ type: "cancel" });
    this.downloadQueue.clear();

    const wasPlaying = this.playbackState === "playing";
    if (wasPlaying) this.pause();

    this.pausedTime = time;
    this.onSeekUpdate(time); // Actualiza la UI inmediatamente

    const fragmentToSeek = Math.floor(time / FRAGMENT_DURATION) + 1;

    // Limpiar caché excepto los fragmentos ya descargados alrededor del punto de seek
    const currentBuffers = Array.from(this.bufferCache.keys());
    for (const key of currentBuffers) {
      if (Math.abs(key - fragmentToSeek) > PRELOAD_AHEAD) {
        this.bufferCache.delete(key);
      }
    }

    if (wasPlaying) {
      this.play();
    }
  }

  setVolume(volume) {
    this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
  }

  destroy() {
    this.pause();
    this.worker.terminate();
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch((e) => console.error("Error closing AudioContext:", e));
    }
    this.bufferCache.clear();
  }
}
