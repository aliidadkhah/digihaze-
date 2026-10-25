// =====================================================
// کش ساده‌ی سمت سرور (توی حافظه‌ی همون پروسه‌ی Node / pm2)
//
// - تا TTL: داده از حافظه برگردونده می‌شه و به Supabase درخواست نمی‌ره.
// - بعد از TTL: داده‌ی قدیمی فوراً برگردونده می‌شه و پشت صحنه تازه می‌شه
//   (کاربر منتظر نمی‌مونه).
// - اگه Supabase خطا داد یا تایم‌اوت شد، داده‌ی قدیمی همچنان نشون داده می‌شه.
// - globalThis باعث می‌شه کش بین صفحه‌ها و API ها مشترک باشه.
// =====================================================

const store = globalThis.__dhServerCache || (globalThis.__dhServerCache = new Map());

const MAX_KEYS = 500;

function startRefresh(entry, ttlMs, loader) {
  const p = Promise.resolve()
    .then(loader)
    .then(
      (value) => {
        entry.value = value;
        entry.has = true;
        entry.expires = Date.now() + ttlMs;
        entry.promise = null;
        return value;
      },
      (err) => {
        entry.promise = null;
        throw err;
      }
    );

  entry.promise = p;
  return p;
}

export async function cached(key, ttlMs, loader) {
  let entry = store.get(key);

  if (!entry) {
    if (store.size >= MAX_KEYS) {
      // قدیمی‌ترین کلید رو حذف می‌کنیم تا حافظه بی‌نهایت بالا نره
      store.delete(store.keys().next().value);
    }
    entry = { has: false, value: undefined, expires: 0, promise: null };
    store.set(key, entry);
  }

  // تازه
  if (entry.has && Date.now() < entry.expires) return entry.value;

  // قدیمی ولی موجود: همون رو بده و پشت صحنه تازه کن
  if (entry.has) {
    if (!entry.promise) {
      startRefresh(entry, ttlMs, loader).catch((e) =>
        console.error(`CACHE refresh failed (${key}):`, e?.message || e)
      );
    }
    return entry.value;
  }

  // اولین بار: باید صبر کنیم (درخواست‌های هم‌زمان یک درخواست مشترک دارن)
  if (!entry.promise) startRefresh(entry, ttlMs, loader);
  return entry.promise;
}

// پاک کردن کش همه‌ی کلیدهایی که با این پیشوندها شروع می‌شن
export function invalidateCache(prefixes) {
  const list = Array.isArray(prefixes) ? prefixes : [prefixes];
  for (const key of [...store.keys()]) {
    if (list.some((p) => key.startsWith(p))) store.delete(key);
  }
}

// هندلر API رو می‌پیچه تا بعد از هر تغییر (POST/PATCH/DELETE)، کش مربوطه پاک بشه
export function withInvalidate(handler, prefixes) {
  return async (...args) => {
    try {
      return await handler(...args);
    } finally {
      invalidateCache(prefixes);
    }
  };
}
