import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import PropTypes from "prop-types";

const SongPlayer = ({ root, artist, song }) => {
  const sound = useRef(null);
  const numberOfFragments = useRef(1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const preloadNext = () => {
      const nextFragment = numberOfFragments.current + 1;
      import(`${root}/${artist}/${song}/${nextFragment}.mp3`).then((module) => {
        new Howl({
          src: [module.default],
        });
      });
    };

    const preloadTimer = setInterval(preloadNext, 8000);

    return () => {
      clearInterval(preloadTimer);
    };
  }, [root, artist, song]);

  const playNext = () => {
    numberOfFragments.current++;
    import(`${root}/${artist}/${song}/${numberOfFragments.current}.mp3`).then((module) => {
      sound.current = new Howl({
        src: [module.default],
        onend: playNext,
      });
      sound.current.play();
    });
  };

  const startPlaying = () => {
    setIsPlaying(true);
    if (!sound.current) {
      numberOfFragments.current = 1;
      import(`${root}/${artist}/${song}/${numberOfFragments.current}.mp3`).then((module) => {
        sound.current = new Howl({
          src: [module.default],
          onend: playNext,
        });
        sound.current.play();
      });
    } else {
      sound.current.play();
    }
  };

  const pausePlaying = () => {
    setIsPlaying(false);
    sound.current.pause();
  };

  const resetPlaying = () => {
    setIsPlaying(false);
    numberOfFragments.current = 1;
    if (sound.current) {
      sound.current.stop();
      sound.current = null;
    }
  };

  useEffect(() => {
    if (sound.current) {
      sound.current.stop();
      sound.current = null;
      setIsPlaying(false);
      startPlaying();
      setIsPlaying(true);
    }
  }, [artist, song]);

  return (
    <div>
      <button onClick={() => (isPlaying ? pausePlaying() : startPlaying())}>{isPlaying ? "||" : "►"}</button>
      <button onClick={() => resetPlaying()}>■</button>
    </div>
  );
};

export default SongPlayer;

SongPlayer.propTypes = {
  root: PropTypes.string.isRequired,
  artist: PropTypes.string.isRequired,
  song: PropTypes.string.isRequired,
};
