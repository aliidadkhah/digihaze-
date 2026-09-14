import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyNewOrder } from "@/lib/telegram";
import { zibalVerify } from "@/lib/zibal";

const SHIPPING_LABELS = {
  post: "پست",
  tipax: "تیپاکس (پس‌کرایه)",
  chapar: "چاپار (پس‌کرایه)",
  tabriz_city: "ارسال داخل شهر تبریز",
};

// کاربر بعد از پرداخت (موفق یا ناموفق) توسط خود زیبال با GET
// به این آدرس ریدایرکت می‌شه. اینجا هیچوقت نباید فقط به پارامترهای
// success/status مرورگر اعتماد کرد؛ همیشه باید سمت سرور verify زده بشه.
export async function GET(req) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://digihaze.ir";

  try {
    const { searchParams } = new URL(req.url);

    const trackId = searchParams.get("trackId");
    const success = searchParams.get("success");
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.redirect(
        `${siteUrl}/order-success?status=error`
      );
    }

    // کاربر از درگاه انصراف داده یا تراکنش ناموفق بوده
    if (success !== "1" || !trackId) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", orderId);

      return NextResponse.redirect(
        `${siteUrl}/order-success?order=${orderId}&status=failed`
      );
    }

    const verifyResult = await zibalVerify(trackId);

    // ۱۰۰ = تایید موفق تازه / ۲۰۱ = قبلاً تایید شده (تراکنش تکراری/رفرش کاربر)
    if (
      verifyResult?.result === 100 ||
      verifyResult?.result === 201
    ) {
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
          payment_ref_number: String(
            verifyResult.refNumber || ""
          ),
        })
        .eq("id", orderId)
        .select("*, order_items(*)")
        .single();

      if (!error && order) {
        try {
          await notifyNewOrder({
            ...order,
            phone: order.customer_phone,
            address: order.customer_address,
            shipping_label:
              SHIPPING_LABELS[order.shipping_method] ||
              order.shipping_method,
            payment_label: "درگاه شاپرک (زیبال)",
            items: order.order_items || [],
          });
        } catch (telegramError) {
          console.error(
            "Telegram error:",
            telegramError
          );
        }
      }

      return NextResponse.redirect(
        `${siteUrl}/order-success?order=${orderId}&status=success`
      );
    }

    // پرداخت ناموفق بوده
    console.error("ZIBAL VERIFY FAILED:", verifyResult);

    await supabaseAdmin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);

    return NextResponse.redirect(
      `${siteUrl}/order-success?order=${orderId}&status=failed`
    );
  } catch (error) {
    console.error("ZIBAL CALLBACK ERROR:", error);

    return NextResponse.redirect(
      `${siteUrl}/order-success?status=error`
    );
  }
}
