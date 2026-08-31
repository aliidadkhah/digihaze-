import { createClient } from "@supabase/supabase-js";

// =====================================================
// Supabase Read Client
// =====================================================

function getReadClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// =====================================================
// ساخت slug
// =====================================================

function createSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/ي/g, "ی")
    .replace(/ى/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// =====================================================
// تبدیل ردیف Supabase به ساختار سایت
// =====================================================

function mapRow(row) {
  // -----------------------------------------------
  // نظرات
  // -----------------------------------------------

  const reviews =
    Array.isArray(row.reviews)
      ? row.reviews.filter(Boolean)
      : [];

  // -----------------------------------------------
  // تعداد نظرات
  // -----------------------------------------------

  const reviewsCount =
    Number(row.reviews_count) || reviews.length;

  // -----------------------------------------------
  // امتیاز
  // -----------------------------------------------

  const rating =
    Number(row.rating) || 0;

  // -----------------------------------------------
  // Slug
  // -----------------------------------------------

  const slug =
    row.slug ||
    createSlug(row.name) ||
    String(row.id);

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
// دریافت یک محصول با ID
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
// دریافت یک محصول با Slug
// =====================================================

export async function getProductBySlug(slug) {
  if (!slug) {
    return null;
  }

  const supabase = getReadClient();

  const {
    data,
    error,
  } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error(
      "getProductBySlug error:",
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
