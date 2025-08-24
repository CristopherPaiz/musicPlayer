import PropTypes from "prop-types";
import Random from "../icons/Random";
import NoRandom from "../icons/NoRandom";
import SkipBack from "../icons/SkipBack";
import Pause from "../icons/Pause";
import Play from "../icons/Play";
import SkipForward from "../icons/SkipForward";
import VolumeIcon from "../icons/Volume";

const PlayerControls = ({
  currentSong,
  isPlaying,
  onTogglePlayPause,
  onSkipBack,
  onSkipForward,
  seek,
  handleSeek,
  random,
  setRandom,
  accentColor,
  onVolumeClick,
}) => {
  if (!currentSong) return null;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex items-center gap-4 text-xs w-full max-w-2xl px-4 sm:px-0">
        <span>{new Date(seek * 1000).toISOString().substr(14, 5)}</span>
        <input
          type="range"
          min="0"
          max={Math.floor(currentSong.length)}
          value={seek}
          onChange={handleSeek}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: accentColor }}
        />
        <span>{new Date(currentSong.length * 1000).toISOString().substr(14, 5)}</span>
      </div>

      <div className="flex items-center justify-center gap-6 w-full">
        <button onClick={() => setRandom(!random)} className="p-2 hover:text-white text-white/70 transition-colors">
          {random ? <Random style={{ color: accentColor }} /> : <NoRandom />}
        </button>
        <button onClick={onSkipBack} className="p-2 hover:scale-110 transition-transform">
          <SkipBack />
        </button>
        <button onClick={onTogglePlayPause} className="bg-white text-black rounded-full p-3 hover:scale-110 transition-transform shadow-lg">
          <div className="size-6">{isPlaying ? <Pause /> : <Play />}</div>
        </button>
        <button onClick={onSkipForward} className="p-2 hover:scale-110 transition-transform">
          <SkipForward />
        </button>
        {onVolumeClick ? (
          <button onClick={onVolumeClick} className="p-2 hover:text-white text-white/70 transition-colors">
            <VolumeIcon className="size-5" />
          </button>
        ) : (
          <div className="w-1"></div>
        )}
      </div>
    </div>
  );
};

PlayerControls.propTypes = {
  currentSong: PropTypes.object,
  isPlaying: PropTypes.bool.isRequired,
  onTogglePlayPause: PropTypes.func.isRequired,
  onSkipBack: PropTypes.func.isRequired,
  onSkipForward: PropTypes.func.isRequired,
  seek: PropTypes.number.isRequired,
  handleSeek: PropTypes.func.isRequired,
  random: PropTypes.bool.isRequired,
  setRandom: PropTypes.func.isRequired,
  accentColor: PropTypes.string,
  onVolumeClick: PropTypes.func,
};

export default PlayerControls;
