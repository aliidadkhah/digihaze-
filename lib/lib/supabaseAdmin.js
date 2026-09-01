import { createClient } from "@supabase/supabase-js";

// ⚠️ این فایل فقط باید در Route Handler ها (سمت سرور) ایمپورت بشه، هرگز در کامپوننت کلاینت.
// کلید service_role از RLS عبور می‌کنه و دسترسی کامل به دیتابیس داره.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
