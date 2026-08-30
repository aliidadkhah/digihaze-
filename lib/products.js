import { createClient } from "@supabase/supabase-js";

// این کلاینت هم توی کامپوننت‌های سرور (SSR) و هم توی مرورگر کار می‌کنه،
// چون فقط از کلید anon استفاده می‌کنه و جدول products با پالیسی "public read" باز خونده می‌شه.
function getReadClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// ردیف خام دیتابیس رو به همون شکلی که کامپوننت‌های سایت قبلا از lib/data.js
// (PRODUCTS آرایه‌ی هاردکد) انتظار داشتن، تبدیل می‌کنه
function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    brand: row.brand,
    price: row.price,
    discount: row.discount,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    color: row.color,
    badge: row.badge,
    available: row.available,
    images: row.images || [],
    colors: (row.colors || []).map((c, i) => ({
      id: c.id || `${row.id}-color-${i}`,
      name: c.name || "",
      hex: c.hex || "#000000",
    })),
    description: row.description,
    specs: row.specs || [],
    reviews: row.reviews || [],
    brandDescription: row.brand_description || "",
    brandImage: row.brand_image || "",
    qa: row.qa || [],
  };
}

export async function getProducts() {
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getProducts error:", error);
    return [];
  }

  return (data || []).map(mapRow);
}

export async function getProductById(id) {
  if (!id) return null;

  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data);
}

export async function getRelated(product, limit = 4) {
  const all = await getProducts();
  return all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}
