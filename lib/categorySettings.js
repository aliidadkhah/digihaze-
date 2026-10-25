import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CATEGORIES, applySubcategoryOverrides } from "@/lib/data";
import { cached } from "@/lib/serverCache";

// مدت اعتبار کش؛ بعد از ذخیره‌ی تنظیمات از پنل ادمین کش خودکار پاک می‌شه.
const CATEGORIES_TTL_MS = 60_000;
const QUERY_TIMEOUT_MS = 16000;

async function loadOverrides() {
  const query = supabaseAdmin
    .from("settings")
    .select("categories_subcategories")
    .eq("id", 1)
    .maybeSingle();

  // اگه Supabase جواب نداد، بعد از ۴ ثانیه صبر نمی‌کنیم
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("settings query timed out")), QUERY_TIMEOUT_MS);
  });

  try {
    const { data, error } = await Promise.race([query, timeout]);
    if (error) throw error;
    return data?.categories_subcategories ?? null;
  } finally {
    clearTimeout(timer);
  }
}

// نسخه‌ی سرور - زیردسته‌های ذخیره‌شده توی جدول settings رو می‌خونه
// و روی CATEGORIES پیش‌فرض اعمال می‌کنه. برای استفاده توی
// Server Component ها و Route Handler ها (نه توی کامپوننت‌های "use client").
export async function getCategoriesWithOverrides() {
  try {
    const overrides = await cached("categories:overrides", CATEGORIES_TTL_MS, loadOverrides);
    return applySubcategoryOverrides(overrides);
  } catch {
    return CATEGORIES;
  }
}
