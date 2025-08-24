import { useState } from "react";
import PropTypes from "prop-types";
import Lyrics from "../Lyrics";
import PlayerControls from "./PlayerControls";
// Se elimina la definición del icono de aquí

const DesktopNowPlayingContent = ({ currentSong, image, lyrics, seek, colors, onClose }) => (
  <div className="h-full w-full flex flex-col bg-[var(--background-color)] p-8 overflow-hidden">
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
          <Lyrics lyrics={lyrics} timeElapsed={seek} color={colors.textLight} darkColor={colors.text} />
        </div>
      </div>
    </main>
  </div>
);

const NowPlayingView = ({ isDesktopView = false, currentSong, image, lyrics, seek, colors, onClose, ...controlProps }) => {
  const [showLyricsMobile, setShowLyricsMobile] = useState(false);

  if (!currentSong) return null;

  if (isDesktopView) {
    return <DesktopNowPlayingContent {...{ currentSong, image, lyrics, seek, colors, onClose }} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col p-4" style={{ backgroundColor: colors.dark, color: colors.text }}>
      <header className="flex-shrink-0 flex justify-between items-center">
        <button onClick={onClose} className="p-2 bg-black/20 rounded-full z-10">
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center gap-6 overflow-hidden text-center">
        <div className="flex-shrink-0 mt-4">
          <img src={image} alt="cover" className="size-64 rounded-lg shadow-2xl aspect-square object-cover" />
        </div>
        <div className="w-full">
          <h2 className="text-2xl font-bold truncate">{currentSong.title}</h2>
          <h3 className="text-lg opacity-80 truncate">{currentSong.artist}</h3>
        </div>
        <button onClick={() => setShowLyricsMobile(true)} className="bg-white/10 px-4 py-2 rounded-full text-sm">
          Mostrar Letra
        </button>
      </main>

      <footer className="flex-shrink-0 w-full">
        <PlayerControls currentSong={currentSong} seek={seek} {...controlProps} />
      </footer>

      {showLyricsMobile && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col z-20 p-4">
          <header className="flex-shrink-0 w-full flex justify-end">
            <button onClick={() => setShowLyricsMobile(false)} className="p-2 bg-black/20 rounded-full z-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>
          <div className="flex-grow overflow-hidden pt-4">
            <Lyrics lyrics={lyrics} timeElapsed={seek} color={colors.textLight} darkColor={colors.text} />
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
};

NowPlayingView.propTypes = {
  isDesktopView: PropTypes.bool,
  currentSong: PropTypes.object.isRequired,
  image: PropTypes.string,
  lyrics: PropTypes.string,
  seek: PropTypes.number.isRequired,
  colors: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

// Se elimina la exportación del icono de aquí
export default NowPlayingView;
