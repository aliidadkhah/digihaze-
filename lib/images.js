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
  const filename = filenameFromPath(path);
  if (!filename) return path;
  const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(filename);
  return data?.publicUrl || path;
}
