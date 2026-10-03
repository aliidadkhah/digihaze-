import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyNewOrder } from "@/lib/telegram";
import { notifyAdminSms } from "@/lib/sms-notify";
import { discountedPrice } from "@/lib/data";
import { getProductById } from "@/lib/products";
import { getShippingCost } from "@/lib/shipping";
import { reserveStock, restoreStock } from "@/lib/stock";
import { findValidDiscountCode, redeemDiscountCode } from "@/lib/discount";

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

    const { customer, shipping, payment, items, discountCode } = body;

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

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "سبد خرید خالی است" },
        { status: 400 }
      );
    }

    const shippingMethod = shipping?.method;
    if (!SHIPPING_LABELS[shippingMethod]) {
      return NextResponse.json(
        { error: "روش ارسال نامعتبر است" },
        { status: 400 }
      );
    }
    const shippingCost = getShippingCost(shippingMethod) ?? 0;

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

    const initialStatus = "pending";

    let itemsTotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await getProductById(item.productId);

      if (!product) {
        return NextResponse.json({ error: "محصول پیدا نشد" }, { status: 400 });
      }

      if (product.available === false) {
        return NextResponse.json(
          { error: `محصول «${product.name}» ناموجود است` },
          { status: 409 }
        );
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
        variant:
          typeof item.variant === "string" && item.variant.trim()
            ? item.variant.trim().slice(0, 120)
            : null,
      });
    }

    let discountAmount = 0;
    let appliedDiscountCode = null;

    if (discountCode && String(discountCode).trim()) {
      const discountResult = await findValidDiscountCode(discountCode, itemsTotal);

      if (!discountResult.ok) {
        return NextResponse.json({ error: discountResult.error }, { status: 400 });
      }

      discountAmount = discountResult.amount;
      appliedDiscountCode = discountResult.discount.code;
    }

    const total = itemsTotal - discountAmount + shippingCost;

    const reserved = await reserveStock(orderItems);
    if (!reserved.ok) {
      return NextResponse.json({ error: reserved.error }, { status: 409 });
    }

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
        customer_how_heard: customer.howHeard || "",

        shipping_method: shippingMethod,
        shipping_cost: shippingCost,

        total,
        status: initialStatus,

        discount_code: appliedDiscountCode,
        discount_amount: discountAmount,

        payment_method: paymentMethod,
        payment_tracking_code: payment?.trackingCode?.trim() || "",
        payment_transaction_time: payment?.transactionTime?.trim() || "",
      })
      .select()
      .single();

    if (orderError) {
      console.error("ORDER ERROR:", orderError);
      await restoreStock(orderItems);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    const rows = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      qty: item.qty,
      price: item.price,
      variant: item.variant || null,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(rows);

    if (itemsError) {
      console.error("ITEM ERROR:", itemsError);
      await restoreStock(orderItems);
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    if (appliedDiscountCode) {
      await redeemDiscountCode(appliedDiscountCode);
    }

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

    try {
      await notifyAdminSms(
        `سفارش جدید\nشماره: ${order.id}\nمشتری: ${order.customer_name}\nموبایل: ${order.customer_phone}\nمبلغ: ${Number(order.total || 0).toLocaleString("fa-IR")} تومان`
      );
    } catch (smsError) {
      console.error("SMS notify error:", smsError);
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
