import { useEffect, useState } from "react";
import SongPlayer from "./components/SongPlayer";

const App = () => {
  const initialSongs = [
    {
      id: 1,
      title: "Mujer",
      artist: "Alux Nahual",
      length: "278.047347",
      album: "Leyenda (Oficial)",
      date: "1990-05-05",
      fragments: 28,
    },
    {
      id: 2,
      title: "Flaca",
      artist: "Andr\u00e9s Calamaro",
      length: "276.166531",
      album: "Andres",
      date: "2009-04-06",
      fragments: 28,
    },
    {
      id: 3,
      title: "Dile al Amor",
      artist: "Aventura",
      length: "229.407347",
      album: "The Last",
      date: "2009-06-09",
      fragments: 23,
    },
    {
      id: 4,
      title: "El Perdedor",
      artist: "Aventura",
      length: "215.248980",
      album: "Todav\u00eda Me Amas: Lo Mejor de Aventura",
      date: "2016-02-05",
      fragments: 22,
    },
    {
      id: 5,
      title: "Los Infieles",
      artist: "Aventura",
      length: "257.227755",
      album: "K.O.B. Live",
      date: "2006-12-19",
      fragments: 26,
    },
    {
      id: 6,
      title: "D\u00c1KITI",
      artist: "Bad Bunny",
      length: "205.139592",
      album: "D\u00c1KITI",
      date: "2020-10-30",
      fragments: 21,
    },
    {
      id: 7,
      title: "Blah, Blah, Blah",
      artist: "Cartel De Santa",
      length: "179.617959",
      album: "Greatest - Hits",
      date: "2007-05-22",
      fragments: 18,
    },
    {
      id: 8,
      title: "De Los Besos Que Te Di",
      artist: "Christian Nodal",
      length: "167.523265",
      album: "De Los Besos Que Te Di",
      date: "2019-04-15",
      fragments: 17,
    },
    {
      id: 9,
      title: "La Ciudad Del Olvido",
      artist: "El Trono de Mexico",
      length: "189.727347",
      album: "Lo Mejor De",
      date: "2012-01-01",
      fragments: 19,
    },
  ];
  const [songs, setSongs] = useState(initialSongs);
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
  }, [endSong]);

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
    import(`./${folderRoot}/${selectedSong.artist}/${selectedSong.title}/cover.webp`).then((module) => {
      setImage(module.default);
    });
  }, [selectedSong]);

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
        {image && <img src={image} alt="cover" />}
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
      <br />

      {/* SONGPLAYER */}
      <SongPlayer
        root={`../${folderRoot}`}
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
