"use client";

// =====================================================
// جایگزین supabase.storage سمت مرورگر
//
// همون سه تابعی که برنامه از Supabase Storage استفاده می‌کرد
// (upload / getPublicUrl / remove) با همون شکل جواب، ولی فایل‌ها روی خود
// سرور سایت ذخیره می‌شن و از آدرس /uploads/... خونده می‌شن.
// (احراز هویت ادمین فعلاً هنوز با Supabase Auth انجام می‌شه.)
// =====================================================

import { supabase } from "./supabaseClient";

function encodePath(filename) {
  return String(filename || "")
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

// آدرس نسبی (برای رندر سمت سرور و کلاینت یکسانه؛ مشکل hydration نداره)
export function localImageUrl(bucket, filename) {
  return `/uploads/${bucket}/${encodePath(filename)}`;
}

// آدرس کامل؛ فقط توی رویدادهای مرورگر (بعد از آپلود) برای ذخیره توی دیتابیس
// استفاده بشه تا توی og:image و پیام‌های تلگرام/بله هم درست کار کنه
export function absoluteUrl(path) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token || "";
  return { Authorization: `Bearer ${token}` };
}

export const fileStorage = {
  from(bucket) {
    return {
      async upload(filename, file, options = {}) {
        try {
          const form = new FormData();
          form.append("bucket", bucket);
          form.append("filename", filename);
          form.append("upsert", options.upsert ? "1" : "0");
          form.append("file", file);

          const res = await fetch("/api/admin/storage", {
            method: "POST",
            headers: await authHeader(),
            body: form,
          });
          const json = await res.json().catch(() => ({}));

          if (!res.ok) {
            return {
              data: null,
              error: {
                message: json?.error || "upload failed",
                statusCode: String(res.status),
              },
            };
          }
          return { data: { path: filename }, error: null };
        } catch (e) {
          return { data: null, error: { message: String(e?.message || e) } };
        }
      },

      getPublicUrl(filename) {
        return { data: { publicUrl: localImageUrl(bucket, filename) } };
      },

      async remove(filenames) {
        try {
          const res = await fetch("/api/admin/storage", {
            method: "DELETE",
            headers: { ...(await authHeader()), "Content-Type": "application/json" },
            body: JSON.stringify({ bucket, filenames }),
          });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            return { data: null, error: { message: json?.error || "remove failed" } };
          }
          return { data: filenames.map((name) => ({ name })), error: null };
        } catch (e) {
          return { data: null, error: { message: String(e?.message || e) } };
        }
      },
    };
  },
};
