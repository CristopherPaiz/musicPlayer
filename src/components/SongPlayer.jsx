import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import PropTypes from "prop-types";
import SkipBack from "./icons/SkipBack";
import Pause from "./icons/Pause";
import Play from "./icons/Play";
import Stop from "./icons/Stop";
import SkipForward from "./icons/SkipForward";

const SongPlayer = ({
  colorText,
  root,
  artist,
  song,
  setPreviousSong,
  setEndSong,
  totalFragments,
  volume,
  setSeek,
  userSeek,
  changePlaylist,
}) => {
  const sound = useRef(null);
  const numberOfFragments = useRef(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seekPlayer, setSeekPlayer] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let attemptCount = 0; // Initialize attempt counter

    const preloadNext = () => {
      if (attemptCount >= 2) {
        clearInterval(preloadTimer);
        return;
      }

      const nextFragment = numberOfFragments.current + 1;
      const howl = new Howl({
        src: `${root}/${artist}/${song}/${nextFragment}.mp3`,
        preload: true,
        format: ["mp3"],
        onloaderror: () => {
          attemptCount++;
        },
      });

      howl.once("load", () => {
        attemptCount = 0;
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
      sound.current = new Howl({
        src: `${root}/${artist}/${song}/${numberOfFragments.current}.mp3`,
        format: ["mp3"],
        preload: true,
        volume: sound.current.volume(),
        onend: playNext,
      });
      sound.current.play();
      //add time of the fragment to the seek
    }
  };

  const playPrevious = async () => {
    if (numberOfFragments.current === 1) {
      setPreviousSong(true);
    }
    sound.current.stop();
    setSeek(0);
    numberOfFragments.current = 1;
    sound.current = new Howl({
      src: `${root}/${artist}/${song}/1.mp3`,
      volume: sound.current.volume(),
      onend: playNext,
    });
    sound.current.play();
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

  // const resetPlaying = () => {
  //   setIsPlaying(false);
  //   setSeek(0);
  //   numberOfFragments.current = 1;
  //   if (sound.current) {
  //     sound.current.stop();
  //     sound.current = null;
  //   }
  // };

  useEffect(() => {
    if (sound.current) {
      sound.current.stop();
      sound.current = null;
      setIsPlaying(false);
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
    // if sound is playing, set ttime to setSeek
    if (sound.current) {
      sound.current.on("play", () => {
        setInterval(() => {
          setElapsedTime(sound.current.seek());
        }, 1015);
      });
    }
  }, [sound.current]);

  //listen elapsed time
  useEffect(() => {
    if (sound.current && parseInt(elapsedTime) >= 0 && parseInt(elapsedTime) <= 10) {
      setSeek(numberOfFragments.current * 10 + sound.current.seek() - 10);
    }
  }, [elapsedTime, setSeek]);

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
  }, [userSeek, root, artist, song, totalFragments]);

  //if seekPlayer change seek current fragment
  useEffect(() => {
    if (sound.current) {
      sound.current.seek(seekPlayer);
    }
  }, [seekPlayer]);

  //if root changes stop sound
  useEffect(() => {
    if (sound.current) {
      sound.current.stop();
      sound.current = null;
    }
  }, [root]);

  //if song change when is not playing, start playing, if is playing stop and start playing
  useEffect(() => {
    if (song === null || song === undefined || song === "") {
      setIsPlaying(false);
    }

    if (changePlaylist && sound.current) {
      sound.current.stop();
      sound.current = null;
      setIsPlaying(false);
      return;
    }

    if (!changePlaylist) {
      if (isPlaying) {
        if (sound.current) {
          sound.current.stop();
          sound.current = null;
        }
        startPlaying();
      } else {
        startPlaying();
      }
    }
  }, [changePlaylist, song]);

  return (
    <div className="relative flex flex-row justify-center ">
      <div className="flex gap-8">
        <button
          onClick={() => playPrevious()}
          style={{ border: `4px solid transparent` }}
          className=" rounded-full p-2 hover:scale-105"
        >
          <SkipBack color={colorText} />
        </button>
        <button
          onClick={() => (isPlaying ? pausePlaying() : startPlaying())}
          style={{ border: `4px solid ${colorText}` }}
          className="border-4 rounded-full p-2 hover:scale-105"
        >
          {isPlaying ? <Pause color={colorText} /> : <Play color={colorText} />}
        </button>

        <button
          onClick={() => setEndSong(true)}
          style={{ border: `4px solid transparent` }}
          className="border-4 rounded-full p-2 hover:scale-105"
        >
          <SkipForward color={colorText} />
        </button>
      </div>
    </div>
  );
};

export default SongPlayer;

SongPlayer.propTypes = {
  colorText: PropTypes.string,
  root: PropTypes.string.isRequired,
  artist: PropTypes.string.isRequired,
  song: PropTypes.string.isRequired,
  setPreviousSong: PropTypes.func,
  setEndSong: PropTypes.func.isRequired,
  totalFragments: PropTypes.number,
  volume: PropTypes.number,
  setSeek: PropTypes.func,
  userSeek: PropTypes.number,
  changePlaylist: PropTypes.bool,
};
