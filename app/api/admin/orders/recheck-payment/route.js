import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyNewOrder } from "@/lib/telegram";
import { zibalVerify } from "@/lib/zibal";

// بررسی توکن ادمین (Bearer token که از Supabase Auth میاد)
async function verifyAdmin(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) return null;

  return data.user;
}

const SHIPPING_LABELS = {
  post: "پست",
  tipax: "تیپاکس (پس‌کرایه)",
  chapar: "چاپار (پس‌کرایه)",
  tabriz_city: "ارسال داخل شهر تبریز",
};

// =====================================================
// برای وقتی که سفارش از درگاه (زیبال) پرداخت شده ولی مرورگر
// مشتری هیچوقت به callback ما برنگشته (مثلاً تب رو بسته یا
// اینترنتش قطع شده) - در نتیجه سفارش رو با وضعیت pending جا
// گذاشته و پیام تلگرام هم فرستاده نشده.
// این روت با trackId ذخیره‌شده روی همون سفارش، دوباره از زیبال
// می‌پرسه که آیا واقعاً پرداخت انجام شده یا نه، و اگه بله،
// دقیقاً همون کاری که callback باید می‌کرد رو انجام می‌ده:
// وضعیت رو paid می‌کنه و پیام تلگرام رو می‌فرسته.
// =====================================================
export async function POST(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "شناسه سفارش ارسال نشده است" },
        { status: 400 }
      );
    }

    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError || !order) {
      return NextResponse.json(
        { error: "سفارش پیدا نشد" },
        { status: 404 }
      );
    }

    if (order.payment_method !== "gateway" || !order.payment_track_id) {
      return NextResponse.json(
        { error: "این سفارش از درگاه پرداخت ثبت نشده یا trackId ندارد" },
        { status: 400 }
      );
    }

    if (order.status === "paid") {
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        order,
      });
    }

    const verifyResult = await zibalVerify(order.payment_track_id);

    if (verifyResult?.result !== 100 && verifyResult?.result !== 201) {
      return NextResponse.json({
        success: false,
        paid: false,
        zibalResult: verifyResult,
        message:
          verifyResult?.message ||
          "زیبال این تراکنش را موفق تایید نکرد (احتمالاً واقعاً پرداخت نشده)",
      });
    }

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        payment_ref_number: String(verifyResult.refNumber || ""),
      })
      .eq("id", orderId)
      .select("*, order_items(*)")
      .single();

    if (updateError) {
      console.error("RECHECK PAYMENT UPDATE ERROR:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    try {
      await notifyNewOrder({
        ...updatedOrder,
        phone: updatedOrder.customer_phone,
        address: updatedOrder.customer_address,
        shipping_label:
          SHIPPING_LABELS[updatedOrder.shipping_method] ||
          updatedOrder.shipping_method,
        payment_label: "درگاه شاپرک (زیبال) — تایید دستی",
        items: updatedOrder.order_items || [],
      });
    } catch (telegramError) {
      console.error("Telegram error:", telegramError);
    }

    return NextResponse.json({
      success: true,
      paid: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("RECHECK PAYMENT ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
