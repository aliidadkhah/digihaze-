import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ⚠️ این فایل فقط باید در Route Handler ها (سمت سرور) ایمپورت بشه.

// مبلغ تخفیف رو از روی نوع کد (درصدی/مبلغ ثابت) روی جمع سبد (قبل از هزینه ارسال) حساب می‌کنه.
// هیچوقت بیشتر از جمع سبد نمی‌شه (رفتن به منفی نداریم).
export function calcDiscountAmount(discount, subtotal) {
  if (!discount || subtotal <= 0) return 0;

  let amount = 0;

  if (discount.type === "fixed") {
    amount = Math.round(Number(discount.value) || 0);
  } else {
    // percent
    amount = Math.round(
      (subtotal * (Number(discount.value) || 0)) / 100
    );
  }

  if (!Number.isFinite(amount) || amount < 0) amount = 0;
  if (amount > subtotal) amount = subtotal;

  return amount;
}

// کد تخفیف رو پیدا و اعتبارسنجی می‌کنه (فعال بودن، انقضا، سقف استفاده، حداقل مبلغ سفارش)
// subtotal = جمع کالاها قبل از هزینه ارسال (تخفیف روی این مبلغ اعمال می‌شه، نه هزینه ارسال)
export async function findValidDiscountCode(rawCode, subtotal) {
  const code = String(rawCode || "").trim();

  if (!code) {
    return { ok: false, error: "کد تخفیف وارد نشده است" };
  }

  const { data: discount, error } = await supabaseAdmin
    .from("discount_codes")
    .select("*")
    .ilike("code", code)
    .maybeSingle();

  if (error) {
    console.error("DISCOUNT FETCH ERROR:", error);
    return { ok: false, error: "خطا در بررسی کد تخفیف" };
  }

  if (!discount) {
    return { ok: false, error: "کد تخفیف وارد شده معتبر نیست" };
  }

  if (!discount.active) {
    return { ok: false, error: "این کد تخفیف غیرفعال شده است" };
  }

  if (discount.expires_at && new Date(discount.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "تاریخ استفاده از این کد تخفیف گذشته است" };
  }

  if (
    discount.max_uses !== null &&
    discount.max_uses !== undefined &&
    Number(discount.used_count) >= Number(discount.max_uses)
  ) {
    return { ok: false, error: "این کد تخفیف به سقف تعداد استفاده رسیده است" };
  }

  if (discount.min_order_total && subtotal < Number(discount.min_order_total)) {
    return {
      ok: false,
      error: `این کد تخفیف فقط برای خریدهای بالای ${Number(
        discount.min_order_total
      ).toLocaleString("fa-IR")} تومان قابل استفاده است`,
    };
  }

  const amount = calcDiscountAmount(discount, subtotal);

  if (amount <= 0) {
    return { ok: false, error: "این کد تخفیف روی این سبد خرید تاثیری ندارد" };
  }

  return { ok: true, discount, amount };
}

// وقتی سفارش با موفقیت ثبت می‌شه، یک واحد به شمارنده‌ی استفاده اضافه می‌شه
export async function redeemDiscountCode(code) {
  if (!code) return { ok: true };

  try {
    const { data, error } = await supabaseAdmin.rpc(
      "adjust_discount_usage",
      { p_code: code, p_delta: 1 }
    );

    if (error) {
      console.error("DISCOUNT REDEEM ERROR:", error);
      return { ok: false };
    }

    return data || { ok: false };
  } catch (e) {
    console.error("DISCOUNT REDEEM ERROR:", e);
    return { ok: false };
  }
}

// وقتی سفارشی که کد تخفیف داشته لغو/ناموفق می‌شه، شمارنده برمی‌گرده عقب
export async function releaseDiscountCode(code) {
  if (!code) return;

  try {
    const { error } = await supabaseAdmin.rpc("adjust_discount_usage", {
      p_code: code,
      p_delta: -1,
    });

    if (error) {
      console.error("DISCOUNT RELEASE ERROR:", error);
    }
  } catch (e) {
    console.error("DISCOUNT RELEASE ERROR:", e);
  }
}
