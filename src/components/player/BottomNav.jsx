import PropTypes from "prop-types";
import Playlist from "../icons/Playlist";

const QueueIcon = () => (
  <svg className="size-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path>
  </svg>
);

const BottomNav = ({ onPlaylistClick, onQueueClick, style = {} }) => {
  return (
    <nav className="sm:hidden bottom-0 left-0 right-0 flex justify-around items-center h-14 z-40 border-t border-white/10 py-2" style={style}>
      <button onClick={onPlaylistClick} className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors">
        <Playlist className="size-6" color="currentColor" />
        <span className="text-xs">Playlists</span>
      </button>
      <button onClick={onQueueClick} className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors">
        <QueueIcon />
        <span className="text-xs">Cola</span>
      </button>
    </nav>
  );
};

BottomNav.propTypes = {
  onPlaylistClick: PropTypes.func.isRequired,
  onQueueClick: PropTypes.func.isRequired,
  style: PropTypes.object,
};

export default BottomNav;
