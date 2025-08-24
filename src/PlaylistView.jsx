import PropTypes from "prop-types";
import PlaylistHeader from "./components/player/PlaylistHeader";
import SongList from "./components/player/SongList";
import QueuePanel from "./components/player/QueuePanel";
import SongListSkeleton from "./components/skeletons/SongListSkeleton";
// CORRECCIÓN: La ruta de importación era incorrecta. Ahora apunta al directorio correcto.
import DesktopLyricsView from "./components/player/DesktopLyricsView";

const PlaylistView = ({
  playlistData,
  songs,
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
  // MEJORA: Eliminamos la detección de 'isMobile' en JS y confiamos 100% en las clases de Tailwind.

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
                {/* En desktop, decidimos qué vista mostrar */}
                <div className="hidden sm:block h-full">
                  {desktopView === "lyrics" ? (
                    <DesktopLyricsView {...desktopLyricsProps} />
                  ) : (
                    <SongList
                      songs={songs}
                      onSelectSong={onSelectSong}
                      currentSong={currentSong}
                      isPlaying={isPlaying}
                      imageCache={imageCache}
                      setImageCache={setImageCache}
                    />
                  )}
                </div>
                {/* En mobile, siempre mostramos la lista de canciones */}
                <div className="sm:hidden h-full">
                  <SongList
                    songs={songs}
                    onSelectSong={onSelectSong}
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
          {/* CORRECCIÓN: Pasamos 'playlistSongs' a la cola en desktop para que sea consistente */}
          <QueuePanel songs={songs} currentSong={currentSong} onSelectSong={onSelectSong} colors={colors} />
        </aside>
      </div>
    </div>
  );
};

PlaylistView.propTypes = {
  playlistData: PropTypes.object.isRequired,
  songs: PropTypes.array.isRequired,
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
