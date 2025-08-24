import PropTypes from "prop-types";
import PlayerControls from "./PlayerControls";

const FooterPlayer = ({ selectedSong, image, onExpand, ...controlProps }) => {
  if (!selectedSong) return null;

  return (
    <footer className="flex-shrink-0 bg-black/50 backdrop-blur-md z-40">
      {/* Mini-player visible en móvil cuando NowPlaying está cerrado */}
      <div onClick={onExpand} className="sm:hidden flex items-center gap-3 p-2 cursor-pointer">
        <img src={image} alt="cover" className="size-12 rounded-md" />
        <div className="flex-grow overflow-hidden">
          <p className="font-bold truncate">{selectedSong.title}</p>
          <p className="text-sm opacity-70 truncate">{selectedSong.artist}</p>
        </div>
        {/* Aquí podrías poner un botón de play/pausa simple si quisieras */}
      </div>

      {/* Controles completos siempre visibles */}
      <PlayerControls selectedSong={selectedSong} {...controlProps} />
    </footer>
  );
};

FooterPlayer.propTypes = {
  selectedSong: PropTypes.object,
  image: PropTypes.string,
  onExpand: PropTypes.func.isRequired,
  // ... el resto de las props de control se pasan con el spread operator
};

export default FooterPlayer;
