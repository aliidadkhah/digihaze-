import { createClient } from "@supabase/supabase-js";

// =====================================================
// Supabase Read Client
// =====================================================

function getReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(url, key);
}

// =====================================================
// تبدیل ردیف Supabase به ساختار سایت
// =====================================================

function mapRow(row) {
  return {
    id: row.id,
    type: row.type === "guide" ? "guide" : "blog",
    title: row.title || "",
    slug: row.slug || "",
    excerpt: row.excerpt || "",
    content: row.content || "",
    coverImage: row.cover_image || "",
    category: row.category || "",
    tags: Array.isArray(row.tags) ? row.tags.filter(Boolean) : [],
    author: row.author || "دیجی هیز",
    published: row.published !== false,
    seoTitle: row.seo_title || "",
    seoDescription: row.seo_description || "",
    views: Number(row.views) || 0,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

// =====================================================
// دریافت لیست پست‌ها (فقط منتشرشده‌ها)
// type: "blog" | "guide" | undefined (همه)
// =====================================================

export async function getPosts({ type, limit } = {}) {
  const supabase = getReadClient();

  let query = supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getPosts error:", error);
    return [];
  }

  return (data || []).map(mapRow);
}

// =====================================================
// دریافت یک پست با slug (فقط منتشرشده)
// =====================================================

export async function getPostBySlug(slug, type) {
  if (!slug) return null;

  const supabase = getReadClient();

  let query = supabase
    .from("posts")
    .select("*")
    .eq("slug", String(slug).trim())
    .eq("published", true);

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("getPostBySlug error:", error);
    return null;
  }

  if (!data) return null;

  return mapRow(data);
}

// =====================================================
// دریافت پست‌های مرتبط (بر اساس دسته‌بندی، از همون نوع)
// =====================================================

export async function getRelatedPosts(post, limit = 3) {
  if (!post) return [];

  const all = await getPosts({ type: post.type });

  const sameCategory = all.filter(
    (p) => p.id !== post.id && p.category && p.category === post.category
  );

  const rest = all.filter(
    (p) => p.id !== post.id && !sameCategory.includes(p)
  );

  return [...sameCategory, ...rest].slice(0, limit);
}
