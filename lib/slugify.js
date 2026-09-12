// =====================================================
// تبدیل اسم محصول به اسلاگ URL-friendly
// پشتیبانی از حروف فارسی و انگلیسی
// =====================================================

export function slugify(name) {
  if (!name || typeof name !== "string") return "";

  return name
    .trim()
    .toLowerCase()
    // فاصله‌ها و کاراکترهای غیرحرف/عدد (فارسی هم پشتیبانی می‌شه) -> خط تیره
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

// =====================================================
// ساخت اسلاگ یکتا با چک کردن دیتابیس
// اگه اسلاگ تکراری بود، عدد اضافه می‌کنه: نام-محصول-2
// =====================================================

export async function generateUniqueSlug(supabaseAdmin, name, excludeId = null) {
  const base = slugify(name);

  if (!base) return null;

  let candidate = base;
  let counter = 2;

  // حداکثر ۲۰ بار تلاش برای پیدا کردن اسلاگ آزاد
  for (let i = 0; i < 20; i++) {
    let query = supabaseAdmin
      .from("products")
      .select("id")
      .eq("slug", candidate);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("generateUniqueSlug error:", error);
      return candidate; // در بدترین حالت، بدون چک برمی‌گردونیم
    }

    if (!data) {
      return candidate; // آزاده
    }

    candidate = `${base}-${counter}`;
    counter++;
  }

  return `${base}-${Date.now()}`;
}
