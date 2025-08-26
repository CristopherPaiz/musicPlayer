import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "../../config";

const fetchSongs = async () => {
  const res = await fetch(`${API_URL}/api/canciones/admin`, { credentials: "include" });
  if (!res.ok) throw new Error("Error al cargar las canciones.");
  return res.json();
};

const AdminSongs = () => {
  const queryClient = useQueryClient();
  const { data: songs, isLoading } = useQuery({ queryKey: ["adminSongs"], queryFn: fetchSongs });

  const deleteMutation = useMutation({
    mutationFn: (songId) => fetch(`${API_URL}/api/canciones/admin/${songId}`, { method: "DELETE", credentials: "include" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSongs"] });
      queryClient.invalidateQueries({ queryKey: ["adminData"] });
    },
  });

  const handleDelete = (song) => {
    if (window.confirm(`¿Seguro que quieres eliminar "${song.titulo}"? Esta acción no se puede deshacer y borrará todos sus archivos.`)) {
      deleteMutation.mutate(song.id);
    }
  };

  if (isLoading) return <p>Cargando canciones...</p>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Gestionar Canciones</h2>
      <div className="bg-neutral-800 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-neutral-700">
            <tr>
              <th className="p-4">Título</th>
              <th className="p-4">Artista</th>
              <th className="p-4">Álbum</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {songs?.map((song) => (
              <tr key={song.id} className="border-b border-neutral-700 hover:bg-neutral-700/50">
                <td className="p-4">{song.titulo}</td>
                <td className="p-4">{song.artista}</td>
                <td className="p-4">{song.album}</td>
                <td className="p-4">
                  <button
                    onClick={() => handleDelete(song)}
                    disabled={deleteMutation.isPending && deleteMutation.variables === song.id}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-1 px-3 rounded disabled:bg-gray-500"
                  >
                    {deleteMutation.isPending && deleteMutation.variables === song.id ? "Borrando..." : "Eliminar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSongs;
