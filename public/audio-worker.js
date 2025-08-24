// Worker mejorado con capacidad de cancelación

let fetchControllers = new Map(); // Mapa para almacenar los AbortControllers de cada descarga

self.onmessage = (event) => {
  const { type, url, index } = event.data;

  if (type === "cancel") {
    console.log("[Worker] Recibida orden de cancelación. Abortando todas las descargas pendientes.");
    for (const [idx, controller] of fetchControllers.entries()) {
      controller.abort();
      console.log(`[Worker] Descarga del fragmento ${idx} abortada.`);
    }
    fetchControllers.clear();
    return;
  }

  // Si es una petición de descarga (type === 'load' o indefinido por retrocompatibilidad)
  fetchAndPost(url, index);
};

async function fetchAndPost(url, index) {
  const controller = new AbortController();
  fetchControllers.set(index, controller);

  try {
    const response = await fetchWithRetries(url, 3, controller.signal);
    const arrayBuffer = await response.arrayBuffer();
    self.postMessage({ status: "success", index, arrayBuffer }, [arrayBuffer]);
  } catch (error) {
    if (error.name === "AbortError") {
      console.log(`[Worker] La descarga del fragmento ${index} fue cancelada correctamente.`);
    } else {
      self.postMessage({ status: "error", index, error: error.message });
    }
  } finally {
    // Limpiamos el controller del mapa una vez que la operación ha terminado (éxito, error o cancelación)
    fetchControllers.delete(index);
  }
}

async function fetchWithRetries(url, retries, signal) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { signal }); // Pasamos la señal al fetch
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (signal.aborted) {
        throw error; // Si fue abortado, lanzamos el error inmediatamente
      }
      console.warn(`[Worker] Intento ${i + 1} fallido para ${url}:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
    }
  }
}
