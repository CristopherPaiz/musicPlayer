import { useState, useEffect, lazy, Suspense } from "react";
import "./index.css";
import Playlist from "./components/icons/Playlist";
import Bienvenida from "./components/Bienvenida";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import SongListSkeleton from "./components/skeletons/SongListSkeleton";

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

  const togglePlaylist = () => setOpenPlaylist((prevState) => !prevState);

  const renderPlaylists = (isMobile = false) => (
    <div className="p-2">
      {playlists.map((plays) => (
        <div
          key={plays.id}
          onClick={() => {
            selectPlaylist(plays);
            if (isMobile) togglePlaylist();
          }}
          className={`flex items-center gap-4 p-2 w-full cursor-pointer rounded-lg transition-colors duration-200 ${
            selectedPlaylist?.id === plays.id ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <img src={plays.cover} alt={plays.name} className="size-12 object-cover rounded-md" loading="lazy" />
          <div className="text-white">
            <p className="font-bold">{plays.name}</p>
            <p className="text-sm opacity-70">{plays.tracks} songs</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex w-full h-screen bg-black text-white overflow-hidden">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden sm:flex flex-col w-[250px] bg-black flex-shrink-0">
        <div className="p-4">
          <img className="w-32 invert" src="https://cdn-icons-png.flaticon.com/512/14793/14793826.png" alt="Logo" />
        </div>
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <Playlist color={"#fff"} />
          <h2 className="font-bold text-lg">Playlists</h2>
        </div>
        <nav className="flex-grow overflow-y-auto">{renderPlaylists()}</nav>
      </aside>

      {/* MOBILE PLAYLIST DRAWER */}
      <button className="sm:hidden fixed bottom-4 left-4 z-20 bg-white/20 backdrop-blur-md p-3 rounded-full shadow-lg" onClick={togglePlaylist}>
        <Playlist color={"#fff"} />
      </button>
      <Drawer open={openPlaylist} onClose={togglePlaylist} direction="left" className="!w-64 !bg-black">
        <div className="p-4">
          <img className="w-32 invert" src="https://cdn-icons-png.flaticon.com/512/14793/14793826.png" alt="Logo" />
        </div>
        {renderPlaylists(true)}
      </Drawer>

      {/* MAIN CONTENT */}
      <main className="flex-grow flex flex-col overflow-hidden">
        {selectedPlaylist ? (
          <Suspense fallback={<SongListSkeleton count={15} />}>
            <App
              key={selectedPlaylist.id}
              URL_BASE={URL_BASE}
              playlist={songs}
              playlistData={selectedPlaylist}
              folder={selectedPlaylist.root}
              isLoading={isLoading}
            />
          </Suspense>
        ) : (
          <Bienvenida />
        )}
      </main>
    </div>
  );
};

export default Home;
