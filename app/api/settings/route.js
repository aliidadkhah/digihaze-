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
// مقادیر پیش‌فرض روش‌های ارسال و پرداخت (همه فعال)
const DEFAULT_SHIPPING_METHODS = {
  tipax: true,
  post: true,
  chapar: true,
};

const DEFAULT_PAYMENT_METHODS = {
  card_to_card: true,
  gateway: true,
};

function withDefaults(data) {
  return {
    announcement_text: data?.announcement_text || "",
    announcement_color: data?.announcement_color || "#2F86FF",
    announcement_active: !!data?.announcement_active,
    shipping_methods_enabled: {
      ...DEFAULT_SHIPPING_METHODS,
      ...(data?.shipping_methods_enabled || {}),
    },
    payment_methods_enabled: {
      ...DEFAULT_PAYMENT_METHODS,
      ...(data?.payment_methods_enabled || {}),
    },
  };
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select(
      "announcement_text, announcement_color, announcement_active, shipping_methods_enabled, payment_methods_enabled"
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("SETTINGS FETCH ERROR:", error);
    // اگر جدول تنظیمات هنوز ساخته نشده، بجای خطا مقادیر پیش‌فرض برگردون
    return NextResponse.json(withDefaults(null));
  }

  return NextResponse.json(withDefaults(data));
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

    // فقط اگه از سمت کلاینت ارسال شده باشن آپدیت می‌شن
    // (تا AnnouncementManager با ذخیره‌ی خودش این تنظیمات رو صفر نکنه)
    if (body.shipping_methods_enabled) {
      row.shipping_methods_enabled = {
        tipax: !!body.shipping_methods_enabled.tipax,
        post: !!body.shipping_methods_enabled.post,
        chapar: !!body.shipping_methods_enabled.chapar,
      };
    }

    if (body.payment_methods_enabled) {
      row.payment_methods_enabled = {
        card_to_card: !!body.payment_methods_enabled.card_to_card,
        gateway: !!body.payment_methods_enabled.gateway,
      };
    }

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
