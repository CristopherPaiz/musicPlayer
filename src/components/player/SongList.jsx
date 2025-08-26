import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { PlayIcon } from "../icons/PlayIcon";
import Pause from "../icons/Pause";
import useLazyImage from "../../hooks/useLazyImage";
import Skeleton from "../skeletons/Skeleton";

const LazyImage = ({ src, alt }) => {
  const [isVisible, imageRef] = useLazyImage();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(null);

  useEffect(() => {
    if (isVisible) {
      setCurrentSrc(src);
    }
  }, [isVisible, src]);

  return (
    <div ref={imageRef} className="size-10 sm:size-12 flex-shrink-0 bg-white/10 rounded-md relative">
      {!isLoaded && <Skeleton className="absolute inset-0 size-full rounded-md" />}
      <img
        src={currentSrc}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`size-full object-cover rounded-md transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
};

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
};

const SongListItem = ({ song, index, onSelect, isPlaying, isCurrent }) => (
  <div
    onClick={() => onSelect(song)}
    className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[2rem_1fr_5rem] items-center gap-x-4 px-2 py-2 rounded-md cursor-pointer hover:bg-white/10 transition-colors duration-200 group"
  >
    <div className="relative text-center w-8 flex items-center justify-center">
      <span className={`text-white/60 group-hover:opacity-0 ${isCurrent ? "opacity-0" : "opacity-100"}`}>{index + 1}</span>
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity ${
          isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {isCurrent && isPlaying ? <Pause className="size-5 text-green-400" /> : <PlayIcon className="size-5 text-white" />}
      </div>
    </div>
    <div className="flex items-center gap-3 overflow-hidden">
      <LazyImage key={song.id} src={song.coverUrl} alt={song.titulo} />
      <div className="flex flex-col overflow-hidden text-left">
        <p className={`font-semibold truncate ${isCurrent ? "text-green-400" : "text-white"}`}>{song.titulo}</p>
        <p className="text-sm truncate text-white/60">{song.artista}</p>
      </div>
    </div>
    <p className="text-sm text-white/60 justify-self-end">{new Date(song.duracion * 1000).toISOString().substr(14, 5)}</p>
  </div>
);

const DesktopSongListItem = ({ song, index, onSelect, isPlaying, isCurrent }) => (
  <div
    onClick={() => onSelect(song)}
    className="grid grid-cols-[2rem,4rem,1fr,1fr,5rem] items-center gap-4 p-2 rounded-md cursor-pointer hover:bg-white/10 transition-colors duration-200 group"
  >
    <div className="relative text-center">
      <span className={`text-white/60 group-hover:opacity-0 ${isCurrent ? "opacity-0" : "opacity-100"}`}>{index + 1}</span>
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity ${
          isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {isCurrent && isPlaying ? <Pause className="size-5 text-green-400" /> : <PlayIcon className="size-5 text-white" />}
      </div>
    </div>
    <LazyImage key={song.id} src={song.coverUrl} alt={song.titulo} />
    <div className="flex flex-col overflow-hidden text-left">
      <p className={`font-semibold truncate ${isCurrent ? "text-green-400" : "text-white"}`}>{song.titulo}</p>
      <p className="text-sm truncate text-white/60">{song.artista}</p>
    </div>
    <p className="text-sm truncate text-white/60 text-left">{song.album}</p>
    <p className="text-sm text-white/60">{new Date(song.duracion * 1000).toISOString().substr(14, 5)}</p>
  </div>
);

const SongList = ({ songs, onSelectSong, currentSong, isPlaying }) => {
  return (
    <div className="px-2 sm:px-4 py-2">
      <div className="hidden sm:grid grid-cols-[2rem,4rem,1fr,1fr,5rem] gap-4 px-2 pb-2 border-b border-white/10 text-white/60 text-sm uppercase tracking-wider">
        <span>#</span>
        <span />
        <span className="text-left">Título</span>
        <span className="text-left">Álbum</span>
        <span>Duración</span>
      </div>
      <div className="sm:hidden">
        {songs.map((song, index) => (
          <SongListItem
            key={`${song.id}-${index}`}
            song={song}
            index={index}
            onSelect={onSelectSong}
            isCurrent={currentSong?.id === song.id}
            isPlaying={isPlaying}
          />
        ))}
      </div>
      <div className="hidden sm:block">
        {songs.map((song, index) => (
          <DesktopSongListItem
            key={`${song.id}-${index}`}
            song={song}
            index={index}
            onSelect={onSelectSong}
            isCurrent={currentSong?.id === song.id}
            isPlaying={isPlaying}
          />
        ))}
      </div>
    </div>
  );
};

SongListItem.propTypes = {
  song: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  isCurrent: PropTypes.bool.isRequired,
};

DesktopSongListItem.propTypes = {
  song: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  isCurrent: PropTypes.bool.isRequired,
};

SongList.propTypes = {
  songs: PropTypes.array.isRequired,
  onSelectSong: PropTypes.func.isRequired,
  currentSong: PropTypes.object,
  isPlaying: PropTypes.bool.isRequired,
};

export default SongList;
