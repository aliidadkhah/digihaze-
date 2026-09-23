import { NextResponse } from "next/server";
import { findValidDiscountCode } from "@/lib/discount";

// نکته امنیتی: این روت فقط برای پیش‌نمایش سریع به مشتری توی صفحه‌ی
// تسویه‌حسابه. مبلغ نهایی و اعتبار کد همیشه دوباره و مستقل سمت سرور
// توی app/api/orders و app/api/payment/zibal/request چک و محاسبه می‌شه؛
// اینجا هیچ سفارشی ساخته نمی‌شه و شمارنده‌ی استفاده دست نمی‌خوره.
export async function POST(req) {
  try {
    const body = await req.json();
    const { code, subtotal } = body;

    const parsedSubtotal = Number(subtotal);

    if (!Number.isFinite(parsedSubtotal) || parsedSubtotal <= 0) {
      return NextResponse.json(
        { valid: false, error: "سبد خرید خالی است" },
        { status: 400 }
      );
    }

    const result = await findValidDiscountCode(code, parsedSubtotal);

    if (!result.ok) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: result.discount.code,
      type: result.discount.type,
      value: result.discount.value,
      amount: result.amount,
    });
  } catch (error) {
    console.error("DISCOUNT VALIDATE API ERROR:", error);
    return NextResponse.json(
      { valid: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}
