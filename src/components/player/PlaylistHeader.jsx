import PropTypes from "prop-types";

const PlaylistHeader = ({ playlistData, color, colorDark, colorText }) => {
  return (
    // CORRECCIÓN: El fondo ahora es transparente para dejar ver el gradiente del panel principal.
    <header
      style={{
        color: colorText,
      }}
      className="flex p-4 sm:p-6 gap-4 items-center w-full flex-shrink-0 bg-transparent"
    >
      <img src={playlistData.cover} alt={playlistData.name} className="size-24 sm:size-32 rounded-lg shadow-lg" />
      <div className="flex flex-col gap-y-1 overflow-hidden">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider">Playlist</h2>
        <h1 className="font-bold text-2xl sm:text-5xl truncate">{playlistData.name}</h1>
        <p className="text-sm sm:text-base opacity-80 truncate">{playlistData.description}</p>
        <p className="text-xs sm:text-sm opacity-60 mt-1">
          {playlistData.artist} • {playlistData.tracks} canciones
        </p>
      </div>
    </header>
  );
};

PlaylistHeader.propTypes = {
  playlistData: PropTypes.object.isRequired,
  color: PropTypes.string,
  colorDark: PropTypes.string,
  colorText: PropTypes.string,
};

export default PlaylistHeader;
