import { useState, useEffect, lazy, Suspense } from "react";
import "./index.css";
import Playlist from "./components/icons/Playlist";
import Bienvenida from "./components/Bienvenida";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";

const App = lazy(() => import("./App"));

const Home = () => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openPlaylist, setOpenPlaylist] = useState(false);

  const URL_BASE = "https://music-fragments.s3.fr-par.scw.cloud/";

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await fetch(URL_BASE + "plays.json");
        const data = await response.json();
        setPlaylists(data);
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
      }
    };
    fetchPlaylists();
  }, []);

  const selectPlaylist = async (playlist) => {
    if (selectedPlaylist?.id === playlist.id) return;

    setIsLoading(true);
    setSelectedPlaylist(playlist);
    setSongs([]);

    try {
      const response = await fetch(URL_BASE + playlist.root + "/" + playlist.play + ".json");
      const data = await response.json();
      setSongs(data);
    } catch (error) {
      console.error("Failed to fetch songs for playlist:", error);
      setSelectedPlaylist(null);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlaylist = () => {
    setOpenPlaylist((prevState) => !prevState);
  };

  const renderPlaylists = (isMobile = false) => (
    <div className="text-sm w-full items-center flex flex-col text-white pl-1 pr-2 gap-y-1">
      {playlists.map((plays) => (
        <div
          key={plays.id}
          onClick={() => {
            selectPlaylist(plays);
            if (isMobile) togglePlaylist();
          }}
          className={`p-2 w-full cursor-pointer rounded-lg hover:bg-black/30 transition duration-300 ease-in-out flex gap-x-2 items-center ${
            selectedPlaylist && plays.id === selectedPlaylist.id ? "bg-black/50 hover:bg-black/60" : ""
          }`}
        >
          <img src={plays.cover} alt={plays.name} className="w-12 h-w-12 object-cover rounded-xl" loading="lazy" />
          <div className="flex flex-col">
            <p className="font-bold m-0">{plays.name}</p>
            <p>{plays.tracks} songs</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-row w-full h-screen overflow-hidden hover:cursor-default">
      {/* LEFT - DESKTOP */}
      <div className="hidden sm:block sm:w-[230px] py-5 bg-black/50 text-black overflow-y-auto">
        <div className="flex w-full justify-center items-center ">
          <img
            className="w-32 h-w-32 object-cover mb-3 invert"
            src="https://cdn-icons-png.flaticon.com/512/14793/14793826.png"
            alt="Logo music player"
            loading="eager"
          />
        </div>
        <article className="w-full py-4 pl-5 rounded-r-3xl bg-gradient-to-r from-black/80 to-black/0 flex gap-x-2 mb-5">
          <div className="size-8 object-cover">
            <Playlist color={"#fff"} />
          </div>
          <h2 className="font-bold text-lg text-white">Playlists</h2>
        </article>
        {renderPlaylists()}
      </div>

      {/* MOBILE DRAWER */}
      <button className="sm:hidden bg-slate-400/90 p-3 w-40 rounded-md h-20 absolute bottom-0 left-0 text-center z-10" onClick={togglePlaylist}>
        Playlists
      </button>
      <Drawer
        open={openPlaylist}
        onClose={togglePlaylist}
        direction="bottom"
        className="overflow-y-auto"
        size={"60vh"}
        enableOverlay
        style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      >
        <article className="w-full py-4 pl-5 rounded-r-3xl bg-gradient-to-r from-black/80 to-black/0 flex gap-x-2 mb-5">
          <div className="size-8 object-cover">
            <Playlist color={"#fff"} />
          </div>
          <h2 className="font-bold text-lg text-white">Playlists</h2>
        </article>
        {renderPlaylists(true)}
      </Drawer>

      {/* CENTER */}
      <div className="flex overflow-y-auto w-full">
        {selectedPlaylist && !isLoading && songs.length > 0 ? (
          <Suspense fallback={<div className="w-full h-full bg-gray-800 animate-pulse"></div>}>
            <App URL_BASE={URL_BASE} playlist={songs} playlistData={selectedPlaylist} folder={selectedPlaylist.root} />
          </Suspense>
        ) : isLoading ? (
          <div className="w-full h-full bg-gray-800 animate-pulse"></div>
        ) : (
          <Bienvenida />
        )}
      </div>
    </div>
  );
};

export default Home;
