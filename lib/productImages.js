"use client";

import { fileStorage, absoluteUrl } from "./fileStorage";

// عکس‌های محصولات توی این باکت آپلود می‌شن.
// اگه این باکت توی Supabase Storage وجود نداره، اول از پنل Supabase بسازش
// (Public bucket، دقیقا مثل باکت "site-images")
export const PRODUCT_IMAGES_BUCKET = "product-images";

// Supabase Storage حروف غیر انگلیسی (مثل فارسی) رو توی اسم فایل قبول نمی‌کنه،
// پس حروف فارسی رو به معادل انگلیسی تبدیل و بقیه رو به خط‌تیره تبدیل می‌کنیم.
const FA_TO_EN = {
  "ا":"a","آ":"a","ب":"b","پ":"p","ت":"t","ث":"s","ج":"j","چ":"ch","ح":"h",
  "خ":"kh","د":"d","ذ":"z","ر":"r","ز":"z","ژ":"zh","س":"s","ش":"sh","ص":"s",
  "ض":"z","ط":"t","ظ":"z","ع":"a","غ":"gh","ف":"f","ق":"gh","ک":"k","ك":"k",
  "گ":"g","ل":"l","م":"m","ن":"n","و":"v","ه":"h","ی":"i","ي":"i","ئ":"i",
  "ء":"","ة":"h","ؤ":"v","أ":"a","إ":"a",
  "۰":"0","۱":"1","۲":"2","۳":"3","۴":"4","۵":"5","۶":"6","۷":"7","۸":"8","۹":"9",
  "٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9",
};

function toSafeBaseName(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[\u0600-\u06FF]/g, (ch) => FA_TO_EN[ch] ?? "")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// یک فایل عکس رو آپلود می‌کنه و آدرس عمومیش رو برمی‌گردونه.
// baseName (اختیاری): اسم دلخواه فایل، مثلا اسلاگ محصول (oxva-mint-gum-salt-30ml).
// اگه ندی، از اسم خود فایل انتخاب‌شده استفاده می‌شه؛ و فقط اگه هیچ اسم
// انگلیسی قابل استفاده‌ای نبود، یه اسم عمومی (image) می‌گیره.
export async function uploadProductImage(file, baseName) {
  if (!file) return null;

  const rawName = file.name || "";
  const dot = rawName.lastIndexOf(".");
  const ext = (
    dot > -1 ? rawName.slice(dot + 1) : ""
  ).toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const nameWithoutExt = dot > -1 ? rawName.slice(0, dot) : rawName;

  const base =
    toSafeBaseName(baseName) ||
    toSafeBaseName(nameWithoutExt) ||
    "image";

  const uploadOptions = {
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
  };

  // اول با اسم تمیز امتحان می‌کنیم؛ اگه قبلا فایلی با همین اسم بود،
  // یه پسوند کوتاه اضافه می‌کنیم تا فایل قبلی بازنویسی نشه.
  let filename = `${base}.${ext}`;
  let { error } = await fileStorage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filename, file, uploadOptions);

  if (error && /exist|duplicate/i.test(`${error.message} ${error.statusCode}`)) {
    filename = `${base}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    ({ error } = await fileStorage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(filename, file, uploadOptions));
  }

  if (error) {
    console.error("Product image upload error:", error);
    throw error;
  }

  const { data } = fileStorage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(filename);

  return data?.publicUrl ? absoluteUrl(data.publicUrl) : null;
}

// عکس آپلودشده رو از Storage به‌طور کامل حذف می‌کنه
// (تا وقتی فقط از فرم برداشته می‌شد، فایل توی Storage باقی می‌موند)
export async function deleteProductImage(url) {
  if (!url) return;

  // از روی آدرس عمومی، اسم فایل داخل باکت رو استخراج می‌کنیم
  const marker = `/${PRODUCT_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return; // آدرس خارجی/قدیمی، چیزی برای حذف از این باکت نیست

  const filename = decodeURIComponent(url.slice(idx + marker.length));
  if (!filename) return;

  const { error } = await fileStorage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([filename]);

  if (error) {
    console.error("Product image delete error:", error);
  }
}
