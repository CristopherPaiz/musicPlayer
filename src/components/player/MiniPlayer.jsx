import PropTypes from "prop-types";
import Play from "../icons/Play";
import Pause from "../icons/Pause";

const MiniPlayer = ({ currentSong, image, isPlaying, onExpand, onTogglePlayPause, seek }) => {
  if (!currentSong) return null;

  const progress = (seek / currentSong.length) * 100;

  return (
    <div className="sm:hidden fixed bottom-14 left-0 right-0 bg-neutral-800/90 backdrop-blur-md z-40 cursor-pointer group" onClick={onExpand}>
      <div className="w-full h-1 bg-white/20 absolute top-0 left-0">
        <div className="h-1 bg-white" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="flex items-center gap-3 p-2 h-16">
        {image && <img src={image} alt="cover" className="size-12 rounded-md flex-shrink-0" />}
        <div className="flex-grow overflow-hidden text-left">
          <p className="font-bold truncate text-sm text-white">{currentSong.title}</p>
          <p className="text-xs opacity-70 truncate text-white/80">{currentSong.artist}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlayPause();
          }}
          className="p-2 mr-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <div className="size-8 text-white">{isPlaying ? <Pause /> : <Play />}</div>
        </button>
      </div>
    </div>
  );
};

MiniPlayer.propTypes = {
  currentSong: PropTypes.object,
  image: PropTypes.string,
  isPlaying: PropTypes.bool.isRequired,
  onExpand: PropTypes.func.isRequired,
  onTogglePlayPause: PropTypes.func.isRequired,
  seek: PropTypes.number.isRequired,
};

export default MiniPlayer;
