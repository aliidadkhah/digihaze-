import { createClient } from "@supabase/supabase-js";

// =====================================================
// Supabase Read Client
// =====================================================

function getReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  return createClient(url, key);
}

// =====================================================
// تبدیل ردیف Supabase به ساختار سایت
// =====================================================

function mapRow(row) {
  // ---------------------------------------------------
  // نظرات
  // ---------------------------------------------------

  const reviews = Array.isArray(row.reviews)
    ? row.reviews.filter(Boolean)
    : [];

  // ---------------------------------------------------
  // تعداد نظرات
  // ---------------------------------------------------

  const reviewsCount =
    Number(row.reviews_count) || reviews.length;

  // ---------------------------------------------------
  // امتیاز
  // ---------------------------------------------------

  const rating =
    Number(row.rating) || 0;

  // ---------------------------------------------------
  // slug
  // ---------------------------------------------------

  const slug =
    typeof row.slug === "string" &&
    row.slug.trim()
      ? row.slug.trim()
      : null;

  // ===================================================
  // خروجی
  // ===================================================

  return {
    // =================================================
    // اطلاعات اصلی
    // =================================================

    id: row.id,

    name: row.name || "",

    slug,

    category: row.category || "",

    brand: row.brand || "",

    updated_at:
      row.updated_at || null,

    // =================================================
    // قیمت
    // =================================================

    price:
      Number(row.price) || 0,

    discount:
      Number(row.discount) || 0,

    // قیمت نهایی دقیقی که ادمین ثبت کرده (منبع اصلی قیمت با تخفیف)
    finalPrice:
      Number(row.final_price) || 0,

    // =================================================
    // امتیاز و نظرات
    // =================================================

    rating,

    reviewsCount,

    reviews,

    // =================================================
    // ظاهر
    // =================================================

    color:
      row.color || "",

    badge:
      row.badge || "",

    // =================================================
    // موجودی
    // =================================================

    available:
      row.available !== false,

    // =================================================
    // تصاویر
    // =================================================

    images:
      Array.isArray(row.images)
        ? row.images.filter(Boolean)
        : [],

    // =================================================
    // رنگ‌های محصول
    // =================================================

    colors:
      Array.isArray(row.colors)
        ? row.colors.map((c, i) => ({
            id:
              c?.id ||
              `${row.id}-color-${i}`,

            name:
              c?.name || "",

            hex:
              c?.hex || "#000000",
          }))
        : [],

    // =================================================
    // توضیحات
    // =================================================

    description:
      row.description || "",

    // =================================================
    // مشخصات فنی
    // =================================================

    specs:
      Array.isArray(row.specs)
        ? row.specs
        : [],

    // =================================================
    // ویژگی‌های مهم (خلاصه‌ای که زیر دکمه افزودن به سبد نشون داده می‌شه)
    // =================================================

    features:
      Array.isArray(row.features)
        ? row.features.filter(Boolean)
        : [],

    // =================================================
    // برچسب‌ها (تگ‌ها)
    // =================================================

    tags:
      Array.isArray(row.tags)
        ? row.tags.filter(Boolean)
        : [],

    // =================================================
    // اطلاعات برند
    // =================================================

    brandDescription:
      row.brand_description || "",

    brandImage:
      row.brand_image || "",

    // =================================================
    // پرسش و پاسخ
    // =================================================

    qa:
      Array.isArray(row.qa)
        ? row.qa
        : [],
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

    throw new Error(
      `Failed to load products: ${error.message}`
    );
  }

  return (data || []).map(mapRow);
}

// =====================================================
// دریافت یک محصول با slug
//
// اول slug بررسی می‌شود.
// اگر slug پیدا نشد، id بررسی می‌شود.
//
// این باعث می‌شود محصولاتی که هنوز slug ندارند
// فعلاً از کار نیفتند.
// =====================================================

export async function getProductBySlug(slug) {
  if (!slug) {
    return null;
  }

  const cleanSlug =
    String(slug).trim();

  if (!cleanSlug) {
    return null;
  }

  const supabase = getReadClient();

  // ---------------------------------------------------
  // مرحله اول: جستجو با slug
  // ---------------------------------------------------

  const {
    data: slugData,
    error: slugError,
  } = await supabase
    .from("products")
    .select("*")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (slugError) {
    console.error(
      "getProductBySlug slug error:",
      slugError
    );

    return null;
  }

  if (slugData) {
    return mapRow(slugData);
  }

  // ---------------------------------------------------
  // مرحله دوم:
  // اگر slug پیدا نشد، بررسی می‌کنیم آیا ورودی
  // در واقع id قدیمی محصول است یا نه.
  //
  // مثال:
  //
  // /product/p3
  //
  // ---------------------------------------------------

  const {
    data: idData,
    error: idError,
  } = await supabase
    .from("products")
    .select("*")
    .eq("id", cleanSlug)
    .maybeSingle();

  if (idError) {
    console.error(
      "getProductBySlug id fallback error:",
      idError
    );

    return null;
  }

  if (!idData) {
    return null;
  }

  return mapRow(idData);
}

// =====================================================
// دریافت یک محصول با ID
//
// برای سازگاری با کدهای قدیمی پروژه نگه داشته شده.
// =====================================================

export async function getProductById(id) {
  if (!id) {
    return null;
  }

  const supabase = getReadClient();

  const {
    data,
    error,
  } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(
      "getProductById error:",
      error
    );

    return null;
  }

  if (!data) {
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
  if (!product) {
    return [];
  }

  const all =
    await getProducts();

  return all
    .filter(
      (p) =>
        p.category === product.category &&
        p.id !== product.id &&
        p.available !== false
    )
    .slice(0, limit);
}
