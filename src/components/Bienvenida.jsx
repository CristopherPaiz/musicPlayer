import PropTypes from "prop-types";

const PlaylistSkeleton = () => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-32 h-32 bg-neutral-700 rounded-lg animate-pulse"></div>
    <div className="h-4 w-24 bg-neutral-700 rounded animate-pulse"></div>
  </div>
);

const Bienvenida = ({ playlists, onPlaylistSelect, isLoading }) => {
  return (
    <div className="w-full h-dvh flex flex-col bg-neutral-900 text-white overflow-auto pb-12 sm:pb-2">
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="hidden sm:flex w-full items-center justify-center flex-col">
          <h1 className="text-6xl font-bold">Music Player</h1>
          <h3 className="mt-10 animate-bounce text-4xl text-gray-400 text-center">← Selecciona una playlist para comenzar ♪</h3>
        </div>

        <div className="sm:hidden w-full flex flex-col text-white">
          <h2 className="text-3xl font-bold mb-6">Explorar Playlists</h2>
          {isLoading && <p className="text-center text-gray-400 mb-4">Cargando playlists...</p>}
          <div className="grid grid-cols-2 gap-4 overflow-y-auto">
            {isLoading ? (
              <>
                <PlaylistSkeleton />
                <PlaylistSkeleton />
                <PlaylistSkeleton />
                <PlaylistSkeleton />
                <PlaylistSkeleton />
                <PlaylistSkeleton />
                <PlaylistSkeleton />
                <PlaylistSkeleton />
                <PlaylistSkeleton />
              </>
            ) : (
              playlists.map((playlist) => (
                <div key={playlist.id} onClick={() => onPlaylistSelect(playlist)} className="flex flex-col items-center gap-2 cursor-pointer group">
                  <img
                    src={playlist.cover_url}
                    alt={playlist.nombre}
                    className="w-32 h-32 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform"
                  />
                  <p className="font-semibold text-sm text-center">{playlist.nombre}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <footer className="p-4 text-center border-t border-white/10">
        <h4 className="mb-2 text-white/80 text-sm">
          Hecho por{" "}
          <a href="https://www.github.com/CristopherPaiz" target="_blank" rel="noopener noreferrer" className="mx-1 hover:underline text-blue-400">
            Cristopher Paiz
          </a>
        </h4>
        <p className="text-xs text-gray-500 text-balance max-w-2xl mx-auto">
          Esta aplicación simula streaming de audio fragmentando las canciones para una carga más rápida, sin necesidad de un backend.
        </p>
      </footer>
    </div>
  );
};

Bienvenida.propTypes = {
  playlists: PropTypes.array.isRequired,
  onPlaylistSelect: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default Bienvenida;
