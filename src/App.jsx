import { useEffect, useState, useCallback } from "react";
import { FastAverageColor } from "fast-average-color";
import PropTypes from "prop-types";
import Drawer from "react-modern-drawer";

import PlaylistHeader from "./components/player/PlaylistHeader";
import SongList from "./components/player/SongList";
import NowPlayingView from "./components/player/NowPlayingView";
import PlayerControls from "./components/player/PlayerControls";
import QueuePanel from "./components/player/QueuePanel";
import SongListSkeleton from "./components/skeletons/SongListSkeleton";

const App = ({ URL_BASE, playlist, folder, playlistData, isLoading }) => {
  const [songs, setSongs] = useState(playlist);
  const [selectedSong, setSelectedSong] = useState(null);
  const [random, setRandom] = useState(false);
  const [endSong, setEndSong] = useState(false);
  const [volume, setVolume] = useState(1);
  const [previousSong, setPreviousSong] = useState(false);
  const [image, setImage] = useState(null);
  const [seek, setSeek] = useState(0);
  const [userSeek, setUserSeek] = useState(0);
  const [lyrics, setLyrics] = useState(null);
  const [colors, setColors] = useState({
    hex: "#121212",
    dark: "#000000",
    light: "#282828",
    text: "#FFFFFF",
    textLight: "#FFFFFF",
  });
  const [openQueue, setOpenQueue] = useState(false);

  useEffect(() => {
    setSongs(playlist);
    setSelectedSong(null);
    setSeek(0);
  }, [playlist]);

  // Song navigation logic
  useEffect(() => {
    if (!selectedSong) return;
    if (endSong) {
      const currentIndex = songs.findIndex((s) => s.id === selectedSong.id);
      setSelectedSong(songs[currentIndex + 1] || null);
      setEndSong(false);
    }
    if (previousSong) {
      const currentIndex = songs.findIndex((s) => s.id === selectedSong.id);
      setSelectedSong(songs[currentIndex - 1] || songs[songs.length - 1]);
      setPreviousSong(false);
    }
  }, [endSong, previousSong, selectedSong, songs]);

  useEffect(() => {
    if (!random || !selectedSong) return;
    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
    const shuffled = shuffle(songs.filter((s) => s.id !== selectedSong.id));
    setSongs([selectedSong, ...shuffled]);
  }, [random, songs, selectedSong]);

  // Fetch song data
  useEffect(() => {
    if (!selectedSong) return;
    setImage(null);
    setLyrics(null);
    setSeek(0);
    const fetchData = async () => {
      try {
        const imgUrl = `${URL_BASE}${folder}/${selectedSong.artist}/${selectedSong.title}/cover.webp`;
        const lrcUrl = `${URL_BASE}${folder}/${selectedSong.artist}/${selectedSong.title}/lyrics.lrc`;
        const [imgRes, lrcRes] = await Promise.all([fetch(imgUrl), fetch(lrcUrl)]);
        if (imgRes.ok) setImage(URL.createObjectURL(await imgRes.blob()));
        if (lrcRes.ok) {
          const text = await lrcRes.text();
          setLyrics(text.includes("NoSuchKey") ? null : text);
        }
      } catch (error) {
        console.error("Failed to fetch song data:", error);
      }
    };
    fetchData();
  }, [selectedSong, URL_BASE, folder]);

  // Extract colors from image
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--background-color", colors.dark);
    if (!image) return;
    const fac = new FastAverageColor();
    fac
      .getColorAsync(image)
      .then((color) => {
        const newColors = {
          hex: color.hex,
          dark: color.isDark ? `rgb(${color.value.map((c) => c * 0.5).join(",")})` : `rgb(${color.value.map((c) => c * 0.8).join(",")})`,
          light: `rgb(${color.value.map((c) => Math.min(255, c * 1.5)).join(",")})`,
          text: color.isDark ? "#FFFFFF" : "#000000",
          textLight: color.isDark
            ? `rgb(${color.value.map((c) => Math.min(255, c * 2)).join(",")})`
            : `rgb(${color.value.map((c) => c * 0.5).join(",")})`,
        };
        setColors(newColors);
        root.style.setProperty("--background-color", newColors.dark);
        root.style.setProperty("--colorLight", newColors.light);
        root.style.setProperty("--textColorLigth", newColors.text);
      })
      .catch((e) => console.error(e));
    return () => fac.destroy();
  }, [image, colors.dark]);

  const handleSeek = (e) => {
    const newSeek = parseInt(e.target.value, 10);
    setSeek(newSeek);
    setUserSeek(newSeek);
  };

  const handleSelectSong = useCallback((song) => {
    setSelectedSong(song);
    setOpenQueue(false);
  }, []);

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "var(--background-color)" }}>
      <PlaylistHeader playlistData={playlistData} color={colors.hex} colorDark={colors.dark} colorText={colors.text} />

      {/* **CORRECCIÓN DE LAYOUT: Main + Aside** */}
      <div className="flex-grow flex overflow-hidden">
        {/* Contenido Principal */}
        <main className="flex-grow overflow-y-auto relative">
          {isLoading ? (
            <SongListSkeleton />
          ) : selectedSong ? (
            <NowPlayingView
              selectedSong={selectedSong}
              image={image}
              lyrics={lyrics}
              seek={seek}
              colorText={colors.text}
              colorTextLight={colors.textLight}
              colorDark={colors.dark}
              onBack={() => setSelectedSong(null)}
            />
          ) : (
            <SongList songs={songs} URL_BASE={URL_BASE} folder={folder} onSelectSong={handleSelectSong} />
          )}
        </main>

        {/* Barra Lateral de Cola (solo en escritorio) */}
        {selectedSong && (
          <aside className="hidden sm:block w-[350px] min-w-[250px] flex-shrink-0">
            <QueuePanel
              songs={songs}
              selectedSong={selectedSong}
              URL_BASE={URL_BASE}
              folder={folder}
              onSelectSong={handleSelectSong}
              color={colors.hex}
            />
          </aside>
        )}
      </div>

      <PlayerControls
        selectedSong={selectedSong}
        colorText={colors.text}
        URL_BASE={URL_BASE}
        folder={folder}
        setPreviousSong={setPreviousSong}
        setEndSong={setEndSong}
        volume={volume}
        setVolume={setVolume}
        seek={seek}
        setSeek={setSeek}
        handleSeek={handleSeek}
        userSeek={userSeek}
        random={random}
        setRandom={setRandom}
      />

      {selectedSong && (
        <>
          <button
            className="sm:hidden fixed bottom-24 right-4 z-30 bg-white/20 backdrop-blur-md p-3 rounded-full shadow-lg"
            onClick={() => setOpenQueue(true)}
          >
            <svg className="size-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path>
            </svg>
          </button>
          <Drawer open={openQueue} onClose={() => setOpenQueue(false)} direction="right" className="!w-64" style={{ backgroundColor: colors.dark }}>
            <QueuePanel
              songs={songs}
              selectedSong={selectedSong}
              URL_BASE={URL_BASE}
              folder={folder}
              onSelectSong={handleSelectSong}
              color={colors.hex}
            />
          </Drawer>
        </>
      )}
    </div>
  );
};

App.propTypes = {
  URL_BASE: PropTypes.string,
  playlist: PropTypes.array,
  folder: PropTypes.string,
  playlistData: PropTypes.object,
  isLoading: PropTypes.bool,
};

export default App;
