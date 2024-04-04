import { useEffect, useState } from "react";
import SongPlayer from "./components/SongPlayer";
import PropTypes from "prop-types";
import "./Music/Bachata/bachata.json";

const App = ({ playlist, folder }) => {
  const [songs, setSongs] = useState(playlist);
  const [selectedSong, setSelectedSong] = useState(songs[0]);
  const [random, setRandom] = useState(false);
  const [endSong, setEndSong] = useState(false);
  const [volume, setVolume] = useState(1);
  const [previousSong, setPreviousSong] = useState(null);
  const [image, setImage] = useState(null);
  const [folderRoot] = useState("Music");

  // CONTINUE SONGS
  useEffect(() => {
    const playNext = () => {
      if (endSong) {
        const index = songs.findIndex((song) => song.id === selectedSong.id);
        setSelectedSong(songs[index + 1] || songs[0]);
        setPreviousSong(false);
        setEndSong(false);
      }
    };

    playNext();
  }, [endSong, selectedSong.id, songs]);

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
    setSelectedSong(selectedSong);
  }, [selectedSong]);

  //charge image dinamically
  useEffect(() => {
    import(`./${folderRoot}/${folder}/${selectedSong.artist}/${selectedSong.title}/cover.webp`).then((module) => {
      setImage(module.default);
    });
  }, [selectedSong]);

  //listen changes playlist
  useEffect(() => {
    setSongs(playlist);
    setSelectedSong(playlist[0]);
  }, [playlist]);

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
                checked={selectedSong.id === song.id}
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
        {selectedSong.title} - {selectedSong.artist}
      </h2>

      {/* duation bar based on selectedSong.length */}
      <div style={{ display: "flex", gap: "2rem" }}>
        <div>{"00:00"}</div>
        <div style={{ width: "100%", backgroundColor: "lightgray" }}>
          <div
            style={{
              width: `${(selectedSong.fragments / selectedSong.length) * 100}%`,
              backgroundColor: "blue",
              height: "20px",
            }}
          ></div>
        </div>
        {/* seconds to mm:ss */}
        <div>{new Date(selectedSong.length * 1000).toISOString().substr(14, 5)}</div>
      </div>
      <br />

      {/* SONGPLAYER */}
      <SongPlayer
        root={`../${folderRoot}/${folder}`}
        artist={selectedSong.artist}
        song={selectedSong.title}
        setPreviousSong={setPreviousSong}
        setEndSong={setEndSong}
        totalFragments={selectedSong.fragments}
        volume={volume}
      />
    </div>
  );
};

export default App;

App.propTypes = {
  playlist: PropTypes.array,
  folder: PropTypes.string,
};
