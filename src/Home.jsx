import { useState, useEffect } from "react";
// import Playlists from "./utils/plays.json";
import App from "./App";

const Home = () => {
  const [playlistSelected, setPlaylistSelected] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [songs, setSongs] = useState([]);
  const [changePlaylist, setChangePlaylist] = useState(false);

  const URL_BASE = "https://music-fragments.s3.fr-par.scw.cloud/";

  //FECTH playlistsm from url an setPlaylists
  useEffect(() => {
    const fetchPlaylists = async () => {
      const response = await fetch(URL_BASE + "plays.json");
      const data = await response.json();
      setPlaylists(data);
    };
    fetchPlaylists();
  }, []);

  //Select playlist
  const selectPlaylist = (playlist) => {
    setPlaylist(playlist);
    setPlaylistSelected(true);
  };

  //update playlist selected import EcmaScript 6
  useEffect(() => {
    // if (playlistSelected) {
    //   import(`./Music/${playlist.root}/${playlist.play}.json`).then((data) => {
    //     setSongs(data.default);
    //   });
    // }

    const fetchPlaylists = async () => {
      if (!playlistSelected) return;
      const response = await fetch(URL_BASE + playlist.root + "/" + playlist.play + ".json");
      const data = await response.json();
      setSongs(data);
    };
    fetchPlaylists();
  }, [playlistSelected, playlist]);

  //update folder
  useEffect(() => {
    if (playlistSelected) {
      setSongs(playlist);
    }
  }, [playlist, playlistSelected]);

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
        <App
          URL_BASE={URL_BASE}
          playlist={songs}
          folder={playlist.root}
          changePlaylist={changePlaylist}
          setChangePlaylist={setChangePlaylist}
        />
      ) : (
        <h1>¡Seleccciona una playlist para empezar!</h1>
      )}
    </>
  );
};

export default Home;
