"use client";

import { supabase } from "./supabaseClient";

// همه‌ی عکس‌های قابل تغییر از این باکت (bucket) خونده می‌شن
export const IMAGES_BUCKET = "site-images";

// از روی مسیر لوکال (مثلا "/pod-koko-tenet.jpg") نام فایل رو در میاره
export function filenameFromPath(path) {
  if (!path) return "";
  return path.startsWith("/") ? path.slice(1) : path;
}

// آدرس عمومی فایل توی Supabase Storage رو می‌سازه
// اگه عکس هنوز توی Storage آپلود نشده باشه، این آدرس 404 میده
// و کامپوننت SiteImage به‌صورت خودکار به عکس پیش‌فرض توی public/ برمی‌گرده
export function getStorageImageUrl(path) {
  // اگه از قبل یه آدرس کامل (مثلا از آپلود مستقیم عکس محصول) باشه،
  // نیازی به تبدیل نیست، همون رو برگردون
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const filename = filenameFromPath(path);
  if (!filename) return path;
  const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(filename);
  if (!data?.publicUrl) return path;

  // مشکل: وقتی یه عکس با همون اسم فایل جایگزین می‌شه (upsert)، هم CDN
  // سوپابیس و هم کش مرورگر ممکنه تا مدت‌ها (خیلی بیشتر از cacheControl
  // که موقع آپلود ست کردیم) عکس قدیمی رو نشون بدن، چون آدرس فایل
  // دقیقاً عوض نشده. برای همین یه پارامتر cache-busting بر اساس دقیقه‌ی
  // فعلی به آدرس اضافه می‌کنیم تا حداکثر ۶۰ ثانیه بعد، مرورگر و CDN
  // مجبور بشن نسخه‌ی تازه رو از سرور اصلی بگیرن.
  const cacheBust = Math.floor(Date.now() / 60000);
  return `${data.publicUrl}?v=${cacheBust}`;
}
