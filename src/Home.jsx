import { useState, useEffect } from "react";
import Playlists from "./utils/plays.json";
import App from "./App";

const Home = () => {
  const [playlistSelected, setPlaylistSelected] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [songs, setSongs] = useState([]);

  //Charge playlists from JSON
  useEffect(() => {
    setPlaylists(Playlists);
  }, []);

  //Select playlist
  const selectPlaylist = (playlist) => {
    setPlaylist(playlist);
    setPlaylistSelected(true);
  };

  //update playlist selected import EcmaScript 6
  useEffect(() => {
    if (playlistSelected) {
      import(`./Music/${playlist.root}/${playlist.play}.json`).then((data) => {
        setSongs(data.default);
      });
    }
  }, [playlistSelected, playlist]);

  return (
    <>
      {/* Show playlist div is onClinck and coloring background only playlist selected */}
      <div style={{ display: "flex", gap: "2rem" }}>
        {playlists.map((plays) => (
          <div
            key={plays.id}
            onClick={() => selectPlaylist(plays)}
            style={{
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
              alignItems: "center",
              lineHeight: "0",
              backgroundColor: playlistSelected && plays.id === playlist.id ? "lightblue" : "white",
            }}
          >
            <h2>{plays.name}</h2>
            <h3>{plays.artist}</h3>
            <h4>{plays.tracks} songs</h4>
            <p>{plays.description}</p>
            <img
              src={plays.cover}
              alt={plays.name}
              style={{ width: "50px", height: "50px", objectFit: "cover", marginBottom: "2rem" }}
            />
          </div>
        ))}
      </div>
      {playlistSelected && songs.length > 0 ? (
        <App playlist={songs} folder={playlist.root} />
      ) : (
        <h1>Seleccciona una playlist para empezar</h1>
      )}
    </>
  );
};

export default Home;
