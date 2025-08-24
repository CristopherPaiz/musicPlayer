import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { AudioPlayer } from "../utils/AudioPlayer";

const SongPlayer = ({ isPlaying, setIsPlaying, selectedSong, root, setPreviousSong, setEndSong, volume, setSeek, userSeek }) => {
  const playerRef = useRef(null);
  const userSeekRef = useRef(null);

  useEffect(() => {
    playerRef.current?.destroy();
    playerRef.current = null;
    if (!selectedSong) {
      setIsPlaying(false);
      return;
    }

    const player = new AudioPlayer({
      song: selectedSong,
      songUrl: `${root}/${selectedSong.artist}/${selectedSong.title}`,
      totalFragments: selectedSong.fragments,
      onStateChange: (state) => setIsPlaying(state === "playing"),
      onSeekUpdate: (time) => {
        if (userSeekRef.current === null) setSeek(time);
      },
      onSongEnd: () => setEndSong(true),
      onPreviousSong: () => setPreviousSong(true),
      onNextSong: () => setEndSong(true),
    });
    playerRef.current = player;

    // CORRECCIÓN DEL BUG DE VOLUMEN:
    // Aplicamos el volumen actual a la nueva instancia del reproductor.
    player.setVolume(volume);

    if (isPlaying) {
      player.play();
    }

    return () => {
      player.destroy();
      playerRef.current = null;
    };
  }, [selectedSong, root]);

  useEffect(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    playerRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (userSeek === undefined || userSeek === null) return;
    userSeekRef.current = userSeek;
    playerRef.current?.seek(userSeek);
    setTimeout(() => {
      userSeekRef.current = null;
    }, 500);
  }, [userSeek]);

  return null;
};

SongPlayer.displayName = "SongPlayer";

SongPlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
  setIsPlaying: PropTypes.func.isRequired,
  selectedSong: PropTypes.object,
  root: PropTypes.string.isRequired,
  setPreviousSong: PropTypes.func.isRequired,
  setEndSong: PropTypes.func.isRequired,
  volume: PropTypes.number.isRequired,
  setSeek: PropTypes.func.isRequired,
  userSeek: PropTypes.number,
};

export default SongPlayer;
