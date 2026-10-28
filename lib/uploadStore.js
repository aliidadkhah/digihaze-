// =====================================================
// ذخیره‌ی فایل‌های آپلودی (عکس/ویدیو) روی خود سرور
// (جایگزین Supabase Storage). فقط سمت سرور استفاده بشه.
//
// پوشه‌ی پیش‌فرض: /var/lib/digihaze-uploads  (با UPLOAD_DIR عوض می‌شه)
// این پوشه بیرون از پروژه‌ست تا دیپلوی جدید فایل‌ها رو پاک نکنه.
// =====================================================
import path from "node:path";

export const UPLOAD_ROOT = process.env.UPLOAD_DIR || "/var/lib/digihaze-uploads";

// فقط همین دو باکت (مثل قبل)
export const ALLOWED_BUCKETS = new Set(["site-images", "product-images"]);

export const CONTENT_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export function extOf(filename) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(String(filename || ""));
  return m ? m[1].toLowerCase() : "";
}

// مسیر امن روی دیسک؛ اگه ورودی مشکوک بود (.. یا مسیر مطلق) null برمی‌گردونه
export function resolveUploadPath(bucket, filename) {
  if (!ALLOWED_BUCKETS.has(bucket)) return null;

  const rel = String(filename || "").replace(/\\/g, "/");
  if (!rel || rel.startsWith("/") || rel.includes("\0")) return null;

  const parts = rel.split("/");
  if (parts.some((p) => p === "" || p === "." || p === "..")) return null;

  const base = path.join(UPLOAD_ROOT, bucket);
  const full = path.join(base, ...parts);
  if (!full.startsWith(base + path.sep)) return null;

  return full;
}

// بعضی فایل‌ها پسوند ندارن (مثل لوگوی برندها: brand-logos/pod-oxva)؛ نوعشون
// رو از «بایت‌های اول فایل» تشخیص می‌دیم.
export function sniffContentType(buf) {
  if (!buf || buf.length < 4) return null;
  const hex = (a, b) => buf.subarray(a, b).toString("hex");
  const ascii = (a, b) => buf.subarray(a, b).toString("latin1");

  if (hex(0, 3) === "ffd8ff") return "image/jpeg";
  if (hex(0, 4) === "89504e47") return "image/png";
  if (ascii(0, 4) === "GIF8") return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    return brand === "avif" || brand === "avis" ? "image/avif" : "video/mp4";
  }
  if (hex(0, 4) === "1a45dfa3") return "video/webm";
  const head = ascii(0, 64).trimStart().toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) return "image/svg+xml";
  return null;
}

export const ALLOWED_TYPES = new Set(Object.values(CONTENT_TYPES));
