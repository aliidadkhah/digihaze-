import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyNewOrder } from "@/lib/telegram";
import { discountedPrice } from "@/lib/data";
import { getProductById } from "@/lib/products";
import { getShippingCost } from "@/lib/shipping";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const phone = searchParams
      .get("phone")
      ?.trim();

    const id = searchParams
      .get("id")
      ?.trim();

    if (!phone && !id) {
      return NextResponse.json(
        { error: "شماره موبایل یا شناسه سفارش ارسال نشده است" },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    // برای صفحه‌ی بازگشت از درگاه پرداخت، سفارش با شناسه (id) پیدا می‌شود
    // چون در آن لحظه شماره موبایل در حافظه‌ی مرورگر موجود نیست.
    query = id ? query.eq("id", id) : query.eq("customer_phone", phone);

    const { data: orders, error } = await query;

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
  tabriz_city: "ارسال داخل شهر تبریز",
};

const PAYMENT_LABELS = {
  card_to_card: "کارت به کارت",
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
    // نکته امنیتی: هزینه‌ی ارسال هرگز از روی مقداری که کلاینت
    // توی درخواست فرستاده محاسبه نمی‌شه (چون قابل دستکاری در مرورگره).
    // همیشه از روی لیست ثابت سمت سرور (lib/shipping.js) خونده می‌شه.
    const shippingMethod = shipping?.method;
    if (!SHIPPING_LABELS[shippingMethod]) {
      return NextResponse.json(
        { error: "روش ارسال نامعتبر است" },
        { status: 400 }
      );
    }
    const shippingCost = getShippingCost(shippingMethod) ?? 0;

    // =========================
    // بررسی روش پرداخت
    // =========================
    // نکته امنیتی: پرداخت با درگاه (زیبال) دیگر از این مسیر ثبت نمی‌شود،
    // چون این‌جا کلاینت می‌تونه مستقیماً status=paid بفرسته بدون این‌که
    // واقعاً پولی رد و بدل شده باشه. سفارش‌های درگاهی همیشه باید از
    // app/api/payment/zibal/request ساخته بشن و وضعیتشون فقط بعد از
    // verify واقعی توی app/api/payment/zibal/callback به "paid" تغییر کنه.
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

    // کارت‌به‌کارت -> در انتظار تایید دستی ادمین
    const initialStatus = "pending";

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
