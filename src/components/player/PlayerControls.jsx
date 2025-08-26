import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Random from "../icons/Random";
import NoRandom from "../icons/NoRandom";
import SkipBack from "../icons/SkipBack";
import Pause from "../icons/Pause";
import Play from "../icons/Play";
import SkipForward from "../icons/SkipForward";
import VolumeIcon from "../icons/Volume";
import { usePlayerSeek } from "../../hooks/usePlayerSeek";

const PlayerControls = ({
  currentSong,
  isPlaying,
  onTogglePlayPause,
  onSkipBack,
  onSkipForward,
  setUserSeek,
  random,
  setRandom,
  accentColor,
  onVolumeClick,
}) => {
  const liveSeek = usePlayerSeek();
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  const displaySeek = isDragging ? dragValue : liveSeek;

  useEffect(() => {
    if (!isDragging) {
      setDragValue(liveSeek);
    }
  }, [liveSeek, isDragging]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragMove = (e) => {
    if (isDragging) {
      setDragValue(Number(e.target.value));
    }
  };

  const handleDragEnd = (e) => {
    const finalSeekValue = Number(e.target.value);
    setUserSeek(finalSeekValue);
    setIsDragging(false);
  };

  if (!currentSong) return null;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex items-center gap-4 text-xs w-full max-w-2xl px-4 sm:px-0">
        <span>{new Date(displaySeek * 1000).toISOString().substr(14, 5)}</span>
        <input
          type="range"
          min="0"
          max={currentSong.duracion ? Math.floor(currentSong.duracion) : 100}
          value={displaySeek}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onChange={handleDragMove}
          onMouseUp={handleDragEnd}
          onTouchEnd={handleDragEnd}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: accentColor }}
        />
        <span>{new Date(currentSong.duracion * 1000).toISOString().substr(14, 5)}</span>
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
  setUserSeek: PropTypes.func.isRequired,
  random: PropTypes.bool.isRequired,
  setRandom: PropTypes.func.isRequired,
  accentColor: PropTypes.string,
  onVolumeClick: PropTypes.func,
};

export default PlayerControls;
