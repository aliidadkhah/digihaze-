"use client";
import { createClient } from "@supabase/supabase-js";

// این کلاینت سمت مرورگر اجرا می‌شه، فقط با کلید anon (عمومی و امن برای فرانت‌اند)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
