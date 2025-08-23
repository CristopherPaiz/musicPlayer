import { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import SkipBack from "./icons/SkipBack";
import Pause from "./icons/Pause";
import Play from "./icons/Play";
import SkipForward from "./icons/SkipForward";

const FRAGMENT_DURATION = 10;

class AudioPlayer {
  constructor({ songUrl, totalFragments, onStateChange, onSeekUpdate, onSongEnd }) {
    this.songUrl = songUrl;
    this.totalFragments = totalFragments;
    this.onStateChange = onStateChange;
    this.onSeekUpdate = onSeekUpdate;
    this.onSongEnd = onSongEnd;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);

    this.bufferCache = new Map();
    this.sourceNode = null;
    this.currentFragmentIndex = 1;
    this.playbackState = "paused"; // 'playing', 'paused'
    this.seekUpdateTimer = null;

    this.fragmentStartTime = 0;
    this.pausedTime = 0;
  }

  async _loadFragment(index) {
    if (this.bufferCache.has(index)) {
      return this.bufferCache.get(index);
    }
    if (index > this.totalFragments) {
      return null;
    }
    try {
      const response = await fetch(`${this.songUrl}/${index}.mp3`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.bufferCache.set(index, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`Error loading fragment ${index}:`, error);
      return null;
    }
  }

  _preloadNext() {
    this._loadFragment(this.currentFragmentIndex + 1);
  }

  async _playFragment(index, offset = 0) {
    if (this.audioContext.state === "closed") return;
    const buffer = await this._loadFragment(index);
    if (!buffer) {
      if (index > this.totalFragments) {
        this.onSongEnd();
        this.playbackState = "paused";
        this.onStateChange("paused");
      }
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
        this.currentFragmentIndex++;
        this._playFragment(this.currentFragmentIndex);
      }
    };

    this.sourceNode.start(0, offset);
    this.currentFragmentIndex = index;
    this.fragmentStartTime = this.audioContext.currentTime - offset;
    this.playbackState = "playing";
    this.onStateChange("playing");
    this._startSeekUpdater();
    this._preloadNext();
  }

  _startSeekUpdater() {
    cancelAnimationFrame(this.seekUpdateTimer);
    const update = () => {
      if (this.playbackState === "playing") {
        const baseTime = (this.currentFragmentIndex - 1) * FRAGMENT_DURATION;
        const elapsedInFragment = this.audioContext.currentTime - this.fragmentStartTime;
        this.onSeekUpdate(baseTime + elapsedInFragment);
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
    this.pausedTime = baseTime + elapsedInFragment;
    this.sourceNode.onended = null;
    this.sourceNode.stop();
    this.sourceNode = null;
    this.playbackState = "paused";
    this.onStateChange("paused");
  }

  seek(time) {
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
    if (this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
    this.bufferCache.clear();
  }
}

const SongPlayer = ({ colorText, root, artist, song, setPreviousSong, setEndSong, totalFragments, volume, setSeek, userSeek }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);
  const isUserSeekingRef = useRef(false);

  useEffect(() => {
    playerRef.current?.destroy();

    if (!song || !artist) return;

    const player = new AudioPlayer({
      songUrl: `${root}/${artist}/${song}`,
      totalFragments,
      onStateChange: (state) => setIsPlaying(state === "playing"),
      onSeekUpdate: (time) => {
        if (!isUserSeekingRef.current) {
          setSeek(time);
        }
      },
      onSongEnd: () => setEndSong(true),
    });
    playerRef.current = player;
    player.play();

    return () => {
      player.destroy();
    };
  }, [song, artist, root, totalFragments, setEndSong, setSeek]);

  useEffect(() => {
    playerRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (userSeek === undefined) return;

    isUserSeekingRef.current = true;
    playerRef.current?.seek(userSeek);

    const timeoutId = setTimeout(() => {
      isUserSeekingRef.current = false;
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [userSeek]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }
  }, [isPlaying]);

  const playPrevious = useCallback(() => {
    const currentTime = playerRef.current?.pausedTime || 0;
    if (currentTime < 2) {
      setPreviousSong(true);
    } else {
      playerRef.current?.seek(0);
    }
  }, [setPreviousSong]);

  return (
    <div className="relative flex flex-row justify-center ">
      <div className="flex gap-8 items-center">
        <button onClick={playPrevious} className="rounded-full p-2 hover:scale-105">
          <SkipBack color={colorText} />
        </button>
        <button onClick={togglePlayPause} style={{ border: `4px solid ${colorText}` }} className="rounded-full p-2 hover:scale-105">
          {isPlaying ? <Pause color={colorText} /> : <Play color={colorText} />}
        </button>
        <button onClick={() => setEndSong(true)} className="rounded-full p-2 hover:scale-105">
          <SkipForward color={colorText} />
        </button>
      </div>
    </div>
  );
};

SongPlayer.propTypes = {
  colorText: PropTypes.string,
  root: PropTypes.string.isRequired,
  artist: PropTypes.string.isRequired,
  song: PropTypes.string.isRequired,
  setPreviousSong: PropTypes.func.isRequired,
  setEndSong: PropTypes.func.isRequired,
  totalFragments: PropTypes.number,
  volume: PropTypes.number,
  setSeek: PropTypes.func.isRequired,
  userSeek: PropTypes.number,
};

export default SongPlayer;
