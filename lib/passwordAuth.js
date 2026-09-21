import crypto from "crypto";

// تعداد دور Hash برای سخت‌تر کردن Brute-force (مشابه bcrypt/PBKDF2 اما فقط با sha256،
// چون این پروژه روی Cloudflare Workers دیپلوی می‌شه و به createHash تکیه می‌کنیم
// که از قبل توی app/api/auth/send-otp اثبات شده کار می‌کنه)
const ITERATIONS = 12000;

export function generateSalt() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
}

export function hashPassword(password, salt) {
  let value = `${salt}:${password}`;
  for (let i = 0; i < ITERATIONS; i++) {
    value = crypto.createHash("sha256").update(value).digest("hex");
  }
  return value;
}

// مقایسه با زمان ثابت (جلوگیری از timing attack ساده)
function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function verifyPassword(password, salt, hash) {
  if (!salt || !hash) return false;
  const computed = hashPassword(password, salt);
  return safeCompare(computed, hash);
}

// توکن کوتاه‌مدت که بعد از تایید موفق OTP صادر می‌شه؛
// برای مجاز کردن ثبت/تغییر رمز عبور بدون این‌که هرکسی فقط با دونستن
// شماره موبایل بتونه رمز یه نفر دیگه رو ست کنه
export function generateVerifyToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}
