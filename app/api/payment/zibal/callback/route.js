import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyNewOrder, notifyPaymentVerifyFailed } from "@/lib/telegram";
import { zibalVerify } from "@/lib/zibal";
import { changeOrderStatus } from "@/lib/stock";

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

  let trackId = null;
  let orderId = null;

  try {
    const { searchParams } = new URL(req.url);

    trackId = searchParams.get("trackId");
    const success = searchParams.get("success");
    orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.redirect(
        `${siteUrl}/order-success?status=error`
      );
    }

    // کاربر از درگاه انصراف داده یا تراکنش ناموفق بوده
    if (success !== "1" || !trackId) {
      // وضعیت → failed و موجودی رزروشده برمی‌گرده
      await changeOrderStatus(orderId, "failed");

      try {
        await notifyPaymentVerifyFailed({
          orderId,
          trackId,
          reason: `زیبال success=${success} برگردوند (یعنی خود درگاه گزارش داده که پرداخت موفق نبوده یا کاربر انصراف داده)`,
          verifyResult: null,
        });
      } catch (e) {
        console.error("Telegram error:", e);
      }

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
      // force: پول دریافت شده، پس حتی اگه (در حالت نادر) سفارش قبلاً
      // failed شده بود و موجودی دوباره کافی نبود، وضعیت باید paid بشه
      const result = await changeOrderStatus(
        orderId,
        "paid",
        {
          payment_ref_number: String(
            verifyResult.refNumber || ""
          ),
        },
        { force: true }
      );

      const order = result.order;

      if (result.ok && order) {
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

    try {
      await notifyPaymentVerifyFailed({
        orderId,
        trackId,
        reason: `verify با result=${verifyResult?.result} رد شد`,
        verifyResult,
      });
    } catch (e) {
      console.error("Telegram error:", e);
    }

    await changeOrderStatus(orderId, "failed");

    return NextResponse.redirect(
      `${siteUrl}/order-success?order=${orderId}&status=failed`
    );
  } catch (error) {
    console.error("ZIBAL CALLBACK ERROR:", error);

    try {
      await notifyPaymentVerifyFailed({
        orderId: orderId || "نامشخص",
        trackId,
        reason: `خطای غیرمنتظره توی callback: ${error?.message || error}`,
        verifyResult: null,
      });
    } catch (e) {
      console.error("Telegram error:", e);
    }

    return NextResponse.redirect(
      `${siteUrl}/order-success?status=error`
    );
  }
}
