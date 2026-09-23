import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { discountedPrice } from "@/lib/data";
import { getProductById } from "@/lib/products";
import { getShippingCost } from "@/lib/shipping";
import { zibalRequest, zibalPaymentUrl } from "@/lib/zibal";
import { reserveStock, restoreStock, changeOrderStatus } from "@/lib/stock";
import { findValidDiscountCode, redeemDiscountCode } from "@/lib/discount";

const SHIPPING_LABELS = {
  post: "پست",
  tipax: "تیپاکس (پس‌کرایه)",
  chapar: "چاپار (پس‌کرایه)",
  tabriz_city: "ارسال داخل شهر تبریز",
};

// این روت یک سفارش با وضعیت "pending" می‌سازه و بلافاصله
// از درگاه زیبال لینک پرداخت می‌گیره. وضعیت سفارش فقط بعد از
// تایید واقعی پرداخت (توی callback) به "paid" تغییر می‌کنه.
export async function POST(req) {
  try {
    const body = await req.json();
    const { customer, shipping, items, discountCode } = body;

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
    // بررسی روش ارسال (همیشه سمت سرور محاسبه می‌شه)
    // =========================
    const shippingMethod = shipping?.method;
    if (!SHIPPING_LABELS[shippingMethod]) {
      return NextResponse.json(
        { error: "روش ارسال نامعتبر است" },
        { status: 400 }
      );
    }
    const shippingCost = getShippingCost(shippingMethod) ?? 0;

    // =========================
    // محاسبه مبلغ (سمت سرور، از روی قیمت واقعی محصولات)
    // =========================
    let itemsTotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await getProductById(item.productId);

      if (!product) {
        return NextResponse.json(
          { error: "محصول پیدا نشد" },
          { status: 400 }
        );
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

    // =========================
    // بررسی کد تخفیف (همیشه سمت سرور، روی جمع واقعی سبد)
    // =========================
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

    if (total <= 0) {
      return NextResponse.json(
        { error: "مبلغ سفارش نامعتبر است" },
        { status: 400 }
      );
    }

    // =========================
    // رزرو موجودی رنگ‌ها (اگه پرداخت ناموفق بشه برمی‌گرده)
    // =========================
    const reserved = await reserveStock(orderItems);
    if (!reserved.ok) {
      return NextResponse.json({ error: reserved.error }, { status: 409 });
    }

    // =========================
    // ثبت سفارش با وضعیت "در انتظار پرداخت"
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
        customer_how_heard: customer.howHeard || "",

        shipping_method: shippingMethod,
        shipping_cost: shippingCost,

        total,
        status: "pending",

        discount_code: appliedDiscountCode,
        discount_amount: discountAmount,

        payment_method: "gateway",
      })
      .select()
      .single();

    if (orderError) {
      console.error("ORDER ERROR:", orderError);
      await restoreStock(orderItems);
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    // =========================
    // ثبت استفاده از کد تخفیف
    // =========================
    if (appliedDiscountCode) {
      await redeemDiscountCode(appliedDiscountCode);
    }

    // =========================
    // درخواست پرداخت از زیبال
    // =========================
    let zibalResult;

    try {
      zibalResult = await zibalRequest({
        amountToman: total,
        orderId: order.id,
        mobile: customer.phone.trim(),
        description: `پرداخت سفارش دیجی‌هیز #${String(
          order.id
        ).slice(0, 8)}`,
      });
    } catch (zibalError) {
      console.error("ZIBAL REQUEST ERROR:", zibalError);

      await changeOrderStatus(order.id, "failed");

      return NextResponse.json(
        { error: "خطا در اتصال به درگاه پرداخت. لطفاً دوباره تلاش کنید." },
        { status: 502 }
      );
    }

    if (zibalResult?.result !== 100) {
      console.error("ZIBAL REQUEST REJECTED:", zibalResult);

      await changeOrderStatus(order.id, "failed");

      return NextResponse.json(
        {
          error:
            zibalResult?.message ||
            "درگاه پرداخت درخواست را نپذیرفت.",
        },
        { status: 502 }
      );
    }

    await supabaseAdmin
      .from("orders")
      .update({ payment_track_id: zibalResult.trackId })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      order,
      paymentUrl: zibalPaymentUrl(zibalResult.trackId),
    });
  } catch (error) {
    console.error("ZIBAL REQUEST API ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
