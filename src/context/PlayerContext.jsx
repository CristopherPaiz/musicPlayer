import { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { AudioPlayer } from "../utils/AudioPlayer";

const PlayerContext = createContext(null);
const PLAYER_STATE_KEY = "musicPlayerState";
let playerInstance = null;

const getInitialState = () => {
  try {
    const savedState = localStorage.getItem(PLAYER_STATE_KEY);
    if (!savedState) return { volume: 1, random: false, currentSong: null, queue: [], seek: 0 };
    const parsed = JSON.parse(savedState);
    return {
      volume: parsed.volume ?? 1,
      random: parsed.random ?? false,
      currentSong: parsed.currentSong ?? null,
      queue: parsed.queue ?? [],
      seek: parsed.seek ?? 0,
    };
  } catch (error) {
    return { volume: 1, random: false, currentSong: null, queue: [], seek: 0 };
  }
};

export const PlayerProvider = ({ children }) => {
  const initialState = useMemo(getInitialState, []);
  const [queue, setQueue] = useState(initialState.queue);
  const [currentSong, setCurrentSong] = useState(initialState.currentSong);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [random, setRandom] = useState(initialState.random);
  const [volume, setVolume] = useState(initialState.volume);
  const [lyrics, setLyrics] = useState(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [userSeek, setUserSeek] = useState(undefined);

  const seekRef = useRef(initialState.seek);
  const seekSubscribers = useRef(new Set());

  const notifySeekSubscribers = useCallback(() => {
    seekSubscribers.current.forEach((callback) => callback(seekRef.current));
  }, []);

  const handleSeekUpdate = useCallback(
    (newSeek) => {
      seekRef.current = newSeek;
      notifySeekSubscribers();
    },
    [notifySeekSubscribers]
  );

  const skipSong = useCallback(
    (direction) => {
      setQueue((currentQueue) => {
        if (!currentSong || !currentQueue || currentQueue.length === 0) return currentQueue;
        const currentIndex = currentQueue.findIndex((s) => s.id === currentSong.id);
        if (currentIndex === -1) return currentQueue;
        let nextIndex;
        if (random && currentQueue.length > 1) {
          do {
            nextIndex = Math.floor(Math.random() * currentQueue.length);
          } while (nextIndex === currentIndex);
        } else {
          nextIndex =
            direction === "forward" ? (currentIndex + 1) % currentQueue.length : (currentIndex - 1 + currentQueue.length) % currentQueue.length;
        }
        setCurrentSong(currentQueue[nextIndex]);
        return currentQueue;
      });
    },
    [currentSong, random]
  );

  const handleSkipBack = useCallback(() => {
    if (seekRef.current > 5 && playerInstance) {
      playerInstance.seek(0);
    } else {
      skipSong("backward");
    }
  }, [skipSong]);

  useEffect(() => {
    if (!playerInstance) {
      playerInstance = new AudioPlayer({
        onStateChange: setIsPlaying,
        onSeekUpdate: handleSeekUpdate,
        onBufferStateChange: setIsBuffering,
        onSongEnd: () => skipSong("forward"),
      });
    }

    if (initialState.currentSong && playerInstance) {
      playerInstance.loadSong(initialState.currentSong, false).then(() => {
        if (initialState.seek > 0) {
          playerInstance.seek(initialState.seek);
          handleSeekUpdate(initialState.seek);
        }
      });
    }

    return () => {
      if (playerInstance) {
        playerInstance.destroy();
        playerInstance = null;
      }
    };
  }, [skipSong, handleSeekUpdate, handleSkipBack, initialState.currentSong, initialState.seek]);

  useEffect(() => {
    const saveState = () => {
      if (currentSong) {
        const stateToSave = {
          volume,
          random,
          currentSong,
          queue,
          seek: seekRef.current,
        };
        localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(stateToSave));
      }
    };

    const intervalId = setInterval(saveState, 5000);
    window.addEventListener("beforeunload", saveState);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("beforeunload", saveState);
    };
  }, [volume, random, currentSong, queue]);

  const handleSelectSong = useCallback(
    (song, sourcePlaylist) => {
      if (currentSong?.id === song.id) {
        isPlaying ? playerInstance.pause() : playerInstance.play();
      } else {
        setCurrentSong(song);
        if (random) {
          const otherSongs = sourcePlaylist.filter((s) => s.id !== song.id);
          const shuffled = otherSongs.sort(() => Math.random() - 0.5);
          setQueue([song, ...shuffled]);
        } else {
          setQueue(sourcePlaylist);
        }
      }
    },
    [currentSong, isPlaying, random]
  );

  const handleTogglePlayPause = useCallback(() => {
    if (!currentSong || !playerInstance) return;
    isPlaying ? playerInstance.pause() : playerInstance.play();
  }, [currentSong, isPlaying]);

  useEffect(() => {
    if (currentSong && playerInstance) {
      playerInstance.loadSong(currentSong, true);
    }
  }, [currentSong]);

  useEffect(() => {
    if (playerInstance) playerInstance.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (userSeek !== undefined && playerInstance) {
      handleSeekUpdate(userSeek);
      playerInstance.seek(userSeek);
      setUserSeek(undefined);
    }
  }, [userSeek, handleSeekUpdate]);

  useEffect(() => {
    if (!currentSong?.lyricsUrl) {
      setLyrics(null);
      return;
    }
    setIsLoadingLyrics(true);
    setLyrics(null);
    fetch(currentSong.lyricsUrl)
      .then((res) => (res.ok ? res.text() : null))
      .then((text) => setLyrics(text))
      .catch(() => setLyrics(null))
      .finally(() => setIsLoadingLyrics(false));
  }, [currentSong?.lyricsUrl]);

  const currentImage = useMemo(() => currentSong?.coverUrl || null, [currentSong]);
  const subscribeToSeek = useCallback((callback) => {
    seekSubscribers.current.add(callback);
    return () => seekSubscribers.current.delete(callback);
  }, []);
  const getSeek = useCallback(() => seekRef.current, []);

  const value = useMemo(
    () => ({
      queue,
      setQueue,
      currentSong,
      setCurrentSong: handleSelectSong,
      isPlaying,
      setIsPlaying,
      isBuffering,
      random,
      setRandom,
      volume,
      setVolume,
      setUserSeek,
      lyrics,
      isLoadingLyrics,
      currentImage,
      skipSong,
      handleSkipBack,
      handleTogglePlayPause,
      subscribeToSeek,
      getSeek,
    }),
    [
      queue,
      currentSong,
      isPlaying,
      isBuffering,
      random,
      volume,
      lyrics,
      isLoadingLyrics,
      currentImage,
      handleSelectSong,
      skipSong,
      handleSkipBack,
      handleTogglePlayPause,
      subscribeToSeek,
      getSeek,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

PlayerProvider.propTypes = { children: PropTypes.node.isRequired };

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within a PlayerProvider");
  return context;
};
