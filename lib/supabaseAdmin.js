import { createClient } from "@supabase/supabase-js";

// ⚠️ این فایل فقط باید در Route Handler ها (سمت سرور) ایمپورت بشه، هرگز در کامپوننت کلاینت.
// کلید service_role از RLS عبور می‌کنه و دسترسی کامل به دیتابیس داره.
//
// روی هاست ما (vinext روی Cloudflare Workers)، fetch به‌صورت پیش‌فرض کش می‌شه؛
// برای این‌که نظرات، سوالات و بقیه‌ی داده‌ها بعد از ثبت/حذف بلافاصله تازه دیده بشن،
// کش رو برای درخواست‌های Supabase خاموش می‌کنیم.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  }
);
