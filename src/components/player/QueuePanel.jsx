import PropTypes from "prop-types";

const QueuePanel = ({ songs, currentSong, onSelectSong, colors }) => {
  return (
    <aside className="w-full h-full bg-black/20 flex flex-col overflow-y-auto">
      <div
        style={{ backgroundColor: colors.hex, filter: "brightness(0.90)", color: colors.text }}
        className="text-xl font-bold text-center py-4 sticky top-0 z-10"
      >
        <h3>En cola</h3>
      </div>
      <ul className="p-2">
        {songs.map((song) => (
          <li
            key={song.id}
            onClick={() => onSelectSong(song, songs)} // Pasamos la cola actual para que se establezca correctamente
            style={{
              backgroundColor: currentSong && song.id === currentSong.id ? colors.light : "",
              color: currentSong && song.id === currentSong.id ? colors.text : "",
            }}
            className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-white/10 transition-colors"
          >
            <img src={song.coverUrl} alt="cover" loading="lazy" className="size-10 object-cover rounded-md flex-shrink-0" />
            <div className="overflow-hidden">
              <p className={`font-semibold text-sm truncate ${currentSong?.id === song.id ? "text-green-400" : "text-white"}`}>{song.title}</p>
              <p className="text-xs truncate opacity-70 text-white/80">{song.artist}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
};

QueuePanel.propTypes = {
  songs: PropTypes.array.isRequired,
  currentSong: PropTypes.object,
  onSelectSong: PropTypes.func.isRequired,
  colors: PropTypes.object.isRequired,
};

export default QueuePanel;
