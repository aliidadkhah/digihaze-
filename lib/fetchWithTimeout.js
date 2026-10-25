const DEFAULT_TIMEOUT_MS = 4000;
const MAX_ATTEMPTS = 3;

const isServer = typeof window === "undefined";

function attempt(input, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const existingSignal = init.signal;
  if (existingSignal) {
    if (existingSignal.aborted) {
      controller.abort();
    } else {
      existingSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  const headers = new Headers(init.headers || {});
  if (isServer) {
    // اتصال keep-alive مرده دوباره استفاده نشه
    headers.set("connection", "close");
  }

  return fetch(input, { ...init, headers, signal: controller.signal }).finally(
    () => clearTimeout(timer)
  );
}

export function createFetchWithTimeout(timeoutMs = DEFAULT_TIMEOUT_MS) {
  return async (input, init = {}) => {
    const method = (init.method || "GET").toUpperCase();
    const canRetry = method === "GET" || method === "HEAD";
    const attempts = canRetry ? MAX_ATTEMPTS : 1;

    let lastError;
    for (let i = 0; i < attempts; i++) {
      try {
        return await attempt(input, init, timeoutMs);
      } catch (err) {
        lastError = err;
        if (init.signal && init.signal.aborted) throw err;
      }
    }
    throw lastError;
  };
}
