let fetchControllers = new Map();

self.onmessage = (event) => {
  const { type, url, index } = event.data;

  if (type === "cancel") {
    for (const controller of fetchControllers.values()) {
      controller.abort();
    }
    fetchControllers.clear();
    return;
  }

  if (type === "load") {
    fetchAndPost(url, index);
  }
};

async function fetchAndPost(url, index) {
  const controller = new AbortController();
  fetchControllers.set(index, controller);

  try {
    const response = await fetchWithRetries(url, 3, controller.signal);
    const arrayBuffer = await response.arrayBuffer();
    self.postMessage({ status: "success", index, arrayBuffer }, [arrayBuffer]);
  } catch (error) {
    if (error.name !== "AbortError") {
      self.postMessage({ status: "error", index, error: error.message });
    }
  } finally {
    fetchControllers.delete(index);
  }
}

async function fetchWithRetries(url, retries, signal) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { signal, cache: "force-cache" });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response;
    } catch (error) {
      if (signal.aborted) throw error;
      if (i === retries - 1) throw error;
      // Exponential backoff: 1s, 2s, 4s...
      const delay = Math.pow(2, i) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
