import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import PropTypes from "prop-types";

const SongPlayer = ({ root, artist, song, setPreviousSong, setEndSong, totalFragments, volume, setSeek, userSeek }) => {
  const sound = useRef(null);
  const numberOfFragments = useRef(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seekPlayer, setSeekPlayer] = useState(0);

  useEffect(() => {
    const preloadNext = () => {
      const nextFragment = numberOfFragments.current + 1;
      // import(`${root}/${artist}/${song}/${nextFragment}.mp3`).then((module) => {
      //   new Howl({
      //     src: [module.default],
      //   });
      // });
      new Howl({
        src: `${root}/${artist}/${song}/${nextFragment}.mp3`,
      });
    };

    const preloadTimer = setInterval(preloadNext, 5000);

    return () => {
      clearInterval(preloadTimer);
    };
  }, [root, artist, song, volume]);

  const playNext = async () => {
    numberOfFragments.current++;
    if (numberOfFragments.current > totalFragments) {
      setEndSong(true);
    } else {
      setEndSong(false);
      // import(`${root}/${artist}/${song}/${numberOfFragments.current}.mp3`).then((module) => {
      //   sound.current = new Howl({
      //     src: [module.default],
      //     volume: sound.current.volume(),
      //     onend: playNext,
      //   });
      //   sound.current.play();
      // });
      sound.current = new Howl({
        src: `${root}/${artist}/${song}/${numberOfFragments.current}.mp3`,
        volume: sound.current.volume(),
        onend: playNext,
      });
      sound.current.play();
    }
  };

  const playPrevious = async () => {
    numberOfFragments.current--;
    if (numberOfFragments.current < 1) {
      setPreviousSong(true);
    } else {
      numberOfFragments.current = 1;
      sound.current.stop();
      setPreviousSong(false);
      // import(`${root}/${artist}/${song}/1.mp3`).then((module) => {
      //   sound.current = new Howl({
      //     src: [module.default],
      //     volume: sound.current.volume(),
      //     onend: playPrevious,
      //   });
      //   sound.current.play();
      // });
      sound.current = new Howl({
        src: `${root}/${artist}/${song}/1.mp3`,
        volume: sound.current.volume(),
        onend: playPrevious,
      });
      sound.current.play();
    }
  };

  const startPlaying = async () => {
    setIsPlaying(true);
    if (!sound.current) {
      numberOfFragments.current = 1;
      // import(`${root}/${artist}/${song}/${numberOfFragments.current}.mp3`).then((module) => {
      //   sound.current = new Howl({
      //     src: [module.default],
      //     volume: volume,
      //     onend: playNext,
      //   });
      //   sound.current.play();
      // });
      sound.current = new Howl({
        src: `${root}/${artist}/${song}/${numberOfFragments.current}.mp3`,
        volume: volume,
        onend: playNext,
      });
      sound.current.play();
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

  //Update volume for all fragments
  useEffect(() => {
    if (sound.current) {
      sound.current.volume(volume);
    }
  }, [volume]);

  //print each second the current time
  useEffect(() => {
    const timer = setInterval(() => {
      if (sound.current) {
        setSeek(numberOfFragments.current * 10 + sound.current.seek() - 10);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [sound.current]);

  //if userSeek has changed, change seek of the player change the fragment number and the seek of the player
  useEffect(() => {
    if (sound.current) {
      var newValueFragment = parseInt(userSeek / 10) + 1;
      var remaingNewValueFragment = userSeek % 10;
      setSeekPlayer(remaingNewValueFragment);
      //stop song, play new fragment and set remaing time to current sound
      sound.current.stop();
      numberOfFragments.current = newValueFragment;
      // import(`${root}/${artist}/${song}/${numberOfFragments.current}.mp3`).then((module) => {
      //   sound.current = new Howl({
      //     src: [module.default],
      //     volume: volume,
      //     onend: playNext,
      //   });
      //   sound.current.play();
      //   sound.current.seek(remaingNewValueFragment);
      // });
      const fetchNewFragment = async () => {
        sound.current = new Howl({
          src: `${root}/${artist}/${song}/${numberOfFragments.current}.mp3`,
          volume: volume,
          onend: playNext,
        });
        sound.current.play();
        sound.current.seek(remaingNewValueFragment);
      };
      fetchNewFragment();
    }
  }, [userSeek]);

  //if seekPlayer change seek current fragment
  useEffect(() => {
    if (sound.current) {
      sound.current.seek(seekPlayer);
    }
  }, [seekPlayer]);

  return (
    <div>
      <button onClick={() => playPrevious()}>Previous</button>{" "}
      <button onClick={() => (isPlaying ? pausePlaying() : startPlaying())}>{isPlaying ? "||" : "►"}</button>{" "}
      <button onClick={() => resetPlaying()}>■</button> <button onClick={() => setEndSong(true)}>Next</button>
    </div>
  );
};

export default SongPlayer;

SongPlayer.propTypes = {
  root: PropTypes.string.isRequired,
  artist: PropTypes.string.isRequired,
  song: PropTypes.string.isRequired,
  setPreviousSong: PropTypes.func,
  setEndSong: PropTypes.func.isRequired,
  totalFragments: PropTypes.number,
  volume: PropTypes.number,
  setSeek: PropTypes.func,
  userSeek: PropTypes.number,
};
