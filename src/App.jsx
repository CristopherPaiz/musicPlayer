import { useEffect, useState } from "react";
import SongPlayer from "./components/SongPlayer";

const App = () => {
  const Songs = [
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

  const [selectedSong, setSelectedSong] = useState(Songs[0]);
  const [random, setRandom] = useState(false);
  const [endSong, setEndSong] = useState(false);
  const [volume, setVolume] = useState(1);

  // CONTINUE SONGS
  useEffect(() => {
    const playNext = () => {
      if (endSong) {
        if (random) {
          // numero diferente al seleccionado actual
          let index = Math.floor(Math.random() * Songs.length);
          while (Songs[index].id === selectedSong.id) {
            index = Math.floor(Math.random() * Songs.length);
          }
          setSelectedSong(Songs[index]);
          setEndSong(false);
        } else {
          const index = Songs.findIndex((song) => song.id === selectedSong.id);
          setSelectedSong(Songs[index + 1] || Songs[0]);
          setEndSong(false);
        }
      }
    };

    playNext();
  }, [endSong, random]);

  return (
    <div>
      {/* Checkbox to select song */}
      <div>
        {Songs.map((song) => (
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
      <br />
      <br />
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
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value).toFixed(2))}
        />
      </div>
      {/* Title song selected */}
      <h1>
        {selectedSong.title} - {selectedSong.artist}
      </h1>

      {/* <SongPlayer root="../usic" artist="El Trono de Mexico" song="La Ciudad Del Olvido" /> */}
      <SongPlayer
        root="../Music"
        artist={selectedSong.artist}
        song={selectedSong.title}
        setEndSong={setEndSong}
        totalFragments={selectedSong.fragments}
        volume={volume}
      />
    </div>
  );
};

export default App;
