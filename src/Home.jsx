import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from "react";
import { FastAverageColor } from "fast-average-color";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import { API_URL } from "./config";
import { usePlayer } from "./context/PlayerContext";
import Playlist from "./components/icons/Playlist";
import Bienvenida from "./components/Bienvenida";
import SongListSkeleton from "./components/skeletons/SongListSkeleton";
import MiniPlayer from "./components/player/MiniPlayer";
import BottomNav from "./components/player/BottomNav";
import NowPlayingView from "./components/player/NowPlayingView";
import QueuePanel from "./components/player/QueuePanel";
import PlayerControls from "./components/player/PlayerControls";
import VolumeIcon from "./components/icons/Volume";
import { getHighContrastTextColor } from "./utils/colorUtils";

const PlaylistView = lazy(() => import("./PlaylistView"));
const fac = new FastAverageColor();

const Home = () => {
  const {
    queue,
    currentSong,
    isPlaying,
    random,
    setRandom,
    volume,
    setVolume,
    setUserSeek,
    lyrics,
    currentImage,
    setCurrentSong: handleSelectSong,
    skipSong,
    handleSkipBack,
    handleTogglePlayPause,
  } = usePlayer();

  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaylistsLoading, setIsPlaylistsLoading] = useState(true);
  const [colors, setColors] = useState({ hex: "#1db954", dark: "#121212", light: "#282828", text: "#FFFFFF", textLight: "#FFFFFF" });
  const [isPlaylistDrawerOpen, setPlaylistDrawerOpen] = useState(false);
  const [isQueueDrawerOpen, setQueueDrawerOpen] = useState(false);
  const [isNowPlayingOpenMobile, setNowPlayingOpenMobile] = useState(false);
  const [showLyricsMobile, setShowLyricsMobile] = useState(false);
  const [mainDesktopView, setMainDesktopView] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const handlePopState = () => {
      if (showLyricsMobile) {
        setShowLyricsMobile(false);
      } else if (isNowPlayingOpenMobile) {
        setNowPlayingOpenMobile(false);
      } else if (mainDesktopView === "lyrics") {
        setMainDesktopView("list");
      } else if (selectedPlaylist) {
        setSelectedPlaylist(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isNowPlayingOpenMobile, selectedPlaylist, mainDesktopView, showLyricsMobile]);

  useEffect(() => {
    const fetchPlaylists = async () => {
      setIsPlaylistsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/playlists`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setPlaylists(data);
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
      } finally {
        setIsPlaylistsLoading(false);
      }
    };
    fetchPlaylists();
  }, []);

  const selectPlaylist = useCallback(
    async (playlist) => {
      if (isPlaylistDrawerOpen) setPlaylistDrawerOpen(false);
      if (selectedPlaylist?.id === playlist.id) {
        setMainDesktopView("list");
        return;
      }

      window.history.pushState({ playlistId: playlist.id }, "", "/");

      setMainDesktopView("list");
      setSelectedPlaylist(playlist);
      setPlaylistSongs([]);
      setIsLoading(true);
      setSearchTerm("");
      try {
        const response = await fetch(`${API_URL}/api/playlists/${playlist.id}`);
        const data = await response.json();
        setPlaylistSongs(data.canciones);
      } catch (error) {
        setSelectedPlaylist(null);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedPlaylist, isPlaylistDrawerOpen]
  );

  const onSelectSongFromList = (song) => {
    handleSelectSong(song, playlistSongs);
    if (mainDesktopView !== "lyrics") {
      window.history.pushState({ view: "lyricsDesktop" }, "", "/");
      setMainDesktopView("lyrics");
    }
  };

  const openNowPlaying = () => {
    window.history.pushState({ view: "nowPlaying" }, "", "/");
    setNowPlayingOpenMobile(true);
  };

  const openMobileLyrics = () => {
    window.history.pushState({ view: "lyricsMobile" }, "", "/");
    setShowLyricsMobile(true);
  };

  useEffect(() => {
    if (!currentImage) {
      const defaultColors = { hex: "#1db954", dark: "#121212", light: "#282828", text: "#FFFFFF", textLight: "#FFFFFF" };
      setColors(defaultColors);
      return;
    }
    fac
      .getColorAsync(currentImage)
      .then((color) => {
        const backgroundColor = color.isDark
          ? `rgb(${color.value.map((c) => c * 0.7).join(",")})`
          : `rgb(${color.value.map((c) => c * 0.8).join(",")})`;
        const activeLyricColor = color.isDark
          ? `rgb(${color.value.map((c) => Math.min(255, c * 2)).join(",")})`
          : `rgb(${color.value.map((c) => c * 0.5).join(",")})`;
        const highContrastText = getHighContrastTextColor(backgroundColor);
        const newColors = {
          hex: color.hex,
          dark: backgroundColor,
          light: `rgb(${color.value.map((c) => Math.min(255, c * 1.5)).join(",")})`,
          text: highContrastText,
          textLight: activeLyricColor,
        };
        setColors(newColors);
      })
      .catch(() => {});
  }, [currentImage]);

  const filteredSongs = useMemo(() => {
    if (!searchTerm) return playlistSongs;
    return playlistSongs.filter(
      (song) => song.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || song.artista.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, playlistSongs]);

  const commonPlayerProps = {
    currentSong,
    isPlaying,
    onTogglePlayPause: handleTogglePlayPause,
    onSkipBack: handleSkipBack,
    onSkipForward: () => skipSong("forward"),
    setUserSeek: setUserSeek,
    random,
    setRandom,
    accentColor: colors.hex,
  };

  return (
    <div className="flex flex-col w-full h-dvh bg-black text-white overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden sm:flex flex-col w-[250px] flex-shrink-0 transition-colors duration-500" style={{ backgroundColor: colors.dark }}>
          <div className="p-4">
            <img className="w-32 invert" src="https://cdn-icons-png.flaticon.com/512/14793/14793826.png" alt="Logo" />
          </div>
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <Playlist className="size-6" color="#fff" />
            <h2 className="font-bold text-lg">Playlists</h2>
          </div>
          <nav className="flex-grow overflow-y-auto px-2">
            {playlists.map((plays) => (
              <div
                key={plays.id}
                onClick={() => selectPlaylist(plays)}
                className={`flex items-center gap-4 p-2 w-full cursor-pointer rounded-lg transition-colors duration-200 ${
                  selectedPlaylist?.id === plays.id ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <img src={plays.cover_url} alt={plays.nombre} className="size-12 object-cover rounded-md" loading="lazy" />
                <div className="text-white text-left overflow-hidden">
                  <p className="font-bold truncate">{plays.nombre}</p>
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <main className="flex-grow flex flex-col overflow-hidden relative transition-colors duration-500" style={{ backgroundColor: colors.dark }}>
          <div
            className="absolute inset-0 w-full h-dvh"
            style={{ backgroundImage: `linear-gradient(to bottom, ${colors.hex}33 0%, ${colors.dark} 100%)` }}
          />
          <div className="relative z-10 h-dvh overflow-hidden">
            {selectedPlaylist ? (
              <Suspense fallback={<SongListSkeleton count={15} />}>
                <PlaylistView
                  playlistData={selectedPlaylist}
                  songs={filteredSongs}
                  queue={queue}
                  isLoading={isLoading}
                  onSelectSong={onSelectSongFromList}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  colors={colors}
                  desktopView={mainDesktopView}
                  desktopLyricsProps={{ currentSong, image: currentImage, lyrics, colors, onSeek: setUserSeek }}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  searchHistory={[]}
                  onSearchSubmit={() => {}}
                />
              </Suspense>
            ) : (
              <Bienvenida playlists={playlists} onPlaylistSelect={selectPlaylist} isLoading={isPlaylistsLoading} />
            )}
          </div>
        </main>
      </div>
      {currentSong && (
        <>
          <footer
            className="hidden sm:flex items-center justify-between px-4 flex-shrink-0 z-40 border-t border-white/10 h-28 transition-colors duration-500"
            style={{ backgroundColor: colors.dark }}
          >
            <div className="flex items-center gap-4 w-[30%]">
              {currentImage && <img src={currentImage} alt="cover" className="size-14 rounded" />}
              <div className="overflow-hidden">
                <p className="font-bold truncate text-sm">{currentSong.titulo}</p>
                <p className="text-xs opacity-70 truncate">{currentSong.artista}</p>
              </div>
            </div>
            <div className="flex justify-center w-[40%]">
              <PlayerControls {...commonPlayerProps} currentSong={currentSong} />
            </div>
            <div className="flex items-center justify-end gap-4 w-[30%]">
              <div className="flex items-center gap-2 w-32">
                <VolumeIcon className="size-5 text-white/70" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: colors.hex }}
                />
              </div>
            </div>
          </footer>
          <MiniPlayer
            currentSong={currentSong}
            image={currentImage}
            isPlaying={isPlaying}
            onExpand={openNowPlaying}
            onTogglePlayPause={handleTogglePlayPause}
          />
          {!isNowPlayingOpenMobile && (
            <BottomNav
              style={{ position: "fixed", backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
              onPlaylistClick={() => setPlaylistDrawerOpen(true)}
              onQueueClick={() => setQueueDrawerOpen(true)}
            />
          )}
          {isNowPlayingOpenMobile && (
            <div className="sm:hidden">
              <NowPlayingView
                currentSong={currentSong}
                onClose={() => window.history.back()}
                image={currentImage}
                lyrics={lyrics}
                colors={colors}
                volume={volume}
                setVolume={setVolume}
                playlistName={selectedPlaylist?.nombre}
                onPlaylistClick={() => setPlaylistDrawerOpen(true)}
                onQueueClick={() => setQueueDrawerOpen(true)}
                onSeek={setUserSeek}
                showLyricsMobile={showLyricsMobile}
                onShowLyrics={openMobileLyrics}
                onHideLyrics={() => window.history.back()}
                {...commonPlayerProps}
              />
            </div>
          )}
          <Drawer
            open={isPlaylistDrawerOpen}
            onClose={() => setPlaylistDrawerOpen(false)}
            direction="left"
            className="!w-64"
            style={{ backgroundColor: colors.dark }}
          >
            <div className="p-4 h-dvh flex flex-col">
              <h2 className="font-bold text-lg mb-4 flex-shrink-0">Playlists</h2>
              <nav className="flex-grow overflow-y-auto">
                {playlists.map((plays) => (
                  <div
                    key={plays.id}
                    onClick={() => selectPlaylist(plays)}
                    className="flex items-center gap-3 p-2 w-full cursor-pointer rounded-lg hover:bg-white/10"
                  >
                    <img src={plays.cover_url} alt={plays.nombre} className="size-10 object-cover rounded-md" loading="lazy" />
                    <div className="text-white text-left overflow-hidden">
                      <p className="font-semibold text-sm truncate">{plays.nombre}</p>
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </Drawer>
          <Drawer
            open={isQueueDrawerOpen}
            onClose={() => setQueueDrawerOpen(false)}
            direction="right"
            className="!w-64"
            style={{ backgroundColor: colors.dark }}
          >
            <QueuePanel songs={queue} currentSong={currentSong} onSelectSong={(song) => handleSelectSong(song, playlistSongs)} colors={colors} />
          </Drawer>
        </>
      )}
    </div>
  );
};

export default Home;
