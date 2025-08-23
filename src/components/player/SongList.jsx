import PropTypes from "prop-types";
import { PlayIcon } from "../icons/PlayIcon"; // Importaremos un icono simple

const SongListItem = ({ song, index, URL_BASE, folder, onSelect }) => (
  <div
    onClick={() => onSelect(song)}
    className="grid grid-cols-[auto,1fr,auto] sm:grid-cols-[2rem,4rem,1fr,1fr,5rem] items-center gap-4 p-2 rounded-md cursor-pointer hover:bg-white/10 transition-colors duration-200 group"
  >
    <div className="relative text-center">
      <span className="text-white/60 group-hover:opacity-0">{index + 1}</span>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <PlayIcon className="size-5 text-white" />
      </div>
    </div>

    <img
      src={`${URL_BASE}${folder}/${song.artist}/${song.title}/cover.webp`}
      alt="cover"
      loading="lazy"
      className="size-12 object-cover rounded-md"
    />
    <div className="flex flex-col overflow-hidden">
      <p className="font-semibold truncate text-white">{song.title}</p>
      <p className="text-sm truncate text-white/60">{song.artist}</p>
    </div>
    <p className="hidden sm:block text-sm truncate text-white/60">{song.album}</p>
    <p className="text-sm text-white/60 justify-self-end sm:justify-self-start">{new Date(song.length * 1000).toISOString().substr(14, 5)}</p>
  </div>
);

const SongList = ({ songs, URL_BASE, folder, onSelectSong }) => {
  return (
    <div className="px-4 py-2">
      <div className="hidden sm:grid grid-cols-[2rem,4rem,1fr,1fr,5rem] gap-4 px-2 pb-2 border-b border-white/10 text-white/60 text-sm uppercase tracking-wider">
        <span>#</span>
        <span></span>
        <span>Título</span>
        <span>Álbum</span>
        <span>Duración</span>
      </div>
      {songs.map((song, index) => (
        <SongListItem key={song.id} song={song} index={index} URL_BASE={URL_BASE} folder={folder} onSelect={onSelectSong} />
      ))}
    </div>
  );
};

SongListItem.propTypes = {
  song: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  URL_BASE: PropTypes.string.isRequired,
  folder: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

SongList.propTypes = {
  songs: PropTypes.array.isRequired,
  URL_BASE: PropTypes.string.isRequired,
  folder: PropTypes.string.isRequired,
  onSelectSong: PropTypes.func.isRequired,
};

export default SongList;
