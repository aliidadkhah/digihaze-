// =====================================================
// تنظیمات اتصال سمت سرور به دیتابیس
//
// اگه DB_URL توی .env.local تنظیم شده باشه، همه‌ی خوندن و نوشتن‌های سمت
// سرور از «دیتابیس محلی» (PostgREST روی خود سرور) انجام می‌شه. اگه تنظیم
// نباشه، همه‌چیز مثل قبل با Supabase کار می‌کنه؛ پس برگشتن به حالت قبل فقط
// حذف سه خط DB_* و ری‌استارت برنامه‌ست.
//
//   DB_URL               مثلاً http://127.0.0.1:54321
//   DB_ANON_KEY          کلید نقش anon (خوندن عمومی محصولات و پست‌ها)
//   DB_SERVICE_ROLE_KEY  کلید نقش service_role (فقط سمت سرور)
// =====================================================

export const USE_LOCAL_DB = Boolean(process.env.DB_URL);

export function dbUrl() {
  return process.env.DB_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function dbAnonKey() {
  return process.env.DB_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function dbServiceKey() {
  return process.env.DB_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

// دیتابیس محلی نیازی به تایم‌اوت و تلاش مجدد نداره؛ فقط Supabase راه دور داره.
// cache:"no-store" برای اینه که fetch ی Next داده‌ی قدیمی برنگردونه.
export function makeDbFetch(timeoutFetch) {
  if (USE_LOCAL_DB) {
    return (input, init) => fetch(input, { ...init, cache: "no-store" });
  }
  return (input, init) => timeoutFetch(input, { ...init, cache: "no-store" });
}
