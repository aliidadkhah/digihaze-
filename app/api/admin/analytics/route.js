import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// بررسی توکن ادمین (Bearer token که از Supabase Auth میاد) - همون الگوی بقیه‌ی روت‌های ادمین
async function verifyAdmin(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) return null;

  return data.user;
}

function dayKey(date) {
  // کلید روز به وقت تهران (UTC+03:30) تا نمودار با روزهای واقعی کاربر همخوانی داشته باشه
  const tehran = new Date(date.getTime() + (3 * 60 + 30) * 60 * 1000);
  return tehran.toISOString().slice(0, 10);
}

export async function GET(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // تعداد کل بازدیدها از اول (فقط شمارش، بدون دانلود ردیف‌ها)
  const totalCountRes = await supabaseAdmin
    .from("page_views")
    .select("id", { count: "exact", head: true });

  if (totalCountRes.error) {
    console.error("ANALYTICS total count error:", totalCountRes.error);
    return NextResponse.json(
      {
        error: totalCountRes.error.message,
        hint: "احتمالاً جدول page_views هنوز ساخته نشده (فایل supabase/analytics_migration.sql رو اجرا کن).",
      },
      { status: 500 }
    );
  }

  // داده‌ی ۳۰ روز اخیر برای محاسبه‌ی بقیه‌ی آمارها
  const { data: rows, error } = await supabaseAdmin
    .from("page_views")
    .select("path, visitor_id, created_at")
    .gte("created_at", since30.toISOString())
    .limit(30000);

  if (error) {
    console.error("ANALYTICS rows error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const todayKey = dayKey(now);
  const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const todayVisitors = new Set();
  const week7Views = [];
  const week7Visitors = new Set();
  const month30Visitors = new Set();
  const pathCounts7 = {};
  const perDay = {}; // { "YYYY-MM-DD": { views: n, visitors: Set } }

  for (const row of rows || []) {
    const created = new Date(row.created_at);
    const key = dayKey(created);

    month30Visitors.add(row.visitor_id);

    if (!perDay[key]) perDay[key] = { views: 0, visitors: new Set() };
    perDay[key].views += 1;
    perDay[key].visitors.add(row.visitor_id);

    if (key === todayKey) {
      todayVisitors.add(row.visitor_id);
    }

    if (created >= since7) {
      week7Views.push(row);
      week7Visitors.add(row.visitor_id);
      pathCounts7[row.path] = (pathCounts7[row.path] || 0) + 1;
    }
  }

  const todayViewsCount = (rows || []).filter((r) => dayKey(new Date(r.created_at)) === todayKey).length;

  const topPages = Object.entries(pathCounts7)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, views]) => ({ path, views }));

  // سری روزانه برای نمودار (۱۴ روز اخیر)
  const daily = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = dayKey(d);
    const entry = perDay[key];
    daily.push({
      date: key,
      views: entry?.views || 0,
      visitors: entry ? entry.visitors.size : 0,
    });
  }

  return NextResponse.json({
    totalAllTime: totalCountRes.count || 0,
    today: {
      views: todayViewsCount,
      visitors: todayVisitors.size,
    },
    last7Days: {
      views: week7Views.length,
      visitors: week7Visitors.size,
    },
    last30Days: {
      views: (rows || []).length,
      visitors: month30Visitors.size,
    },
    topPages,
    daily,
  });
}
