import { useState, useEffect } from "react";
import App from "./App";
import "./index.css";
import Playlist from "./components/icons/Playlist";
import Bienvenida from "./components/Bienvenida";

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
      {/* Main */}
      <div className="flex flex-row w-full h-screen overflow-hidden hover:cursor-default">
        {/* LEFT */}
        <div className="sm:w-[230px] py-5 bg-black/50 text-black overflow-y-auto">
          <div className="flex w-full justify-center items-center">
            <img
              className="w-32 h-w-32 object-cover mb-3 invert"
              // src="https://cdn-icons-png.flaticon.com/512/4812/4812505.png"
              src="https://cdn-icons-png.flaticon.com/512/14793/14793826.png"
              alt="Logo music player"
              loading="eager"
            />
          </div>
          {/* TITLE PLAYLIST */}
          <article className="w-full py-4 pl-5 rounded-r-3xl bg-gradient-to-r from-black/80 to-black/0 flex gap-x-2 mb-5">
            {/* render svg playlist */}
            <div className="size-8 object-cover">
              <Playlist color={"#fff"} />
            </div>
            <h2 className="font-bold text-lg text-white">Playlists</h2>
          </article>

          <div className="flex flex-col">
            {/* PLAYLISTS */}
            <div className="text-sm w-full items-center flex flex-col text-white pl-1 pr-2 gap-y-1">
              {playlists.map((plays) => (
                <div
                  key={plays.id}
                  onClick={() => selectPlaylist(plays)}
                  className={`p-2 w-full cursor-pointer rounded-lg hover:bg-black/30 transition duration-300 ease-in-out flex gap-x-2 items-center ${
                    playlistSelected && plays.id === playlist.id ? "bg-black/50 hover:bg-black/60" : ""
                  }`}
                >
                  <img
                    src={plays.cover}
                    alt={plays.name}
                    className="w-12 h-w-12 object-cover rounded-xl"
                    loading="lazy"
                  />
                  <div className="flex flex-col">
                    <p className="font-bold m-0">{plays.name}</p>
                    <p>{plays.tracks} songs</p>
                    {/* <h3>{plays.artist}</h3> */}
                    {/* <p>{plays.description}</p> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* CENTER */}
        <div className="flex overflow-y-auto w-full">
          {playlistSelected && songs.length > 0 ? (
            <App
              URL_BASE={URL_BASE}
              playlist={songs}
              playlistData={playlist}
              folder={playlist.root}
              changePlaylist={changePlaylist}
              setChangePlaylist={setChangePlaylist}
            />
          ) : (
            <Bienvenida />
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
