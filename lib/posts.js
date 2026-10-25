import { createClient } from "@supabase/supabase-js";
import { createFetchWithTimeout } from "./fetchWithTimeout";
import { cached } from "./serverCache";

const timeoutFetch = createFetchWithTimeout(4000);

// مدت اعتبار کش پست‌ها؛ بعد از هر تغییر از پنل ادمین کش خودکار پاک می‌شه.
const POSTS_TTL_MS = 30_000;

// =====================================================
// Supabase Read Client
// =====================================================

function getReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing.");
  }

  // همون دلیل lib/products.js: کش fetch رو خاموش می‌کنیم تا تغییرات
  // پست/اسلاگ توی Supabase بلافاصله روی سایت دیده بشه.
  return createClient(url, key, {
    global: {
      fetch: (input, init) =>
        timeoutFetch(input, { ...init, cache: "no-store" }),
    },
  });
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

async function fetchPosts({ type, limit } = {}) {
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
    // خطا پرتاب می‌شه تا نتیجه‌ی خراب کش نشه (برای صفحه‌ها در getPosts به [] تبدیل می‌شه)
    throw error;
  }

  return (data || []).map(mapRow);
}

export async function getPosts({ type, limit } = {}) {
  try {
    const list = await cached(
      `posts:list:${type || "all"}:${limit || 0}`,
      POSTS_TTL_MS,
      () => fetchPosts({ type, limit })
    );
    return list.slice();
  } catch (error) {
    console.error("getPosts error:", error);
    return [];
  }
}

// =====================================================
// دریافت یک پست با slug (فقط منتشرشده)
// =====================================================

async function fetchPostBySlug(slug, type) {
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

  if (error) throw error;

  if (!data) return null;

  return mapRow(data);
}

export async function getPostBySlug(slug, type) {
  if (!slug) return null;

  try {
    return await cached(
      `posts:slug:${type || "any"}:${String(slug).trim()}`,
      POSTS_TTL_MS,
      () => fetchPostBySlug(slug, type)
    );
  } catch (error) {
    console.error("getPostBySlug error:", error);
    return null;
  }
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
