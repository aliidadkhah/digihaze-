// =====================================================
// fetch با تایم‌اوت و تلاش مجدد (برای Supabase)
//
// - درخواست‌های خواندنی (GET/HEAD): بعد از readTimeoutMs قطع می‌شن و
//   حداکثر readRetries بار دوباره امتحان می‌شن (خوندن بی‌خطره).
// - درخواست‌های نوشتنی (POST/PATCH/PUT/DELETE: ثبت سفارش، پرداخت،
//   آپلود عکس، RPC آمار و ...): هرگز تکرار نمی‌شن و فقط اگه writeTimeoutMs
//   داده شده باشه (و بزرگ‌تر از ۰) قطع می‌شن. تایم‌اوت کوتاه روی نوشتن
//   خطرناکه، چون ممکنه نوشتن انجام شده باشه ولی ما خطا ببینیم
//   (مثلاً سفارش ثبت بشه ولی پرداخت «ناموفق» نشون داده بشه).
// =====================================================

function runOnce(input, init, timeoutMs) {
  if (!timeoutMs) return fetch(input, init);

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error(`Request timed out after ${timeoutMs}ms`)),
    timeoutMs
  );

  const outer = init.signal;
  let onAbort = null;

  if (outer) {
    if (outer.aborted) {
      controller.abort(outer.reason);
    } else {
      onAbort = () => controller.abort(outer.reason);
      outer.addEventListener("abort", onAbort, { once: true });
    }
  }

  const cleanup = () => {
    clearTimeout(timer);
    if (outer && onAbort) outer.removeEventListener("abort", onAbort);
  };

  // مهم: تایمر باید تا خوانده شدن «کامل بدنه‌ی جواب» فعال بمونه، نه فقط تا رسیدن
  // هدرها. وگرنه اگه جواب وسط راه گیر کنه (بسته‌های گم‌شده)، تایم‌اوت و تلاش
  // مجدد هیچ‌وقت کار نمی‌کنن و درخواست تا قطع شدن سیستم‌عامل می‌مونه.
  return (async () => {
    try {
      const res = await fetch(input, { ...init, signal: controller.signal });
      const bodyless = [101, 204, 205, 304].includes(res.status);
      const buf = bodyless ? null : await res.arrayBuffer();

      const headers = new Headers(res.headers);
      headers.delete("content-encoding");
      headers.delete("content-length");

      return new Response(buf, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    } finally {
      cleanup();
    }
  })();
}

export function createFetchWithTimeout(readTimeoutMs = 4000, options = {}) {
  const { writeTimeoutMs = 0, readRetries = 2 } = options;

  return async function fetchWithTimeout(input, init = {}) {
    const method = String(
      init.method || (typeof input !== "string" && input?.method) || "GET"
    ).toUpperCase();

    const isRead = method === "GET" || method === "HEAD";

    if (!isRead) return runOnce(input, init, writeTimeoutMs);

    let lastError;

    for (let i = 0; i <= readRetries; i++) {
      try {
        return await runOnce(input, init, readTimeoutMs);
      } catch (err) {
        lastError = err;
        // اگه خود کتابخونه درخواست رو لغو کرده، تکرار نمی‌کنیم
        if (init.signal && init.signal.aborted) throw err;
      }
    }

    throw lastError;
  };
}
