import { createClient } from "@supabase/supabase-js";
import { createFetchWithTimeout } from "./fetchWithTimeout";
import { USE_LOCAL_DB, dbUrl, dbServiceKey, makeDbFetch } from "./dbConfig";

// ⚠️ این فایل فقط باید در Route Handler ها (سمت سرور) ایمپورت بشه، هرگز در کامپوننت کلاینت.
// کلید service_role از RLS عبور می‌کنه و دسترسی کامل به دیتابیس داره.
//
// - خواندن (GET): بعد از ۸ ثانیه قطع و حداکثر ۲ بار دوباره امتحان می‌شه.
// - نوشتن (ثبت سفارش، پرداخت، گزارش آمار و ...): تکرار نمی‌شه و تایم‌اوتش
//   بلند (۲۵ ثانیه) هست تا نوشتنِ نیمه‌کاره باعث خطای الکی نشه.
// - cache: "no-store" تا داده‌ها بعد از ثبت/حذف بلافاصله تازه دیده بشن.
const timeoutFetch = createFetchWithTimeout(6000, { writeTimeoutMs: 25000, readRetries: 3 });

// Supabase راه دور (فعلاً هنوز برای ورود ادمین / احراز هویت لازمه)
const remoteAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    global: {
      fetch: (input, init) => timeoutFetch(input, { ...init, cache: "no-store" }),
    },
  }
);

// دیتابیس: اگه DB_URL تنظیم باشه محلیه، وگرنه همون Supabase
export const supabaseAdmin = USE_LOCAL_DB
  ? createClient(dbUrl(), dbServiceKey(), {
      global: { fetch: makeDbFetch(timeoutFetch) },
    })
  : remoteAdmin;

// وقتی دیتابیس محلیه، بررسی توکن ادمین (supabaseAdmin.auth.getUser) هنوز باید
// از Supabase اصلی انجام بشه، چون حساب‌های ادمین اونجاست. (بعداً با ورود
// خودمون جایگزین می‌شه.)
if (USE_LOCAL_DB) {
  supabaseAdmin.auth.getUser = (...args) => remoteAdmin.auth.getUser(...args);
}
