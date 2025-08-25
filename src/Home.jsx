import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { FastAverageColor } from "fast-average-color";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";

import Playlist from "./components/icons/Playlist";
import Bienvenida from "./components/Bienvenida";
import SongListSkeleton from "./components/skeletons/SongListSkeleton";
import SongPlayer from "./components/SongPlayer";
import MiniPlayer from "./components/player/MiniPlayer";
import BottomNav from "./components/player/BottomNav";
import NowPlayingView from "./components/player/NowPlayingView";
import QueuePanel from "./components/player/QueuePanel";
import PlayerControls from "./components/player/PlayerControls";
import VolumeIcon from "./components/icons/Volume";

const PlaylistView = lazy(() => import("./PlaylistView"));

const URL_BASE = "https://music-fragments.s3.fr-par.scw.cloud/";
const fac = new FastAverageColor();

const Home = () => {
  const [playlists, setPlaylists] = useState([]);
  const [playlistCache, setPlaylistCache] = useState({});
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [queue, setQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [random, setRandom] = useState(false);
  const [volume, setVolume] = useState(1);
  const [seek, setSeek] = useState(0);
  const [userSeek, setUserSeek] = useState(undefined);
  const [lyrics, setLyrics] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [imageCache, setImageCache] = useState({});
  const [colors, setColors] = useState({ hex: "#1db954", dark: "#121212", light: "#282828", text: "#FFFFFF", textLight: "#FFFFFF" });

  const [isPlaylistDrawerOpen, setPlaylistDrawerOpen] = useState(false);
  const [isQueueDrawerOpen, setQueueDrawerOpen] = useState(false);
  const [isNowPlayingOpenMobile, setNowPlayingOpenMobile] = useState(false);
  const [mainDesktopView, setMainDesktopView] = useState("list");

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

  const selectPlaylist = useCallback(
    async (playlist) => {
      if (isPlaylistDrawerOpen) setPlaylistDrawerOpen(false);
      if (isNowPlayingOpenMobile) setNowPlayingOpenMobile(false);

      if (selectedPlaylist?.id === playlist.id) {
        setMainDesktopView("list");
        return;
      }

      setMainDesktopView("list");
      setSelectedPlaylist(playlist);
      setPlaylistSongs([]);
      setIsLoading(true);

      if (playlistCache[playlist.id]) {
        setPlaylistSongs(playlistCache[playlist.id]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${URL_BASE}${playlist.root}/${playlist.play}.json`);
        const data = await response.json();
        const songsWithUrls = data.map((song) => ({
          ...song,
          root: playlist.root,
          coverUrl: `${URL_BASE}${encodeURIComponent(playlist.root)}/${encodeURIComponent(song.artist)}/${encodeURIComponent(song.title)}/cover.webp`,
        }));
        setPlaylistCache((prev) => ({ ...prev, [playlist.id]: songsWithUrls }));
        setPlaylistSongs(songsWithUrls);
      } catch (error) {
        console.error("Failed to fetch songs for playlist:", error);
        setSelectedPlaylist(null);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedPlaylist, playlistCache, isPlaylistDrawerOpen, isNowPlayingOpenMobile]
  );

  const handleSelectSong = (song, isFromQueuePanel = false) => {
    if (currentSong?.id === song.id) {
      handleTogglePlayPause();
      return;
    }

    setCurrentSong(song);
    setIsPlaying(true);
    setMainDesktopView("lyrics");

    if (!isFromQueuePanel) {
      const sourcePlaylist = playlistSongs;
      if (random) {
        const otherSongs = sourcePlaylist.filter((s) => s.id !== song.id);
        const shuffled = otherSongs.sort(() => Math.random() - 0.5);
        setQueue([song, ...shuffled]);
      } else {
        setQueue(sourcePlaylist);
      }
    }
  };

  const handleSetRandom = (isRandom) => {
    setRandom(isRandom);
    if (!currentSong) return;

    const songOriginPlaylist = playlists.find((p) => p.root === currentSong.root);
    if (!songOriginPlaylist) return;

    const sourceList = playlistCache[songOriginPlaylist.id] || [];
    if (sourceList.length === 0) return;

    if (isRandom) {
      const otherSongs = sourceList.filter((s) => s.id !== currentSong.id);
      const shuffled = otherSongs.sort(() => Math.random() - 0.5);
      setQueue([currentSong, ...shuffled]);
    } else {
      setQueue(sourceList);
    }
  };

  const skipSong = useCallback(
    (direction) => {
      if (!currentSong || !queue || queue.length === 0) return;

      const currentIndex = queue.findIndex((s) => s.id === currentSong.id);

      if (currentIndex === -1) return;

      let nextSong = null;

      if (direction === "forward") {
        if (currentIndex < queue.length - 1) {
          nextSong = queue[currentIndex + 1];
        }
      } else {
        if (currentIndex > 0) {
          nextSong = queue[currentIndex - 1];
        }
      }

      if (nextSong) {
        setCurrentSong(nextSong);
        setIsPlaying(true);
      }
    },
    [currentSong, queue]
  );

  const handleSkipBack = useCallback(() => {
    if (!currentSong) return;

    if (seek > 5) {
      setSeek(0);
      setUserSeek(0);
    } else {
      skipSong("backward");
    }
  }, [seek, currentSong, skipSong]);

  useEffect(() => {
    if (!currentSong) {
      setCurrentImage(null);
      return;
    }
    setLyrics(null);
    setSeek(0);

    const fetchSongData = async () => {
      try {
        const { coverUrl, root, artist, title } = currentSong;
        const lrcUrl = `${URL_BASE}${encodeURIComponent(root)}/${encodeURIComponent(artist)}/${encodeURIComponent(title)}/lyrics.lrc`;

        if (imageCache[coverUrl]) {
          setCurrentImage(imageCache[coverUrl]);
        } else {
          const imgRes = await fetch(coverUrl);
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            const blobUrl = URL.createObjectURL(blob);
            setImageCache((prev) => ({ ...prev, [coverUrl]: blobUrl }));
            setCurrentImage(blobUrl);
          } else {
            setCurrentImage(null);
          }
        }

        const lrcRes = await fetch(lrcUrl);
        if (lrcRes.ok) {
          const text = await lrcRes.text();
          setLyrics(text.includes("NoSuchKey") ? null : text);
        } else {
          setLyrics(null);
        }
      } catch (error) {
        console.error("Failed to fetch song data:", error);
        setLyrics(null);
      }
    };
    fetchSongData();
  }, [currentSong]);

  useEffect(() => {
    if (!currentImage) {
      const defaultColors = { hex: "#1db954", dark: "#121212", light: "#282828", text: "#FFFFFF", textLight: "#FFFFFF" };
      setColors(defaultColors);
      return;
    }
    fac
      .getColorAsync(currentImage)
      .then((color) => {
        const newColors = {
          hex: color.hex,
          dark: color.isDark ? `rgb(${color.value.map((c) => c * 0.7).join(",")})` : `rgb(${color.value.map((c) => c * 0.8).join(",")})`,
          light: `rgb(${color.value.map((c) => Math.min(255, c * 1.5)).join(",")})`,
          text: color.isDark ? "#FFFFFF" : "#000000",
          textLight: color.isDark
            ? `rgb(${color.value.map((c) => Math.min(255, c * 2)).join(",")})`
            : `rgb(${color.value.map((c) => c * 0.5).join(",")})`,
        };
        setColors(newColors);
      })
      .catch((e) => console.error(e));
  }, [currentImage]);

  const handleSeek = (e) => {
    const newSeek = parseInt(e.target.value, 10);
    setSeek(newSeek);
    setUserSeek(newSeek);
  };

  const handleTogglePlayPause = useCallback(() => {
    if (!currentSong) return;
    setIsPlaying((prev) => !prev);
  }, [currentSong]);

  const commonPlayerProps = {
    currentSong,
    isPlaying,
    onTogglePlayPause: handleTogglePlayPause,
    onSkipBack: handleSkipBack,
    onSkipForward: () => skipSong("forward"),
    seek,
    handleSeek,
    random,
    setRandom: handleSetRandom,
    accentColor: colors.hex,
  };

  return (
    <div className="flex flex-col w-full h-dvh bg-black text-white overflow-hidden">
      <SongPlayer
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        selectedSong={currentSong}
        root={currentSong ? `${URL_BASE}${currentSong.root}` : ""}
        setPreviousSong={handleSkipBack}
        setEndSong={() => skipSong("forward")}
        volume={volume}
        setSeek={setSeek}
        userSeek={userSeek}
      />

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
                <img src={plays.cover} alt={plays.name} className="size-12 object-cover rounded-md" loading="lazy" />
                <div className="text-white text-left overflow-hidden">
                  <p className="font-bold truncate">{plays.name}</p>
                  <p className="text-sm opacity-70">{plays.tracks} songs</p>
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
                  songs={playlistSongs}
                  queue={queue}
                  isLoading={isLoading}
                  onSelectSong={handleSelectSong}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  colors={colors}
                  imageCache={imageCache}
                  setImageCache={setImageCache}
                  desktopView={mainDesktopView}
                  desktopLyricsProps={{ currentSong, image: currentImage, lyrics, seek, colors }}
                />
              </Suspense>
            ) : (
              <Bienvenida playlists={playlists} onPlaylistSelect={selectPlaylist} />
            )}
          </div>
        </main>
      </div>

      {currentSong && (
        <footer
          className="hidden sm:flex items-center justify-between px-4 flex-shrink-0 z-40 border-t border-white/10 h-28 transition-colors duration-500"
          style={{ backgroundColor: colors.dark }}
        >
          <div className="flex items-center gap-4 w-[30%]">
            {currentImage && <img src={currentImage} alt="cover" className="size-14 rounded" />}
            <div className="overflow-hidden">
              <p className="font-bold truncate text-sm">{currentSong.title}</p>
              <p className="text-xs opacity-70 truncate">{currentSong.artist}</p>
            </div>
          </div>

          <div className="flex justify-center w-[40%]">
            <PlayerControls {...commonPlayerProps} />
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
      )}

      {currentSong && (
        <>
          <MiniPlayer
            currentSong={currentSong}
            image={currentImage}
            isPlaying={isPlaying}
            onExpand={() => setNowPlayingOpenMobile(true)}
            onTogglePlayPause={handleTogglePlayPause}
            seek={seek}
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
                onClose={() => setNowPlayingOpenMobile(false)}
                image={currentImage}
                lyrics={lyrics}
                colors={colors}
                volume={volume}
                setVolume={setVolume}
                playlistName={selectedPlaylist?.name}
                onPlaylistClick={() => setPlaylistDrawerOpen(true)}
                onQueueClick={() => setQueueDrawerOpen(true)}
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
                    <img src={plays.cover} alt={plays.name} className="size-10 object-cover rounded-md" loading="lazy" />
                    <div className="text-white text-left overflow-hidden">
                      <p className="font-semibold text-sm truncate">{plays.name}</p>
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
            <QueuePanel songs={queue} currentSong={currentSong} onSelectSong={(song) => handleSelectSong(song, true)} colors={colors} />
          </Drawer>
        </>
      )}
    </div>
  );
};

export default Home;
