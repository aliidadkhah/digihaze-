"use client";

import { supabase } from "./supabaseClient";

// عکس‌های محصولات توی این باکت آپلود می‌شن.
// اگه این باکت توی Supabase Storage وجود نداره، اول از پنل Supabase بسازش
// (Public bucket، دقیقا مثل باکت "site-images")
export const PRODUCT_IMAGES_BUCKET = "product-images";

// یک فایل عکس رو آپلود می‌کنه و آدرس عمومیش رو برمی‌گردونه
export async function uploadProductImage(file) {
  if (!file) return null;

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filename, file, {
      cacheControl: "3600",
      contentType: file.type || "image/jpeg",
    });

  if (error) {
    console.error("Product image upload error:", error);
    throw error;
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(filename);

  return data?.publicUrl || null;
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

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([filename]);

  if (error) {
    console.error("Product image delete error:", error);
  }
}
