import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyNewOrder } from "@/lib/telegram";
import { PRODUCTS, discountedPrice } from "@/lib/data";

export async function POST(req) {
  try {
    const body = await req.json();

    const { customer, items } = body;

    // -----------------------------
    // بررسی اطلاعات مشتری
    // -----------------------------

    if (!customer) {
      return NextResponse.json(
        { error: "اطلاعات مشتری ارسال نشده است." },
        { status: 400 }
      );
    }

    const name = String(customer.name || "").trim();
    const phone = String(customer.phone || "").trim();
    const address = String(customer.address || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "نام و نام خانوادگی الزامی است." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "شماره موبایل الزامی است." },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { error: "آدرس الزامی است." },
        { status: 400 }
      );
    }

    // -----------------------------
    // بررسی سبد خرید
    // -----------------------------

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "سبد خرید خالی است." },
        { status: 400 }
      );
    }

    // -----------------------------
    // محاسبه قیمت سمت سرور
    // -----------------------------

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = PRODUCTS.find(
        (p) => p.id === item.productId
      );

      if (!product) {
        return NextResponse.json(
          { error: "محصول نامعتبر در سبد خرید." },
          { status: 400 }
        );
      }

      const qty = Number(item.qty);

      if (!Number.isInteger(qty) || qty <= 0) {
        return NextResponse.json(
          { error: "تعداد محصول نامعتبر است." },
          { status: 400 }
        );
      }

      const unitPrice = discountedPrice(product);

      total += unitPrice * qty;

      orderItems.push({
        product_id: product.id,
        qty,
        price: unitPrice,
      });
    }

    // -----------------------------
    // ایجاد سفارش
    // -----------------------------

    const { data: order, error: orderErr } =
      await supabaseAdmin
        .from("orders")
        .insert({
          total,
          status: "pending",

          // اطلاعات مشتری
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
        })
        .select()
        .single();

    if (orderErr) {
      console.error("Supabase order error:", orderErr);

      return NextResponse.json(
        {
          error:
            "خطا در ثبت سفارش در پایگاه داده.",
          details: orderErr.message,
        },
        { status: 500 }
      );
    }

    // -----------------------------
    // ثبت محصولات سفارش
    // -----------------------------

    const rows = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsErr } =
      await supabaseAdmin
        .from("order_items")
        .insert(rows);

    if (itemsErr) {
      console.error(
        "Supabase order items error:",
        itemsErr
      );

      return NextResponse.json(
        {
          error:
            "سفارش ثبت شد اما ثبت محصولات سفارش با خطا مواجه شد.",
          details: itemsErr.message,
        },
        { status: 500 }
      );
    }

    // -----------------------------
    // ارسال اطلاعیه به تلگرام
    // -----------------------------

    await notifyNewOrder({
      ...order,
      items: orderItems,
    });

    // -----------------------------
    // پاسخ نهایی
    // -----------------------------

    return NextResponse.json(
      {
        success: true,
        order: {
          ...order,
          items: orderItems,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order API error:", error);

    return NextResponse.json(
      {
        error: "خطای غیرمنتظره در ثبت سفارش.",
      },
      { status: 500 }
    );
  }
}
