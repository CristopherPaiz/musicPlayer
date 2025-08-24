const FRAGMENT_DURATION = 10;
const PRELOAD_AHEAD = 3;

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
    this.pendingFragments = new Set();
    this.mediaMetadataSet = false;

    this.worker = new Worker(new URL("./audio-worker.js", import.meta.url), { type: "module" });
    this.worker.onmessage = this._handleWorkerMessage.bind(this);

    this._setupMediaSessionHandlers();
  }

  _handleWorkerMessage(event) {
    const { status, index, arrayBuffer, error } = event.data;
    this.pendingFragments.delete(index);

    if (status === "success") {
      this.audioContext
        .decodeAudioData(arrayBuffer)
        .then((audioBuffer) => {
          this.bufferCache.set(index, audioBuffer);
          console.log(`[AudioPlayer] Fragmento ${index} decodificado y cacheado.`);
          this._managePreloadBuffer();
        })
        .catch((e) => console.error(`[AudioPlayer] Error decodificando fragmento ${index}:`, e));
    } else {
      console.error(`[Worker] Falló la descarga del fragmento ${index}:`, error);
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
    if ("mediaSession" in navigator) {
      if (!this.mediaMetadataSet && this.song) {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: this.song.title,
          artist: this.song.artist,
          album: this.song.album,
          artwork: [{ src: `${this.songUrl}/cover.webp`, sizes: "512x512", type: "image/webp" }],
        });
        this.mediaMetadataSet = true;
        console.log("[MediaSession] Metadatos actualizados para:", this.song.title);
      }
      navigator.mediaSession.playbackState = this.playbackState;
    }
  }

  _requestFragment(index) {
    if (this.bufferCache.has(index) || this.pendingFragments.has(index) || index > this.totalFragments) {
      return;
    }
    this.pendingFragments.add(index);
    console.log(`[AudioPlayer] Solicitando al Worker la descarga del fragmento ${index}...`);
    this.worker.postMessage({ type: "load", url: `${this.songUrl}/${index}.mp3`, index });
  }

  _managePreloadBuffer() {
    for (let i = 0; i <= PRELOAD_AHEAD; i++) {
      const preloadIndex = this.currentFragmentIndex + i;
      this._requestFragment(preloadIndex);
    }
  }

  async _getBuffer(index) {
    while (!this.bufferCache.has(index)) {
      console.warn(`[AudioPlayer] Esperando por el fragmento ${index}...`);
      this._requestFragment(index);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return this.bufferCache.get(index);
  }

  async _playFragment(index, offset = 0) {
    if (this.audioContext.state === "closed") return;

    this.currentFragmentIndex = index;

    if (index > this.totalFragments) {
      console.log("[AudioPlayer] Fin de la canción alcanzado.");
      this.onSongEnd();
      return;
    }

    this._managePreloadBuffer();

    const buffer = await this._getBuffer(index);
    if (!buffer) {
      console.error(`[AudioPlayer] Reproducción detenida. No se pudo obtener el fragmento ${index}.`);
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
    this.playbackState = "playing";
    this.onStateChange("playing");
    this._startSeekUpdater();
    this._updateMediaSession();
  }

  _startSeekUpdater() {
    cancelAnimationFrame(this.seekUpdateTimer);
    const update = () => {
      if (this.playbackState === "playing") {
        const baseTime = (this.currentFragmentIndex - 1) * FRAGMENT_DURATION;
        const elapsedInFragment = this.audioContext.currentTime - this.fragmentStartTime;
        const currentTime = baseTime + elapsedInFragment;

        if (currentTime >= this.song.length) {
          this.onSeekUpdate(this.song.length);
        } else {
          this.onSeekUpdate(currentTime);
        }

        this.seekUpdateTimer = requestAnimationFrame(update);
      }
    };
    this.seekUpdateTimer = requestAnimationFrame(update);
  }

  play() {
    if (this.playbackState === "playing") return;
    this.audioContext.resume();
    const resumeFragment = Math.floor(this.pausedTime / FRAGMENT_DURATION) + 1;
    const resumeOffset = this.pausedTime % FRAGMENT_DURATION;
    this._playFragment(resumeFragment, resumeOffset);
  }

  pause() {
    if (this.playbackState === "paused" || !this.sourceNode) return;
    cancelAnimationFrame(this.seekUpdateTimer);
    const baseTime = (this.currentFragmentIndex - 1) * FRAGMENT_DURATION;
    const elapsedInFragment = this.audioContext.currentTime - this.fragmentStartTime;
    this.pausedTime = Math.min(baseTime + elapsedInFragment, this.song.length);
    this.sourceNode.onended = null;
    this.sourceNode.stop();
    this.sourceNode = null;
    this.playbackState = "paused";
    this.onStateChange("paused");
    this._updateMediaSession();
  }

  seek(time) {
    console.log(`[AudioPlayer] Seek solicitado a ${time.toFixed(2)}s.`);
    this.worker.postMessage({ type: "cancel" });
    this.pendingFragments.clear();
    this.bufferCache.clear();

    const wasPlaying = this.playbackState === "playing";
    this.pause();
    this.pausedTime = time;
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
    if (this.audioContext.state !== "closed") {
      this.audioContext.close().catch((e) => console.error("Error closing AudioContext:", e));
    }
    this.bufferCache.clear();
  }
}
