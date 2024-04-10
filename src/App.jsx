import { useEffect, useState } from "react";
import SongPlayer from "./components/SongPlayer";
import { FastAverageColor } from "fast-average-color";
import PropTypes from "prop-types";
import Lyrics from "./components/Lyrics";

const App = ({ URL_BASE, playlist, folder, changePlaylist, setChangePlaylist }) => {
  const [songs, setSongs] = useState(playlist);
  const [selectedSong, setSelectedSong] = useState(null);
  const [random, setRandom] = useState(false);
  const [endSong, setEndSong] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [previousSong, setPreviousSong] = useState(null);
  const [image, setImage] = useState(null);
  const [folderRoot] = useState("Music");
  const [seek, setSeek] = useState(0);
  const [userSeek, setUserSeek] = useState(0);
  const [lyrics, setLyrics] = useState(null);

  //initialize selectedSong null
  useEffect(() => {
    setSelectedSong(null);
  }, []);

  // CONTINUE SONGS
  useEffect(() => {
    if (!selectedSong) return;
    const playNext = () => {
      if (endSong) {
        const index = songs.findIndex((song) => song.id === selectedSong.id);
        setSelectedSong(songs[index + 1] || null);
        setPreviousSong(false);
        setEndSong(false);
      }
    };

    playNext();
  }, [endSong, selectedSong, songs]);

  //previous song
  useEffect(() => {
    const playPrevious = () => {
      if (previousSong) {
        const index = songs.findIndex((song) => song.id === selectedSong.id);
        setSelectedSong(songs[index - 1] || songs[songs.length - 1]);
        setPreviousSong(false);
        setEndSong(false);
      }
    };

    playPrevious();
  }, [previousSong]);

  useEffect(() => {
    function shuffleArray(array) {
      const shuffledArray = [...array];
      for (let i = shuffledArray.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[randomIndex]] = [shuffledArray[randomIndex], shuffledArray[i]];
      }
      //set current song to the top and shuffle the rest
      const index = shuffledArray.findIndex((song) => song.id === selectedSong.id);
      const currentSong = shuffledArray[index];
      shuffledArray.splice(index, 1);
      shuffledArray.unshift(currentSong);
      setSongs(shuffledArray);
    }

    if (random) {
      shuffleArray(songs);
    }
  }, [random]);

  //force refresh checkboxes when next song is pressed
  useEffect(() => {
    if (selectedSong) {
      setChangePlaylist(false);
      setSelectedSong(selectedSong);
    }
  }, [selectedSong, setChangePlaylist]);

  //create mediaSession and update when selectedSong changes

  //charge image dinamically
  useEffect(() => {
    // import(`./${folderRoot}/${folder}/${selectedSong.artist}/${selectedSong.title}/cover.webp`).then((module) => {
    //   setImage(module.default);
    // });
    if (!selectedSong) return;
    setSeek(0);

    const fetchImages = async () => {
      if (!playlist) return;
      const response = await fetch(
        URL_BASE + folder + "/" + selectedSong.artist + "/" + selectedSong.title + "/" + "cover.webp"
      );
      const data = await response.blob();
      const url = URL.createObjectURL(data);
      setImage(url);
    };
    fetchImages();
  }, [selectedSong, URL_BASE, folder, folderRoot, playlist]);

  //charge LRC lyrics dinamically
  useEffect(() => {
    if (!selectedSong) return;
    const fetchLyrics = async () => {
      try {
        const response = await fetch(
          URL_BASE + folder + "/" + selectedSong.artist + "/" + selectedSong.title + "/" + "lyrics.lrc"
        );
        const data = await response.text();
        if (data.includes("NoSuchKey")) {
          setLyrics(null);
          return;
        }
        setLyrics(data);
      } catch (error) {
        setLyrics(null);
      }
    };
    fetchLyrics();
  }, [selectedSong, URL_BASE, folder]);

  //listen changes playlist
  useEffect(() => {
    setSongs(playlist);
    // setSelectedSong(playlist[0]);
    setSeek(0);
    setChangePlaylist(true);
  }, [playlist]);

  //handle seek and change value and update setInterval to change seek +1 every second from new value
  const handleSeek = (e) => {
    setSeek(parseInt(e.target.value));
    setUserSeek(parseInt(e.target.value));
  };

  //if seek is equal to song length, next song
  useEffect(() => {
    if (!selectedSong) return;
    if (seek === parseInt(selectedSong.length)) {
      setEndSong(true);
    }
  }, [seek, selectedSong]);

  //GET COLOR IMAGE AND SET BACKGROUND AND COLOR
  useEffect(() => {
    if (!image) return;
    const fac = new FastAverageColor();
    fac
      .getColorAsync(image, { algorithm: "dominant" })
      .then((color) => {
        const root = document.documentElement;
        root.style.setProperty("background-color", color.hex);
        root.style.setProperty("color", color.isDark ? "white" : "black");
      })
      .catch((e) => {
        console.error(e);
      });
  }, [image]);

  return (
    <div>
      {/* Checkbox to select song */}
      <div style={{ display: "flex", gap: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {songs.map((song) => (
            <div key={song.id}>
              <input
                type="radio"
                id={song.id}
                name="song"
                value={song.id}
                checked={selectedSong ? selectedSong.id === song.id : false}
                onChange={() => setSelectedSong(song)}
              />
              <label htmlFor={song.id}>
                {song.artist} - {song.title}
              </label>
            </div>
          ))}
        </div>
        {/* render Image cover */}
        {/* {image && <img src={image} style={{ width: "400px", height: "400px" }} alt="cover" />} */}
      </div>

      {/* Checkbox for randomizer */}
      <div>
        <input type="checkbox" id="random" name="random" checked={random} onChange={() => setRandom(!random)} />
        <label htmlFor="random">Random</label>
      </div>

      {/* slider range for volume */}
      <div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />
      </div>

      {/* render song title and artist */}
      <h2>
        {selectedSong && (
          <>
            {selectedSong.title} - {selectedSong.artist}
          </>
        )}
      </h2>
      <div style={{ width: "100%", display: "flex" }}>
        {/* <span>0:00</span> */}
        <span>{new Date(seek * 1000).toISOString().substr(14, 5)}</span>
        {/* duation bar based on selectedSong.length like input range*/}
        <input
          style={{ flex: "1" }}
          value={seek}
          type="range"
          min="0"
          max={selectedSong ? selectedSong.length : 0}
          step="1"
          onChange={handleSeek}
        />
        {selectedSong ? (
          <>
            <span>{new Date(selectedSong.length * 1000).toISOString().substr(14, 5)}</span>
          </>
        ) : (
          <span>00:00</span>
        )}
      </div>

      <br />

      {/* SONGPLAYER */}
      <SongPlayer
        root={`${URL_BASE}${folder}`}
        artist={selectedSong ? selectedSong.artist : ""}
        song={selectedSong ? selectedSong.title : ""}
        setPreviousSong={setPreviousSong}
        setEndSong={setEndSong}
        totalFragments={selectedSong ? selectedSong.fragments : 0}
        volume={volume}
        setSeek={setSeek}
        userSeek={userSeek}
        changePlaylist={changePlaylist}
      />

      <br />
      <br />
      {selectedSong && (
        <div>
          <h3>Letra</h3>
          {lyrics === null ? (
            <div>No hay letra disponible</div>
          ) : (
            <>
              <Lyrics lyrics={lyrics} timeElapsed={seek} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;

App.propTypes = {
  URL_BASE: PropTypes.string,
  playlist: PropTypes.array,
  folder: PropTypes.string,
  changePlaylist: PropTypes.bool,
  setChangePlaylist: PropTypes.func,
};
