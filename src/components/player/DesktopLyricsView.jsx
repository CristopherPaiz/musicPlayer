import PropTypes from "prop-types";
import Lyrics from "../Lyrics";

const DesktopLyricsView = ({ currentSong, image, lyrics, seek, colors }) => {
  if (!currentSong) return null;

  return (
    <div className="h-dvh w-full flex gap-8 p-8 overflow-hidden">
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
    </div>
  );
};

DesktopLyricsView.propTypes = {
  currentSong: PropTypes.object,
  image: PropTypes.string,
  lyrics: PropTypes.string,
  seek: PropTypes.number.isRequired,
  colors: PropTypes.object.isRequired,
};

export default DesktopLyricsView;
