import { createClient } from "@supabase/supabase-js";

// این کلاینت هم در کامپوننت‌های سرور (SSR)
// و هم در مرورگر کار می‌کند.
// فقط از کلید anon استفاده می‌کند.
function getReadClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// تبدیل ردیف Supabase به ساختار مورد نیاز سایت
function mapRow(row) {
  return {
    // =========================
    // اطلاعات اصلی محصول
    // =========================

    id: row.id,

    // تاریخ آخرین تغییر محصول
    // برای sitemap استفاده می‌شود
    updated_at: row.updated_at,

    name: row.name,
    category: row.category,
    brand: row.brand,

    // =========================
    // قیمت
    // =========================

    price: row.price,
    discount: row.discount,

    // =========================
    // امتیاز و نظرات
    // =========================

    rating: row.rating,
    reviewsCount: row.reviews_count,

    // =========================
    // ظاهر محصول
    // =========================

    color: row.color,
    badge: row.badge,

    // =========================
    // موجودی
    // =========================

    available: row.available,

    // =========================
    // تصاویر
    // =========================

    images: row.images || [],

    // =========================
    // رنگ‌های محصول
    // =========================

    colors: (row.colors || []).map((c, i) => ({
      id:
        c.id ||
        `${row.id}-color-${i}`,

      name: c.name || "",

      hex:
        c.hex ||
        "#000000",
    })),

    // =========================
    // توضیحات
    // =========================

    description: row.description,

    // =========================
    // مشخصات فنی
    // =========================

    specs: row.specs || [],

    // =========================
    // نظرات کاربران
    // =========================

    reviews: row.reviews || [],

    // =========================
    // اطلاعات برند
    // =========================

    brandDescription:
      row.brand_description || "",

    brandImage:
      row.brand_image || "",

    // =========================
    // پرسش و پاسخ
    // =========================

    qa: row.qa || [],
  };
}

// =====================================================
// دریافت تمام محصولات
// =====================================================

export async function getProducts() {
  const supabase = getReadClient();

  const {
    data,
    error,
  } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", {
      ascending: true,
    });

  if (error) {
    console.error(
      "getProducts error:",
      error
    );

    return [];
  }

  return (data || []).map(mapRow);
}

// =====================================================
// دریافت یک محصول بر اساس ID
// =====================================================

export async function getProductById(id) {
  if (!id) return null;

  const supabase = getReadClient();

  const {
    data,
    error,
  } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRow(data);
}

// =====================================================
// دریافت محصولات مرتبط
// =====================================================

export async function getRelated(
  product,
  limit = 4
) {
  const all = await getProducts();

  return all
    .filter(
      (p) =>
        p.category === product.category &&
        p.id !== product.id
    )
    .slice(0, limit);
}
