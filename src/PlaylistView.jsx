import PropTypes from "prop-types";
import PlaylistHeader from "./components/player/PlaylistHeader";
import SongList from "./components/player/SongList";
import QueuePanel from "./components/player/QueuePanel";
import SongListSkeleton from "./components/skeletons/SongListSkeleton";
import DesktopLyricsView from "./components/player/DesktopLyricsView";

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
}) => {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.dark, color: colors.text }}>
      <div className="flex-grow flex overflow-hidden">
        <main className="flex-grow flex flex-col overflow-hidden">
          <PlaylistHeader playlistData={playlistData} color={colors.hex} colorDark={colors.dark} colorText={colors.text} />

          <div className="flex-grow overflow-y-auto pb-36 sm:pb-0">
            {isLoading || songs.length === 0 ? (
              <SongListSkeleton />
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
};

export default PlaylistView;
