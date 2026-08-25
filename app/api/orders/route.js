```jsx
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyNewOrder } from "@/lib/telegram";
import { PRODUCTS, discountedPrice } from "@/lib/data";

export async function POST(req) {
  try {
    // دریافت اطلاعات درخواست
    const body = await req.json();

    const {
      customer,
      payment,
      items,
    } = body;

    // -----------------------------
    // بررسی اطلاعات مشتری
    // -----------------------------

    if (
      !customer?.name?.trim() ||
      !customer?.phone?.trim() ||
      !customer?.address?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "لطفاً نام، شماره موبایل و آدرس را کامل وارد کنید.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // بررسی سبد خرید
    // -----------------------------

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "سبد خرید خالی است.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // محاسبه مبلغ سفارش
    // -----------------------------

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = PRODUCTS.find(
        (p) => p.id === item.productId
      );

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            error: `محصول ${item.productId} پیدا نشد.`,
          },
          { status: 400 }
        );
      }

      const qty = Number(item.qty);

      if (!Number.isInteger(qty) || qty <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "تعداد محصول نامعتبر است.",
          },
          { status: 400 }
        );
      }

      const price = discountedPrice(product);

      total += price * qty;

      orderItems.push({
        product_id: product.id,
        qty,
        price,
      });
    }

    // -----------------------------
    // اطلاعات سفارش
    // -----------------------------
    //
    // نام ستون‌ها باید دقیقاً مطابق
    // جدول orders در Supabase باشد.
    //
    // customer name
    // customer phone
    // customer address
    // payment tracking code
    // payment transaction time
    // payment method
    // total
    // status
    //

    const orderData = {
      "customer name": customer.name.trim(),

      "customer phone": customer.phone.trim(),

      "customer address": customer.address.trim(),

      total,

      status: "pending",

      "payment tracking code":
        payment?.trackingCode?.trim() || "",

      "payment transaction time":
        payment?.transactionTime?.trim() || "",

      "payment method": "card_to_card",
    };

    console.log(
      "ORDER DATA:",
      JSON.stringify(orderData, null, 2)
    );

    // -----------------------------
    // ثبت سفارش
    // -----------------------------

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error(
        "SUPABASE ORDER ERROR:",
        orderError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            orderError.message ||
            "خطا در ثبت سفارش در Supabase.",
        },
        { status: 500 }
      );
    }

    // -----------------------------
    // ثبت محصولات سفارش
    // -----------------------------

    const rows = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      qty: item.qty,
      price: item.price,
    }));

    const {
      error: itemsError,
    } = await supabaseAdmin
      .from("order_items")
      .insert(rows);

    if (itemsError) {
      console.error(
        "SUPABASE ORDER ITEMS ERROR:",
        itemsError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            itemsError.message ||
            "سفارش ثبت شد اما محصولات سفارش ذخیره نشدند.",
        },
        { status: 500 }
      );
    }

    // -----------------------------
    // ارسال پیام تلگرام
    // -----------------------------

    try {
      await notifyNewOrder({
        ...order,
        items: orderItems,
      });
    } catch (telegramError) {
      console.error(
        "TELEGRAM ERROR:",
        telegramError
      );

      // خطای تلگرام باعث شکست سفارش نمی‌شود.
    }

    // -----------------------------
    // پاسخ نهایی
    // -----------------------------

    return NextResponse.json(
      {
        success: true,
        order,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      "ORDER API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "خطایی در ثبت سفارش رخ داد.",
      },
      { status: 500 }
    );
  }
}
```
