const DEFAULT_TIMEOUT_MS = 8000;

export function createFetchWithTimeout(timeoutMs = DEFAULT_TIMEOUT_MS) {
  return (input, init = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const existingSignal = init.signal;
    if (existingSignal) {
      if (existingSignal.aborted) {
        controller.abort();
      } else {
        existingSignal.addEventListener("abort", () => controller.abort());
      }
    }

    return fetch(input, { ...init, signal: controller.signal }).finally(() =>
      clearTimeout(timer)
    );
  };
}
