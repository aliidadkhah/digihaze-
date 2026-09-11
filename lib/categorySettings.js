import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CATEGORIES, applySubcategoryOverrides } from "@/lib/data";

// نسخه‌ی سرور - زیردسته‌های ذخیره‌شده توی جدول settings رو می‌خونه
// و روی CATEGORIES پیش‌فرض اعمال می‌کنه. برای استفاده توی
// Server Component ها و Route Handler ها (نه توی کامپوننت‌های "use client").
export async function getCategoriesWithOverrides() {
  try {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("categories_subcategories")
      .eq("id", 1)
      .maybeSingle();

    if (error) return CATEGORIES;

    return applySubcategoryOverrides(data?.categories_subcategories);
  } catch {
    return CATEGORIES;
  }
}
