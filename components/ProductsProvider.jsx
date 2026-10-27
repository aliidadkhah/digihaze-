"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";



// =====================================================
// Context
// =====================================================

const ProductsContext = createContext({
  products: [],
  loading: true,
  error: null,
  refresh: () => {},
  getProductById: () => null,
});


// =====================================================
// Hook
// =====================================================

export function useProducts() {
  return useContext(ProductsContext);
}


// =====================================================
// تبدیل اطلاعات Supabase
// =====================================================

function mapProduct(row) {
  const reviews =
    Array.isArray(row.reviews)
      ? row.reviews.filter(Boolean)
      : [];

  const reviewsCount =
    Number(row.reviews_count) || reviews.length;

  const rating =
    Number(row.rating) || 0;

  return {
    // ================================
    // اصلی
    // ================================

    id: row.id,

    name: row.name || "",

    slug:
      typeof row.slug === "string" && row.slug.trim()
        ? row.slug.trim()
        : null,

    category: row.category || "",

    brand: row.brand || "",

    // ================================
    // تاریخ
    // ================================

    created_at:
      row.created_at || null,

    updated_at:
      row.updated_at || null,

    // ================================
    // قیمت
    // ================================

    price:
      Number(row.price) || 0,

    discount:
      Number(row.discount) || 0,

    // قیمت نهایی دقیقی که ادمین ثبت کرده (منبع اصلی قیمت با تخفیف)
    finalPrice:
      Number(row.final_price) || 0,

    // ================================
    // امتیاز
    // ================================

    rating,

    reviewsCount,

    reviews,

    // ================================
    // موجودی
    // ================================

    stock:
      Number(row.stock) || 0,

    available:
      row.available !== false,

    // ================================
    // ظاهر
    // ================================

    color:
      row.color || "",

    badge:
      row.badge || "",

    // ================================
    // تصاویر
    // ================================

    images:
      Array.isArray(row.images)
        ? row.images.filter(Boolean)
        : [],

    // ================================
    // رنگ‌ها
    // ================================

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

            // موجودی این رنگ؛ null یعنی نامحدود
            stock:
              c?.stock === null ||
              c?.stock === undefined
                ? null
                : Number(c.stock),
          }))
        : [],

    // ================================
    // توضیحات
    // ================================

    description:
      row.description || "",

    // ================================
    // مشخصات
    // ================================

    specs:
      Array.isArray(row.specs)
        ? row.specs
        : [],

    // ================================
    // برند
    // ================================

    brandDescription:
      row.brand_description || "",

    brandImage:
      row.brand_image || "",

    // ================================
    // پرسش و پاسخ
    // ================================

    qa:
      Array.isArray(row.qa)
        ? row.qa
        : [],
  };
}


// =====================================================
// Provider
// =====================================================

export default function ProductsProvider({
  children,
}) {
  const [products, setProducts] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);


  // ===================================================
  // دریافت محصولات
  // ===================================================

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // -----------------------------------------------
      // دریافت محصولات از «سرور خود سایت»
      //
      // قبلاً مرورگر هر بازدیدکننده مستقیم به Supabase وصل می‌شد؛ با اینترنت
      // بین‌المللی ناپایدار ایران این باعث می‌شد محصولات لود نشن. حالا مرورگر
      // فقط با سرور خود سایت حرف می‌زنه و سرور (با کش) از دیتابیس می‌خونه.
      // -----------------------------------------------

      const res = await fetch("/api/products-raw", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("خطا در دریافت محصولات");
      }

      const data = await res.json();

      // -----------------------------------------------
      // تبدیل داده‌ها
      // -----------------------------------------------

      const mapped =
        Array.isArray(data)
          ? data.map(mapProduct)
          : [];

      setProducts(mapped);

    } catch (err) {

      console.error(
        "ProductsProvider error:",
        err
      );

      setError(
        err?.message ||
        "خطا در دریافت محصولات"
      );

      // ---------------------------------------------
      // مهم:
      // در صورت خطا محصولات قبلی را پاک نکن
      // ---------------------------------------------

    } finally {

      setLoading(false);

    }
  }, []);


  // ===================================================
  // بارگذاری اولیه
  // ===================================================

  useEffect(() => {
    load();
  }, [load]);


  // ===================================================
  // دریافت محصول با ID
  // ===================================================

  const getProductById =
    useCallback(
      (id) => {
        if (!id) return null;

        return (
          products.find(
            (product) =>
              String(product.id) ===
              String(id)
          ) || null
        );
      },
      [products]
    );


  // ===================================================
  // Context Value
  // ===================================================

  const value = {
    products,

    loading,

    error,

    refresh: load,

    getProductById,
  };


  // ===================================================
  // خروجی
  // ===================================================

  return (
    <ProductsContext.Provider
      value={value}
    >
      {children}
    </ProductsContext.Provider>
  );
}
