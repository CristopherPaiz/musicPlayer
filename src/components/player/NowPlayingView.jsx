import PropTypes from "prop-types";
import Lyrics from "../Lyrics";

const NowPlayingView = ({ selectedSong, image, lyrics, seek, colorText, colorTextLight, colorDark, onBack }) => {
  return (
    // **CORRECCIÓN CLAVE:** Clases responsivas. `absolute` en móvil, `static` (normal) en escritorio.
    <div className="absolute inset-0 bg-[var(--background-color)] sm:static h-full w-full flex flex-col p-4 sm:p-8 items-center overflow-y-auto">
      {/* Botón de volver para móvil */}
      <button onClick={onBack} className="sm:hidden absolute top-4 left-4 p-2 bg-black/20 rounded-full z-10">
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>

      <div className="flex flex-col items-center w-full max-w-4xl mt-12 sm:mt-0 text-center">
        <img src={image} alt="cover" className="size-48 sm:size-64 rounded-lg shadow-2xl flex-shrink-0" />
        <h2 className="text-2xl sm:text-4xl font-bold truncate mt-6 w-full">{selectedSong.title}</h2>
        <h3 className="text-lg sm:text-xl opacity-80 truncate w-full">{selectedSong.artist}</h3>
      </div>

      <div className="w-full max-w-lg mt-6 flex-grow flex items-center justify-center">
        {lyrics ? (
          <Lyrics
            lyrics={lyrics}
            timeElapsed={seek}
            color={colorTextLight}
            darkColor={colorDark}
            backgroundColor={colorText === "black" ? "#00000033" : "#ffffff33"}
          />
        ) : (
          <div className="flex items-center justify-center h-48 bg-black/10 rounded-lg w-full">
            <p>No hay letra disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

NowPlayingView.propTypes = {
  selectedSong: PropTypes.object.isRequired,
  image: PropTypes.string,
  lyrics: PropTypes.string,
  seek: PropTypes.number.isRequired,
  colorText: PropTypes.string,
  colorTextLight: PropTypes.string,
  colorDark: PropTypes.string,
  onBack: PropTypes.func.isRequired,
};

export default NowPlayingView;
