import PropTypes from "prop-types";

const QueuePanel = ({ songs, selectedSong, URL_BASE, folder, onSelectSong, color }) => {
  return (
    // Se eliminaron las clases `hidden sm:block` para que el Drawer controle la visibilidad
    <aside className="w-full bg-black/20 flex-shrink-0 overflow-y-auto">
      <div style={{ backgroundColor: color, filter: "brightness(0.90)" }} className="text-xl font-bold text-center py-4 sticky top-0">
        <h3>En cola</h3>
      </div>
      <ul className="p-2">
        {songs.map((song) => (
          <li
            key={song.id}
            onClick={() => onSelectSong(song)}
            style={{
              backgroundColor: song.id === selectedSong.id ? "var(--colorLight)" : "",
              color: song.id === selectedSong.id ? "var(--textColorLigth)" : "",
            }}
            className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-white/10"
          >
            <img
              src={`${URL_BASE}${folder}/${song.artist}/${song.title}/cover.webp`}
              alt="cover"
              loading="lazy"
              className="size-10 object-cover rounded-md flex-shrink-0"
            />
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate">{song.title}</p>
              <p className="text-xs truncate opacity-70">{song.artist}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
};

QueuePanel.propTypes = {
  songs: PropTypes.array.isRequired,
  selectedSong: PropTypes.object,
  URL_BASE: PropTypes.string.isRequired,
  folder: PropTypes.string.isRequired,
  onSelectSong: PropTypes.func.isRequired,
  color: PropTypes.string,
};

export default QueuePanel;
