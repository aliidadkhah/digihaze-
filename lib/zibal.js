// =====================================================
// درگاه پرداخت زیبال (Zibal)
// مستندات: https://help.zibal.ir/IPG/API/
// نکته مهم: مبلغ در API زیبال باید به «ریال» ارسال بشه،
// در حالی که همه‌ی قیمت‌های سایت به «تومان» هست. به همین
// خاطر همیشه قبل از ارسال به زیبال مبلغ ضربدر ۱۰ می‌شه.
// =====================================================

const ZIBAL_BASE_URL = "https://gateway.zibal.ir";

function getMerchant() {
  // در محیط تست می‌تونی موقتاً مقدار "zibal" رو به عنوان
  // مرچنت کد تستی زیبال ست کنی تا بدون مرچنت واقعی تست بگیری.
  return process.env.ZIBAL_MERCHANT;
}

// تبدیل تومان به ریال برای ارسال به زیبال
export function tomanToRial(tomanAmount) {
  return Math.round(Number(tomanAmount) * 10);
}

// =========================
// مرحله ۱: درخواست پرداخت
// =========================
// amountToman: مبلغ به تومان
// orderId: شناسه‌ی سفارش داخلی سایت (برای اتصال بعدی تراکنش به سفارش)
// mobile: موبایل خریدار (اختیاری، برای پیش‌پرداخت اطلاعات کارت)
// description: توضیح تراکنش (اختیاری)
export async function zibalRequest({
  amountToman,
  orderId,
  mobile,
  description,
}) {
  const merchant = getMerchant();

  if (!merchant) {
    throw new Error(
      "متغیر محیطی ZIBAL_MERCHANT تنظیم نشده است."
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://digihaze.ir";

  const res = await fetch(`${ZIBAL_BASE_URL}/v1/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant,
      amount: tomanToRial(amountToman),
      callbackUrl: `${siteUrl}/api/payment/zibal/callback`,
      orderId: String(orderId),
      mobile: mobile || undefined,
      description:
        description || "پرداخت سفارش دیجی هیز",
    }),
  });

  const data = await res.json();

  // result === 100 یعنی درخواست با موفقیت ایجاد شد
  return data;
}

// آدرس صفحه‌ی پرداخت زیبال برای ریدایرکت کاربر
export function zibalPaymentUrl(trackId) {
  return `${ZIBAL_BASE_URL}/start/${trackId}`;
}

// =========================
// مرحله ۲: تایید پرداخت (Verify)
// =========================
// همیشه بعد از بازگشت کاربر از درگاه، سمت سرور باید verify زده بشه
// و هرگز به پارامترهای ارسالی از مرورگر (success, status و ...) به تنهایی اعتماد نشه.
export async function zibalVerify(trackId) {
  const merchant = getMerchant();

  if (!merchant) {
    throw new Error(
      "متغیر محیطی ZIBAL_MERCHANT تنظیم نشده است."
    );
  }

  const res = await fetch(`${ZIBAL_BASE_URL}/v1/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant,
      trackId,
    }),
  });

  const data = await res.json();

  // result === 100 => تایید موفق (تازه)
  // result === 201 => قبلاً تایید شده (idempotent - دوباره verify نزن)
  return data;
}
