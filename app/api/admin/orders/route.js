import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { changeOrderStatus, VALID_STATUSES } from "@/lib/stock";

// بررسی توکن ادمین (Bearer token که از Supabase Auth میاد)
async function verifyAdmin(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) return null;

  return data.user;
}

// دریافت لیست سفارش‌ها برای پنل ادمین
export async function GET(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("ADMIN ORDERS FETCH ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: orders || [] });
}

// تغییر وضعیت سفارش یا ثبت لینک‌های رهگیری
export async function PATCH(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId, status, trackingUrls } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "شناسه سفارش ارسال نشده است" },
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "وضعیت نامعتبر است" },
        { status: 400 }
      );
    }

    const updateData = {};

    if (trackingUrls) {
      if (trackingUrls.post !== undefined) {
        updateData.tracking_url_post = trackingUrls.post;
      }
      if (trackingUrls.tipax !== undefined) {
        updateData.tracking_url_tipax = trackingUrls.tipax;
      }
      if (trackingUrls.chapar !== undefined) {
        updateData.tracking_url_chapar = trackingUrls.chapar;
      }
    }

    // تغییر وضعیت از مسیر مخصوص انجام می‌شه تا موجودی هم هماهنگ بشه:
    // لغو/ناموفق → موجودی رنگ‌ها برمی‌گرده، برگشت به فعال → دوباره کم می‌شه
    if (status) {
      const result = await changeOrderStatus(orderId, status, updateData);

      if (!result.ok) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status || 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "داده‌ای برای بروزرسانی ارسال نشده است" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (error) {
      console.error("ADMIN ORDERS UPDATE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN ORDERS PATCH ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
