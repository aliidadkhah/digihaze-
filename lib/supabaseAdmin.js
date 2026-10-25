import { createClient } from "@supabase/supabase-js";
import { createFetchWithTimeout } from "./fetchWithTimeout";

// ⚠️ این فایل فقط باید در Route Handler ها (سمت سرور) ایمپورت بشه، هرگز در کامپوننت کلاینت.
// کلید service_role از RLS عبور می‌کنه و دسترسی کامل به دیتابیس داره.
//
// - خواندن (GET): بعد از ۸ ثانیه قطع و حداکثر ۲ بار دوباره امتحان می‌شه.
// - نوشتن (ثبت سفارش، پرداخت، گزارش آمار و ...): تکرار نمی‌شه و تایم‌اوتش
//   بلند (۲۵ ثانیه) هست تا نوشتنِ نیمه‌کاره باعث خطای الکی نشه.
// - cache: "no-store" تا داده‌ها بعد از ثبت/حذف بلافاصله تازه دیده بشن.
const timeoutFetch = createFetchWithTimeout(6000, { writeTimeoutMs: 25000, readRetries: 3 });

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    global: {
      fetch: (input, init) => timeoutFetch(input, { ...init, cache: "no-store" }),
    },
  }
);
