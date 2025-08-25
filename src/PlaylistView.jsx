import PropTypes from "prop-types";
import PlaylistHeader from "./components/player/PlaylistHeader";
import SongList from "./components/player/SongList";
import QueuePanel from "./components/player/QueuePanel";
import SongListSkeleton from "./components/skeletons/SongListSkeleton";
import DesktopLyricsView from "./components/player/DesktopLyricsView";
import SearchBar from "./components/player/SearchBar";

const PlaylistView = ({
  playlistData,
  songs,
  queue,
  isLoading,
  onSelectSong,
  currentSong,
  isPlaying,
  colors,
  imageCache,
  setImageCache,
  desktopView,
  desktopLyricsProps,
  searchTerm,
  setSearchTerm,
  searchHistory,
  onSearchSubmit,
}) => {
  const handleSearch = (e) => {
    e.preventDefault();
    onSearchSubmit(searchTerm);
  };

  return (
    <div className="h-dvh flex flex-col" style={{ backgroundColor: colors.dark, color: colors.text }}>
      <div className="flex-grow flex overflow-hidden">
        <main className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-shrink-0">
            <PlaylistHeader playlistData={playlistData} color={colors.hex} colorDark={colors.dark} colorText={colors.text} />
            <div className="px-4 pt-4">
              <form onSubmit={handleSearch}>
                <SearchBar
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  searchHistory={searchHistory}
                  onHistorySelect={(term) => {
                    setSearchTerm(term);
                    onSearchSubmit(term);
                  }}
                />
              </form>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto pb-36 sm:pb-0">
            {isLoading ? (
              <SongListSkeleton />
            ) : songs.length === 0 && searchTerm ? (
              <p className="text-center text-white/60 mt-8">No se encontraron resultados para &quot;{searchTerm}&quot;</p>
            ) : (
              <>
                <div className="hidden sm:block h-full">
                  {desktopView === "lyrics" ? (
                    <DesktopLyricsView {...desktopLyricsProps} />
                  ) : (
                    <SongList
                      songs={songs}
                      onSelectSong={(song) => onSelectSong(song, false)}
                      currentSong={currentSong}
                      isPlaying={isPlaying}
                      imageCache={imageCache}
                      setImageCache={setImageCache}
                    />
                  )}
                </div>
                <div className="sm:hidden h-full">
                  <SongList
                    songs={songs}
                    onSelectSong={(song) => onSelectSong(song, false)}
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    imageCache={imageCache}
                    setImageCache={setImageCache}
                  />
                </div>
              </>
            )}
          </div>
        </main>
        <aside className="hidden sm:block w-[350px] min-w-[250px] flex-shrink-0">
          <QueuePanel songs={queue} currentSong={currentSong} onSelectSong={(song) => onSelectSong(song, true)} colors={colors} />
        </aside>
      </div>
    </div>
  );
};

PlaylistView.propTypes = {
  playlistData: PropTypes.object.isRequired,
  songs: PropTypes.array.isRequired,
  queue: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onSelectSong: PropTypes.func.isRequired,
  currentSong: PropTypes.object,
  isPlaying: PropTypes.bool.isRequired,
  colors: PropTypes.object.isRequired,
  imageCache: PropTypes.object.isRequired,
  setImageCache: PropTypes.func.isRequired,
  desktopView: PropTypes.string,
  desktopLyricsProps: PropTypes.object,
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  searchHistory: PropTypes.array.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
};

export default PlaylistView;
