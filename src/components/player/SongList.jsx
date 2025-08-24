import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { PlayIcon } from "../icons/PlayIcon";
import Pause from "../icons/Pause";
import useLazyImage from "../../hooks/useLazyImage";
import Skeleton from "../skeletons/Skeleton";

const LazyImage = ({ src, alt, imageCache, setImageCache }) => {
  const [isVisible, imageRef] = useLazyImage();
  const [imageSrc, setImageSrc] = useState(imageCache[src] || null);

  useEffect(() => {
    if (isVisible && !imageSrc) {
      console.log(`[LAZYLOAD] Image intersecting, loading: ${src}`);
      fetch(src)
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          setImageCache((prev) => ({ ...prev, [src]: blobUrl }));
          setImageSrc(blobUrl);
        })
        .catch((err) => console.error("Failed to load image:", err));
    }
  }, [isVisible, imageSrc, src, setImageCache]);

  return (
    <div ref={imageRef} className="size-10 sm:size-12 flex-shrink-0 bg-white/10 rounded-md">
      {imageSrc ? <img src={imageSrc} alt={alt} className="size-full object-cover rounded-md" /> : <Skeleton className="size-full rounded-md" />}
    </div>
  );
};

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  imageCache: PropTypes.object.isRequired,
  setImageCache: PropTypes.func.isRequired,
};

const SongListItem = ({ song, index, onSelect, isPlaying, isCurrent, imageCache, setImageCache }) => (
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
      <LazyImage key={song.coverUrl} src={song.coverUrl} alt={song.title} imageCache={imageCache} setImageCache={setImageCache} />
      <div className="flex flex-col overflow-hidden text-left">
        <p className={`font-semibold truncate ${isCurrent ? "text-green-400" : "text-white"}`}>{song.title}</p>
        <p className="text-sm truncate text-white/60">{song.artist}</p>
      </div>
    </div>
    <p className="text-sm text-white/60 justify-self-end">{new Date(song.length * 1000).toISOString().substr(14, 5)}</p>
  </div>
);

const DesktopSongListItem = ({ song, index, onSelect, isPlaying, isCurrent, imageCache, setImageCache }) => (
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
    <LazyImage key={song.coverUrl} src={song.coverUrl} alt={song.title} imageCache={imageCache} setImageCache={setImageCache} />
    <div className="flex flex-col overflow-hidden text-left">
      <p className={`font-semibold truncate ${isCurrent ? "text-green-400" : "text-white"}`}>{song.title}</p>
      <p className="text-sm truncate text-white/60">{song.artist}</p>
    </div>
    <p className="text-sm truncate text-white/60 text-left">{song.album}</p>
    <p className="text-sm text-white/60">{new Date(song.length * 1000).toISOString().substr(14, 5)}</p>
  </div>
);

const SongList = ({ songs, onSelectSong, currentSong, isPlaying, imageCache, setImageCache }) => {
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
            imageCache={imageCache}
            setImageCache={setImageCache}
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
            imageCache={imageCache}
            setImageCache={setImageCache}
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
  imageCache: PropTypes.object.isRequired,
  setImageCache: PropTypes.func.isRequired,
};

DesktopSongListItem.propTypes = {
  song: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  isCurrent: PropTypes.bool.isRequired,
  imageCache: PropTypes.object.isRequired,
  setImageCache: PropTypes.func.isRequired,
};

SongList.propTypes = {
  songs: PropTypes.array.isRequired,
  onSelectSong: PropTypes.func.isRequired,
  currentSong: PropTypes.object,
  isPlaying: PropTypes.bool.isRequired,
  imageCache: PropTypes.object.isRequired,
  setImageCache: PropTypes.func.isRequired,
};

export default SongList;
