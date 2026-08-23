import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyNewOrder } from "@/lib/telegram";
import { PRODUCTS, discountedPrice } from "@/lib/data";

// این کلاینت با توکن خود کاربر (نه service role) می‌سازیم تا هویتش رو تایید کنیم
function getUserClient(token) {
  return createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function POST(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "برای ثبت سفارش باید وارد حساب کاربری شوی" }, { status: 401 });
  }

  const userClient = getUserClient(token);
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "نشست شما نامعتبر است" }, { status: 401 });
  }

  const { items } = await req.json();
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "سبد خرید خالی است" }, { status: 400 });
  }

  // قیمت‌ها همیشه سمت سرور و از دیتای معتبر محاسبه می‌شن، نه از چیزی که کلاینت فرستاده
  let total = 0;
  const orderItems = [];
  for (const i of items) {
    const product = PRODUCTS.find((p) => p.id === i.productId);
    if (!product) {
      return NextResponse.json({ error: "محصول نامعتبر در سبد خرید" }, { status: 400 });
    }
    const unitPrice = discountedPrice(product);
    total += unitPrice * i.qty;
    orderItems.push({ product_id: product.id, qty: i.qty, price: unitPrice });
  }

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .insert({ user_id: userData.user.id, total, status: "pending" })
    .select()
    .single();

  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });

  const rows = orderItems.map((oi) => ({ ...oi, order_id: order.id }));
  const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(rows);
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  await notifyNewOrder({ ...order, items: orderItems });

  return NextResponse.json({ order: { ...order, items: orderItems } }, { status: 201 });
}
