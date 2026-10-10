import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// مسیرهایی که نباید توی آمار حساب بشن (پنل ادمین و API ها)
function shouldSkip(path) {
  return (
    !path ||
    path.startsWith("/admin") ||
    path.startsWith("/api")
  );
}

export async function POST(request) {
  try {
    const body = await request.json();

    const path = String(body.path || "").trim().slice(0, 300);
    const visitorId = String(body.visitorId || "").trim().slice(0, 80);
    const referrer = String(body.referrer || "").trim().slice(0, 300);

    if (!path || !visitorId || shouldSkip(path)) {
      // سکوت می‌کنیم؛ این درخواست برای کاربر نهایی اهمیتی نداره که ببینه
      return NextResponse.json({ success: true });
    }

    const { error } = await supabaseAdmin.from("page_views").insert({
      path,
      visitor_id: visitorId,
      referrer: referrer || null,
    });

    if (error) {
      // هیچ‌وقت نباید تجربه‌ی کاربر رو به‌خاطر ثبت آمار خراب کنیم
      console.error("TRACK VISIT ERROR:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("TRACK VISIT ERROR:", error);
    return NextResponse.json({ success: true });
  }
}
