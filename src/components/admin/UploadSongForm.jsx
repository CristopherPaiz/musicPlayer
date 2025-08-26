import { useState } from "react";
import { API_URL } from "../../config";
import { useQueryClient } from "@tanstack/react-query";

const UploadSongForm = () => {
  const queryClient = useQueryClient();
  const [songsToUpload, setSongsToUpload] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [globalSuccess, setGlobalSuccess] = useState(null);

  const updateSongState = (index, newState) => {
    setSongsToUpload((prev) => prev.map((song, i) => (i === index ? { ...song, ...newState } : song)));
  };

  const handleFileChange = (e) => {
    setGlobalError(null);
    setGlobalSuccess(null);
    const files = Array.from(e.target.files);
    files.sort((a, b) => a.name.localeCompare(b.name)); // Ordenar por nombre
    setSongsToUpload(
      files.map((file) => ({
        file,
        status: "pending", // pending, extracting, extracted, uploading, success, error
        metadata: null,
        tempFilename: null,
        error: null,
      }))
    );
  };

  const handleExtractAll = async () => {
    setIsExtracting(true);
    setGlobalError(null);
    setGlobalSuccess(null);

    for (let i = 0; i < songsToUpload.length; i++) {
      const song = songsToUpload[i];
      if (song.status !== "pending") continue;

      updateSongState(i, { status: "extracting" });
      const formData = new FormData();
      formData.append("audioFile", song.file);

      try {
        const response = await fetch(`${API_URL}/api/canciones/admin/upload-extract`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Error al extraer metadatos.");
        updateSongState(i, { status: "extracted", metadata: data.metadata, tempFilename: data.tempFilename });
      } catch (err) {
        updateSongState(i, { status: "error", error: err.message });
      }
    }
    setIsExtracting(false);
  };

  const handleMetadataChange = (e, index) => {
    const { name, value } = e.target;
    setSongsToUpload((prev) =>
      prev.map((song, i) =>
        i === index
          ? {
              ...song,
              metadata: { ...song.metadata, [name]: value },
            }
          : song
      )
    );
  };

  const handleProcessAll = async () => {
    setIsProcessingAll(true);
    setGlobalError(null);
    setGlobalSuccess(null);
    let successCount = 0;

    for (let i = 0; i < songsToUpload.length; i++) {
      const song = songsToUpload[i];
      if (song.status !== "extracted") continue;

      updateSongState(i, { status: "uploading" });
      try {
        const payload = {
          tempFilename: song.tempFilename,
          titulo: song.metadata.titulo,
          artista: song.metadata.artista,
          album: song.metadata.album,
        };
        const response = await fetch(`${API_URL}/api/canciones/admin/process-save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Error al procesar la canción.");
        updateSongState(i, { status: "success" });
        successCount++;
      } catch (err) {
        updateSongState(i, { status: "error", error: err.message });
      }
    }
    setIsProcessingAll(false);
    if (successCount > 0) {
      setGlobalSuccess(`${successCount} canción(es) subida(s) exitosamente. Refrescando datos...`);
      queryClient.invalidateQueries({ queryKey: ["adminData"] });
      queryClient.invalidateQueries({ queryKey: ["adminSongs"] });
    }
    if (successCount < songsToUpload.filter((s) => s.status === "extracted" || s.status === "uploading").length) {
      setGlobalError("Algunas canciones no se pudieron subir. Revisa la lista.");
    }
  };

  const allExtracted =
    songsToUpload.length > 0 && songsToUpload.every((s) => s.status === "extracted" || s.status === "success" || s.status === "error");

  return (
    <div className="bg-neutral-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Subir Nuevas Canciones (en Lote)</h2>

      {globalError && <div className="bg-red-900 border border-red-700 text-white px-4 py-3 rounded mb-4">{globalError}</div>}
      {globalSuccess && <div className="bg-green-900 border border-green-700 text-white px-4 py-3 rounded mb-4">{globalSuccess}</div>}

      <div className="space-y-4">
        <div>
          <label htmlFor="audio-file-input" className="block text-sm font-medium text-gray-300 mb-1">
            Paso 1: Seleccionar Archivos MP3 (se ordenarán por nombre)
          </label>
          <input
            id="audio-file-input"
            type="file"
            accept="audio/mpeg"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
          />
        </div>

        {songsToUpload.length > 0 && (
          <button
            onClick={handleExtractAll}
            disabled={isExtracting || allExtracted}
            className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500"
          >
            {isExtracting ? "Extrayendo Metadatos..." : "Paso 2: Extraer Metadatos de Todas"}
          </button>
        )}
      </div>

      {songsToUpload.length > 0 && (
        <div className="mt-8 pt-6 border-t border-neutral-700 space-y-4">
          <h3 className="text-xl font-semibold mb-4">Paso 3: Confirmar Información</h3>
          {songsToUpload.map((song, index) => (
            <div key={index} className="bg-neutral-700/50 p-4 rounded-lg">
              <p className="font-bold mb-2 truncate">{song.file.name}</p>
              {song.status === "pending" && <p className="text-gray-400">Esperando para extraer metadatos...</p>}
              {song.status === "extracting" && <p className="text-blue-400">Extrayendo metadatos...</p>}
              {song.status === "error" && <p className="text-red-500">Error: {song.error}</p>}
              {song.status === "success" && <p className="text-green-500">¡Subida completada!</p>}
              {song.status === "uploading" && <p className="text-yellow-400">Subiendo y procesando...</p>}
              {song.status === "extracted" && song.metadata && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    {song.metadata.cover && (
                      <img src={`data:image/jpeg;base64,${song.metadata.cover}`} alt="Cover" className="w-full h-auto object-cover rounded-md" />
                    )}
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <input
                      type="text"
                      name="titulo"
                      value={song.metadata.titulo}
                      onChange={(e) => handleMetadataChange(e, index)}
                      className="w-full px-3 py-2 text-sm text-white bg-neutral-700 border border-neutral-600 rounded-md"
                      placeholder="Título"
                    />
                    <input
                      type="text"
                      name="artista"
                      value={song.metadata.artista}
                      onChange={(e) => handleMetadataChange(e, index)}
                      className="w-full px-3 py-2 text-sm text-white bg-neutral-700 border border-neutral-600 rounded-md"
                      placeholder="Artista"
                    />
                    <input
                      type="text"
                      name="album"
                      value={song.metadata.album}
                      onChange={(e) => handleMetadataChange(e, index)}
                      className="w-full px-3 py-2 text-sm text-white bg-neutral-700 border border-neutral-600 rounded-md"
                      placeholder="Álbum"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          {allExtracted && (
            <button
              onClick={handleProcessAll}
              disabled={isProcessingAll || songsToUpload.every((s) => s.status !== "extracted")}
              className="w-full mt-6 px-4 py-3 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500 text-lg"
            >
              {isProcessingAll ? "Procesando Todas las Canciones..." : "Confirmar y Guardar Todas"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadSongForm;
