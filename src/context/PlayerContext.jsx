import { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { AudioPlayer } from "../utils/AudioPlayer";

const PlayerContext = createContext(null);
let playerInstance = null;

export const PlayerProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [random, setRandom] = useState(false);
  const [volume, setVolume] = useState(1);
  const [lyrics, setLyrics] = useState(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [userSeek, setUserSeek] = useState(undefined);

  const seekRef = useRef(0);
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
    return () => {
      if (playerInstance) {
        playerInstance.destroy();
        playerInstance = null;
      }
    };
  }, [skipSong, handleSeekUpdate, handleSkipBack]);

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

  // --- LÓGICA DE SEEK OPTIMISTA ---
  useEffect(() => {
    if (userSeek !== undefined && playerInstance) {
      // 1. Actualiza la UI inmediatamente a la posición deseada
      handleSeekUpdate(userSeek);

      // 2. Pide al reproductor que se ponga al día en segundo plano
      playerInstance.seek(userSeek);

      // 3. Resetea el trigger
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
