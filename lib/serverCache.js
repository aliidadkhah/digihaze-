// =====================================================
// کش ساده‌ی سمت سرور (توی حافظه‌ی همون پروسه‌ی Node / pm2)
//
// - تا TTL: داده از حافظه برگردونده می‌شه و به Supabase درخواست نمی‌ره.
// - بعد از TTL: داده‌ی قدیمی فوراً برگردونده می‌شه و پشت صحنه تازه می‌شه
//   (کاربر منتظر نمی‌مونه).
// - اگه Supabase خطا داد یا تایم‌اوت شد، داده‌ی قدیمی همچنان نشون داده می‌شه.
// - globalThis باعث می‌شه کش بین صفحه‌ها و API ها مشترک باشه.
// =====================================================

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

// =====================================================
// نسخه‌ی روی دیسک (snapshot)
//
// آخرین داده‌ی سالمِ هر کلید روی دیسک هم ذخیره می‌شه. بعد از ری‌استارت یا
// دیپلوی، به‌جای اینکه صفحه‌ها منتظر Supabase بمونن (و nginx بعد از ۶۰ ثانیه
// ۵۰۴ بده)، همون داده‌ی ذخیره‌شده فوراً نشون داده می‌شه و داده‌ی تازه پشت
// صحنه می‌آد. بعد از هر تغییر از پنل ادمین، snapshot های مربوطه پاک می‌شن.
// مسیر رو می‌شه با CACHE_SNAPSHOT_DIR عوض کرد.
// =====================================================

const SNAP_DIR =
  process.env.CACHE_SNAPSHOT_DIR || path.join(os.tmpdir(), "digihaze-cache");

function snapFile(key) {
  return path.join(
    SNAP_DIR,
    crypto.createHash("sha1").update(key).digest("hex") + ".json"
  );
}

function writeSnapshot(key, value) {
  try {
    if (value === undefined || value === null) return;
    fs.mkdirSync(SNAP_DIR, { recursive: true });
    const file = snapFile(key);
    const tmp = file + "." + process.pid + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(key) + "\n" + JSON.stringify(value));
    fs.renameSync(tmp, file);
  } catch {
    // ذخیره روی دیسک اختیاریه؛ خطاش نباید سایت رو خراب کنه
  }
}

function readSnapshot(key) {
  try {
    const raw = fs.readFileSync(snapFile(key), "utf8");
    const nl = raw.indexOf("\n");
    if (nl < 0 || JSON.parse(raw.slice(0, nl)) !== key) return null;
    return { value: JSON.parse(raw.slice(nl + 1)) };
  } catch {
    return null;
  }
}

function deleteSnapshots(prefixes) {
  try {
    for (const name of fs.readdirSync(SNAP_DIR)) {
      if (!name.endsWith(".json")) continue;
      const file = path.join(SNAP_DIR, name);
      try {
        const fd = fs.openSync(file, "r");
        const buf = Buffer.alloc(1024);
        const n = fs.readSync(fd, buf, 0, 1024, 0);
        fs.closeSync(fd);
        const head = buf.toString("utf8", 0, n);
        const nl = head.indexOf("\n");
        if (nl < 0) continue;
        const key = JSON.parse(head.slice(0, nl));
        if (typeof key === "string" && prefixes.some((p) => key.startsWith(p))) {
          fs.unlinkSync(file);
        }
      } catch {
        // فایل خراب یا نیمه‌کاره؛ رد می‌شیم
      }
    }
  } catch {
    // پوشه هنوز ساخته نشده
  }
}

const store = globalThis.__dhServerCache || (globalThis.__dhServerCache = new Map());

const MAX_KEYS = 500;

function startRefresh(key, entry, ttlMs, loader) {
  const p = Promise.resolve()
    .then(loader)
    .then(
      (value) => {
        entry.value = value;
        entry.has = true;
        entry.expires = Date.now() + ttlMs;
        entry.promise = null;
        writeSnapshot(key, value);
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

    // بعد از ری‌استارت: آخرین داده‌ی سالم از دیسک (به‌عنوان «قدیمی»، که پشت صحنه تازه می‌شه)
    const snap = readSnapshot(key);
    if (snap) {
      entry.value = snap.value;
      entry.has = true;
      entry.expires = 0;
    }

    store.set(key, entry);
  }

  // تازه
  if (entry.has && Date.now() < entry.expires) return entry.value;

  // قدیمی ولی موجود: همون رو بده و پشت صحنه تازه کن
  if (entry.has) {
    if (!entry.promise) {
      startRefresh(key, entry, ttlMs, loader).catch((e) =>
        console.error(`CACHE refresh failed (${key}):`, e?.message || e)
      );
    }
    return entry.value;
  }

  // اولین بار: باید صبر کنیم (درخواست‌های هم‌زمان یک درخواست مشترک دارن)
  if (!entry.promise) startRefresh(key, entry, ttlMs, loader);
  return entry.promise;
}

// پاک کردن کش همه‌ی کلیدهایی که با این پیشوندها شروع می‌شن
export function invalidateCache(prefixes) {
  const list = Array.isArray(prefixes) ? prefixes : [prefixes];
  for (const key of [...store.keys()]) {
    if (list.some((p) => key.startsWith(p))) store.delete(key);
  }
  deleteSnapshots(list);
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
