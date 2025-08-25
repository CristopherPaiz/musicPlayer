import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Lyrics from "../Lyrics";
import PlayerControls from "./PlayerControls";
import BottomNav from "./BottomNav";
import VerticalVolumeSlider from "./VerticalVolumeSlider";
import MarqueeText from "../MarqueeText";

const DesktopNowPlayingContent = ({ currentSong, image, lyrics, seek, colors, onClose, onSeek }) => (
  <div className="h-dvh w-full flex flex-col bg-[var(--background-color)] p-8 overflow-hidden">
    <header className="flex-shrink-0 mb-8">
      <button onClick={onClose} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver a la playlist
      </button>
    </header>
    <main className="flex-grow flex gap-12 overflow-hidden">
      <div className="w-1/3 flex-shrink-0">
        {image && <img src={image} alt="cover" className="w-full rounded-lg shadow-2xl aspect-square object-cover" />}
      </div>
      <div className="w-2/3 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 mb-4">
          <h2 className="text-4xl font-bold truncate">{currentSong.title}</h2>
          <h3 className="text-xl opacity-80 truncate">{currentSong.artist}</h3>
        </div>
        <div className="flex-grow overflow-hidden">
          <Lyrics lyrics={lyrics} timeElapsed={seek} color={colors.textLight} darkColor={colors.text} onSeek={onSeek} />
        </div>
      </div>
    </main>
  </div>
);

const NowPlayingView = ({
  isDesktopView = false,
  currentSong,
  image,
  lyrics,
  seek,
  colors,
  onClose,
  volume,
  setVolume,
  playlistName,
  onPlaylistClick,
  onQueueClick,
  onSeek,
  ...controlProps
}) => {
  const [showLyricsMobile, setShowLyricsMobile] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const volumeControlRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volumeControlRef.current && !volumeControlRef.current.contains(event.target)) {
        setShowVolumeControl(false);
      }
    };
    if (showVolumeControl) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showVolumeControl]);

  // Controlar pull-to-refresh
  useEffect(() => {
    if (showVolumeControl) {
      document.body.style.overscrollBehavior = "contain";
    } else {
      document.body.style.overscrollBehavior = "auto";
    }
    return () => {
      document.body.style.overscrollBehavior = "auto";
    };
  }, [showVolumeControl]);

  if (!currentSong) return null;

  if (isDesktopView) {
    return <DesktopNowPlayingContent {...{ currentSong, image, lyrics, seek, colors, onClose, onSeek }} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: colors.dark, color: colors.text }}>
      <header className="flex-shrink-0 flex justify-between items-center p-4">
        <button onClick={onClose} className="p-2 bg-black/20 rounded-full z-10">
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center gap-4 overflow-hidden text-center -mt-8">
        <div className="flex-shrink-0 mt-2 px-8">
          <img
            src={image}
            alt="cover"
            onClick={() => setShowLyricsMobile(true)}
            className="w-full rounded-lg shadow-2xl aspect-square object-cover"
          />
        </div>
        <div className="w-full px-4">
          <div className="px-4">
            <MarqueeText text={currentSong.title} className="text-2xl font-bold" />
          </div>
          <h3 className="text-lg opacity-80 truncate">{currentSong.artist}</h3>
          {playlistName && <p className="text-xs opacity-60 mt-1 truncate">Playlist: {playlistName}</p>}
        </div>
        <button onClick={() => setShowLyricsMobile(true)} className="bg-white/10 px-4 py-2 rounded-full text-sm mt-2">
          Mostrar Letra
        </button>
      </main>

      <footer className="relative flex-shrink-0 w-full pb-32">
        <PlayerControls currentSong={currentSong} seek={seek} {...controlProps} onVolumeClick={() => setShowVolumeControl((prev) => !prev)} />
        <div ref={volumeControlRef} className="absolute bottom-44 right-14">
          {showVolumeControl && <VerticalVolumeSlider volume={volume} setVolume={setVolume} />}
        </div>
      </footer>

      <BottomNav
        onPlaylistClick={onPlaylistClick}
        onQueueClick={onQueueClick}
        style={{
          position: "absolute",
          backgroundColor: colors.dark,
          filter: "brightness(0.8)",
        }}
      />

      {showLyricsMobile && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col z-20 p-4 pb-20">
          <header className="flex-shrink-0 w-full flex justify-end">
            <button onClick={() => setShowLyricsMobile(false)} className="p-2 bg-black/20 rounded-full z-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>
          <div className="flex-grow overflow-hidden pt-4">
            <Lyrics lyrics={lyrics} timeElapsed={seek} color={colors.textLight} darkColor={colors.text} onSeek={onSeek} />
          </div>
        </div>
      )}
    </div>
  );
};

DesktopNowPlayingContent.propTypes = {
  currentSong: PropTypes.object.isRequired,
  image: PropTypes.string,
  lyrics: PropTypes.string,
  seek: PropTypes.number.isRequired,
  colors: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSeek: PropTypes.func.isRequired,
};

NowPlayingView.propTypes = {
  isDesktopView: PropTypes.bool,
  currentSong: PropTypes.object.isRequired,
  image: PropTypes.string,
  lyrics: PropTypes.string,
  seek: PropTypes.number.isRequired,
  colors: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  volume: PropTypes.number,
  setVolume: PropTypes.func,
  playlistName: PropTypes.string,
  onPlaylistClick: PropTypes.func,
  onQueueClick: PropTypes.func,
  onSeek: PropTypes.func.isRequired,
};

export default NowPlayingView;
