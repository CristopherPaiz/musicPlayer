import PropTypes from "prop-types";
import SongPlayer from "../SongPlayer";
import Random from "../icons/Random";
import NoRandom from "../icons/NoRandom";

const PlayerControls = ({
  selectedSong,
  colorText,
  URL_BASE,
  folder,
  setPreviousSong,
  setEndSong,
  volume,
  setVolume,
  seek,
  setSeek,
  handleSeek,
  userSeek,
  random,
  setRandom,
}) => {
  if (!selectedSong) return null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-2 flex flex-col gap-2 flex-shrink-0 z-20">
      <div className="flex items-center gap-4 text-xs">
        <span>{new Date(seek * 1000).toISOString().substr(14, 5)}</span>
        <input
          type="range"
          min="0"
          max={Math.floor(selectedSong.length)}
          value={seek}
          onChange={handleSeek}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--colorLight)]"
        />
        <span>{new Date(selectedSong.length * 1000).toISOString().substr(14, 5)}</span>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex-1 flex justify-start">
          <button onClick={() => setRandom(!random)} className="p-2 hover:bg-white/10 rounded-full">
            {random ? <Random color={colorText} /> : <NoRandom color={colorText} />}
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <SongPlayer
            colorText={colorText}
            root={`${URL_BASE}${folder}`}
            artist={selectedSong.artist}
            song={selectedSong.title}
            setPreviousSong={setPreviousSong}
            setEndSong={setEndSong}
            totalFragments={selectedSong.fragments}
            volume={volume}
            setSeek={setSeek}
            userSeek={userSeek}
          />
        </div>
        <div className="flex-1 hidden sm:flex items-center justify-end gap-2">
          <span className="text-sm">{(volume * 100).toFixed(0)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--colorLight)]"
          />
        </div>
        {/* Placeholder for mobile to keep center alignment */}
        <div className="flex-1 sm:hidden"></div>
      </div>
    </div>
  );
};

PlayerControls.propTypes = {
  selectedSong: PropTypes.object,
  colorText: PropTypes.string,
  URL_BASE: PropTypes.string.isRequired,
  folder: PropTypes.string,
  setPreviousSong: PropTypes.func.isRequired,
  setEndSong: PropTypes.func.isRequired,
  volume: PropTypes.number.isRequired,
  setVolume: PropTypes.func.isRequired,
  seek: PropTypes.number.isRequired,
  setSeek: PropTypes.func.isRequired,
  handleSeek: PropTypes.func.isRequired,
  userSeek: PropTypes.number,
  random: PropTypes.bool.isRequired,
  setRandom: PropTypes.func.isRequired,
};

export default PlayerControls;
