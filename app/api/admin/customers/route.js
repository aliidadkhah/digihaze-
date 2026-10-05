import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// بررسی توکن ادمین (Bearer token که از Supabase Auth میاد)
async function verifyAdmin(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) return null;

  return data.user;
}

// دریافت لیست مشتریانی که ثبت‌نام کرده‌اند (جدول customers)
// توجه: password_hash و password_salt هرگز برگردانده نمی‌شوند.
export async function GET(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const { data: customers, error } = await supabaseAdmin
    .from("customers")
    .select(
      "phone, name, province, city, address, postal_code, how_heard, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("ADMIN CUSTOMERS FETCH ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // برای هر مشتری، تعداد و جمع سفارش‌هاش رو هم اضافه می‌کنیم
  // تا توی پنل ادمین معلوم باشه هر مشتری چقدر خرید کرده.
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("customer_phone, total, status");

  const statsByPhone = {};
  (orders || []).forEach((o) => {
    const key = o.customer_phone;
    if (!key) return;
    if (!statsByPhone[key]) {
      statsByPhone[key] = { ordersCount: 0, paidTotal: 0 };
    }
    statsByPhone[key].ordersCount += 1;
    if (o.status === "paid") {
      statsByPhone[key].paidTotal += Number(o.total || 0);
    }
  });

  const result = (customers || []).map((c) => ({
    ...c,
    ordersCount: statsByPhone[c.phone]?.ordersCount || 0,
    paidTotal: statsByPhone[c.phone]?.paidTotal || 0,
  }));

  return NextResponse.json({ customers: result });
}
