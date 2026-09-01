import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// بررسی توکن ادمین (Bearer token که از Supabase Auth میاد)
async function verifyAdmin(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) return null;

  return data.user;
}

// =====================================================
// دریافت تنظیمات سایت (عمومی - برای نمایش اطلاعیه به همه بازدیدکننده‌ها)
// =====================================================
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("announcement_text, announcement_color, announcement_active")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("SETTINGS FETCH ERROR:", error);
    // اگر جدول تنظیمات هنوز ساخته نشده، بجای خطا یک اطلاعیه‌ی غیرفعال برگردون
    return NextResponse.json({
      announcement_text: "",
      announcement_color: "#2F86FF",
      announcement_active: false,
    });
  }

  return NextResponse.json(
    data || {
      announcement_text: "",
      announcement_color: "#2F86FF",
      announcement_active: false,
    }
  );
}

// =====================================================
// ویرایش تنظیمات سایت (فقط ادمین)
// =====================================================
export async function PATCH(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const row = {
      id: 1,
      announcement_text: String(body.announcement_text || "").trim(),
      announcement_color: body.announcement_color || "#2F86FF",
      announcement_active: !!body.announcement_active,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("settings")
      .upsert(row)
      .select()
      .single();

    if (error) {
      console.error("SETTINGS UPDATE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: data });
  } catch (error) {
    console.error("SETTINGS PATCH ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
