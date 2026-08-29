import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyNewOrder } from "@/lib/telegram";
import { discountedPrice } from "@/lib/data";
import { getProductById } from "@/lib/products";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const phone = searchParams
      .get("phone")
      ?.trim();

    if (!phone) {
      return NextResponse.json(
        { error: "شماره موبایل ارسال نشده است" },
        { status: 400 }
      );
    }

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("ORDERS FETCH ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

const SHIPPING_LABELS = {
  post: "پست",
  tipax: "تیپاکس (پس‌کرایه)",
  chapar: "چاپار (پس‌کرایه)",
};

const PAYMENT_LABELS = {
  card_to_card: "کارت به کارت",
  gateway: "درگاه شاپرک",
};

export async function POST(req) {
  try {
    const body = await req.json();

    const { customer, shipping, payment, items } = body;

    // =========================
    // بررسی مشتری
    // =========================
    if (
      !customer?.name ||
      !customer?.phone ||
      !customer?.address ||
      !customer?.province ||
      !customer?.city ||
      !customer?.postalCode
    ) {
      return NextResponse.json(
        { error: "اطلاعات مشتری کامل نیست" },
        { status: 400 }
      );
    }

    // =========================
    // بررسی سبد
    // =========================
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "سبد خرید خالی است" },
        { status: 400 }
      );
    }

    // =========================
    // بررسی روش ارسال
    // =========================
    const shippingMethod = shipping?.method;
    if (!SHIPPING_LABELS[shippingMethod]) {
      return NextResponse.json(
        { error: "روش ارسال نامعتبر است" },
        { status: 400 }
      );
    }
    const shippingCost = Number(shipping?.cost) || 0;

    // =========================
    // بررسی روش پرداخت
    // =========================
    const paymentMethod = payment?.method;
    if (!PAYMENT_LABELS[paymentMethod]) {
      return NextResponse.json(
        { error: "روش پرداخت نامعتبر است" },
        { status: 400 }
      );
    }

    if (paymentMethod === "card_to_card" && !payment?.trackingCode?.trim()) {
      return NextResponse.json(
        { error: "کد پیگیری تراکنش وارد نشده است" },
        { status: 400 }
      );
    }

    // وضعیت اولیه سفارش:
    // کارت‌به‌کارت -> در انتظار تایید ادمین
    // درگاه       -> پرداخت‌شده (چون فعلاً شبیه‌سازی‌شده؛ در نسخه واقعی این وضعیت باید از callback درگاه بیاد)
    const initialStatus = paymentMethod === "gateway" ? "paid" : "pending";

    // =========================
    // محاسبه مبلغ
    // =========================
    let itemsTotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await getProductById(item.productId);

      if (!product) {
        return NextResponse.json({ error: "محصول پیدا نشد" }, { status: 400 });
      }

      const qty = Number(item.qty);

      if (!Number.isInteger(qty) || qty <= 0) {
        return NextResponse.json(
          { error: "تعداد محصول نامعتبر است" },
          { status: 400 }
        );
      }

      const price = discountedPrice(product);
      itemsTotal += price * qty;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        qty,
        price,
      });
    }

    const total = itemsTotal + shippingCost;

    // =========================
    // ثبت سفارش
    // =========================
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: customer.name.trim(),
        customer_phone: customer.phone.trim(),
        customer_address: customer.address.trim(),
        address: customer.address.trim(),
        customer_province: customer.province,
        customer_city: customer.city,
        customer_postal_code: customer.postalCode,

        shipping_method: shippingMethod,
        shipping_cost: shippingCost,

        total,
        status: initialStatus,

        payment_method: paymentMethod,
        payment_tracking_code: payment?.trackingCode?.trim() || "",
        payment_transaction_time: payment?.transactionTime?.trim() || "",
      })
      .select()
      .single();

    if (orderError) {
      console.error("ORDER ERROR:", orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // =========================
    // ثبت محصولات سفارش
    // =========================
    const rows = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      qty: item.qty,
      price: item.price,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(rows);

    if (itemsError) {
      console.error("ITEM ERROR:", itemsError);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // =========================
    // ارسال تلگرام
    // =========================
    try {
      await notifyNewOrder({
        ...order,
        phone: order.customer_phone,
        address: order.customer_address,
        tracking_code: order.payment_tracking_code,
        transaction_time: order.payment_transaction_time,
        shipping_label: SHIPPING_LABELS[shippingMethod],
        payment_label: PAYMENT_LABELS[paymentMethod],
        items: orderItems,
      });
    } catch (telegramError) {
      console.error("Telegram error:", telegramError);
    }

    // =========================
    // پاسخ
    // =========================
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
