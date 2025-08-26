import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { API_URL } from "../../config";

const fetchAdminData = async () => {
  const [playlistsRes, songsRes] = await Promise.all([
    fetch(`${API_URL}/api/playlists/admin`, { credentials: "include" }),
    fetch(`${API_URL}/api/canciones/admin`, { credentials: "include" }),
  ]);
  if (!playlistsRes.ok || !songsRes.ok) throw new Error("Error al cargar los datos.");
  const playlists = await playlistsRes.json();
  const songs = await songsRes.json();
  return { playlists, songs };
};

const SortablePlaylistItem = ({ playlist, selectedPlaylistId, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: playlist.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(playlist)}
      className={`p-3 rounded cursor-grab flex justify-between items-center ${
        selectedPlaylistId === playlist.id ? "bg-green-600" : "bg-neutral-700 hover:bg-neutral-600"
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src={playlist.cover_url || "https://cdn-icons-png.flaticon.com/512/14793/14793826.png"}
          alt={playlist.nombre}
          className="w-10 h-10 rounded object-cover"
        />
        <span>
          {playlist.nombre} ({playlist.canciones_ids?.length || 0})
        </span>
      </div>
    </li>
  );
};

const PlaylistManager = () => {
  const queryClient = useQueryClient();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["adminData"], queryFn: fetchAdminData });

  const createPlaylistMutation = useMutation({
    mutationFn: (name) =>
      fetch(`${API_URL}/api/playlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nombre: name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminData"] });
      setNewPlaylistName("");
    },
  });

  const songActionMutation = useMutation({
    mutationFn: ({ playlistId, songId, action }) =>
      fetch(`${API_URL}/api/playlists/${playlistId}/canciones/${songId}`, { method: action === "add" ? "POST" : "DELETE", credentials: "include" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminData"] }),
  });

  const orderMutation = useMutation({
    mutationFn: (playlists) =>
      fetch(`${API_URL}/api/playlists/admin/order`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ playlists }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminData"] }),
  });

  const coverMutation = useMutation({
    mutationFn: ({ playlistId, formData }) =>
      fetch(`${API_URL}/api/playlists/admin/${playlistId}/cover`, { method: "POST", credentials: "include", body: formData }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminData"] }),
  });

  const updatePlaylistMutation = useMutation({
    mutationFn: (playlist) =>
      fetch(`${API_URL}/api/playlists/admin/${playlist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(playlist),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminData"] });
      setEditingPlaylist(null);
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: (playlistId) => fetch(`${API_URL}/api/playlists/admin/${playlistId}`, { method: "DELETE", credentials: "include" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminData"] });
      setSelectedPlaylistId(null);
    },
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = data.playlists.findIndex((p) => p.id === active.id);
      const newIndex = data.playlists.findIndex((p) => p.id === over.id);
      const newOrder = arrayMove(data.playlists, oldIndex, newIndex);
      const payload = newOrder.map((p, index) => ({ id: p.id, orden: index }));
      orderMutation.mutate(payload);
    }
  };

  const handleCoverChange = (e, playlistId) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("playlistCover", file);
    coverMutation.mutate({ playlistId, formData });
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const songPlaylistMap = useMemo(() => {
    if (!data?.playlists) return new Map();
    const map = new Map();
    data.playlists.forEach((playlist) => {
      playlist.canciones_ids.forEach((songId) => {
        if (!map.has(songId)) {
          map.set(songId, []);
        }
        map.get(songId).push(playlist.nombre);
      });
    });
    return map;
  }, [data?.playlists]);

  if (isLoading)
    return (
      <div className="text-center">
        <p>Cargando datos del administrador...</p>
      </div>
    );
  if (isError)
    return (
      <div className="text-center text-red-500">
        <p>Error: {error.message}</p>
      </div>
    );

  const selectedPlaylist = data.playlists.find((p) => p.id === selectedPlaylistId);
  const songsInPlaylist = selectedPlaylist ? data.songs.filter((song) => selectedPlaylist.canciones_ids.includes(song.id)) : [];
  const songsNotInPlaylist = selectedPlaylist ? data.songs.filter((song) => !selectedPlaylist.canciones_ids.includes(song.id)) : [];

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Gestionar Playlists</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-neutral-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold border-b border-neutral-700 pb-2 mb-4">Playlists (Arrastrar para ordenar)</h3>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={data.playlists} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {data.playlists.map((p) => (
                  <SortablePlaylistItem
                    key={p.id}
                    playlist={p}
                    selectedPlaylistId={selectedPlaylistId}
                    onSelect={() => setSelectedPlaylistId(p.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createPlaylistMutation.mutate(newPlaylistName);
            }}
            className="mt-4 flex gap-2"
          >
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Nueva playlist..."
              className="flex-grow px-3 py-2 text-white bg-neutral-700 border border-neutral-600 rounded-md"
            />
            <button
              type="submit"
              disabled={createPlaylistMutation.isPending}
              className="px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500"
            >
              {createPlaylistMutation.isPending ? "..." : "+"}
            </button>
          </form>
        </div>
        <div className="lg:col-span-2 bg-neutral-800 p-6 rounded-lg">
          {editingPlaylist ? (
            <div>
              <h3 className="text-xl font-semibold mb-4">Editando: {editingPlaylist.nombre}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updatePlaylistMutation.mutate(editingPlaylist);
                }}
              >
                <input
                  type="text"
                  value={editingPlaylist.nombre}
                  onChange={(e) => setEditingPlaylist({ ...editingPlaylist, nombre: e.target.value })}
                  className="w-full p-2 bg-neutral-700 rounded mb-2"
                />
                <textarea
                  value={editingPlaylist.descripcion || ""}
                  onChange={(e) => setEditingPlaylist({ ...editingPlaylist, descripcion: e.target.value })}
                  className="w-full p-2 bg-neutral-700 rounded mb-4"
                  rows="3"
                  placeholder="Descripción..."
                ></textarea>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={updatePlaylistMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500"
                  >
                    {updatePlaylistMutation.isPending ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPlaylist(null)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          ) : !selectedPlaylist ? (
            <div className="flex items-center justify-center h-full text-gray-400">Selecciona una playlist para gestionarla.</div>
          ) : (
            <div>
              <div className="flex justify-between items-center border-b border-neutral-700 pb-2 mb-4">
                <h3 className="text-xl font-semibold">{selectedPlaylist.nombre}</h3>
                <div className="flex gap-2">
                  <label
                    htmlFor={`cover-upload-${selectedPlaylist.id}`}
                    className="cursor-pointer bg-gray-600 hover:bg-gray-500 text-white text-sm font-bold py-2 px-3 rounded"
                  >
                    {coverMutation.isPending ? "Subiendo..." : "Carátula"}
                  </label>
                  <input
                    id={`cover-upload-${selectedPlaylist.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleCoverChange(e, selectedPlaylist.id)}
                  />
                  <button
                    onClick={() => setEditingPlaylist(selectedPlaylist)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-3 rounded"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Seguro que quieres eliminar la playlist "${selectedPlaylist.nombre}"?`))
                        deletePlaylistMutation.mutate(selectedPlaylist.id);
                    }}
                    disabled={deletePlaylistMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 rounded disabled:bg-gray-500"
                  >
                    {deletePlaylistMutation.isPending ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-2">Canciones en Playlist</h4>
                  <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {songsInPlaylist.map((song) => (
                      <li key={song.id} className="flex justify-between items-center p-2 bg-neutral-700 rounded text-sm">
                        <span>{song.titulo}</span>
                        <button
                          onClick={() => songActionMutation.mutate({ playlistId: selectedPlaylist.id, songId: song.id, action: "remove" })}
                          disabled={songActionMutation.isPending}
                          className="text-red-400 hover:text-red-300 text-xs disabled:text-gray-500"
                        >
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-2">Canciones Disponibles</h4>
                  <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {songsNotInPlaylist.map((song) => {
                      const playlistsOfSong = songPlaylistMap.get(song.id) || [];
                      return (
                        <li key={song.id} className="flex justify-between items-center p-2 bg-neutral-700 rounded text-sm">
                          <div className="flex-grow overflow-hidden">
                            <span className="block truncate">{song.titulo}</span>
                            {playlistsOfSong.length > 0 && (
                              <span className="block text-xs text-gray-400 truncate">En: {playlistsOfSong.join(", ")}</span>
                            )}
                          </div>
                          <button
                            onClick={() => songActionMutation.mutate({ playlistId: selectedPlaylist.id, songId: song.id, action: "add" })}
                            disabled={songActionMutation.isPending}
                            className="text-green-400 hover:text-green-300 text-xs disabled:text-gray-500 ml-2 flex-shrink-0"
                          >
                            Añadir
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistManager;
