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

// ایران ساعت تابستانی نداره؛ اختلاف همیشه ثابت +03:30 هست
const OFFSET = (3 * 60 + 30) * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

// شروع روز (۰۰:۰۰ به وقت تهران) برای یک لحظه، به‌صورت میلی‌ثانیه‌ی UTC
function tehranMidnight(ms) {
  return Math.floor((ms + OFFSET) / DAY) * DAY - OFFSET;
}

function parseDate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || "");
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) - OFFSET;
}

function resolveRange(searchParams) {
  const now = Date.now();
  const todayStart = tehranMidnight(now);
  const range = searchParams.get("range") || "7d";

  let from;
  let to;
  let prevFrom;
  let prevTo;

  if (range === "today") {
    from = todayStart;
    to = now;
    prevFrom = from - DAY;
    prevTo = prevFrom + (to - from);
  } else if (range === "yesterday") {
    from = todayStart - DAY;
    to = todayStart;
    prevFrom = from - DAY;
    prevTo = from;
  } else if (range === "custom") {
    let f = parseDate(searchParams.get("from"));
    let t = parseDate(searchParams.get("to"));
    if (f === null || t === null) {
      f = todayStart - 6 * DAY;
      t = todayStart;
    }
    if (t < f) [f, t] = [t, f];
    from = f;
    to = t + DAY;
    // حداکثر ۳۶۶ روز
    if (to - from > 366 * DAY) from = to - 366 * DAY;
    prevFrom = from - (to - from);
    prevTo = from;
  } else {
    const days = range === "90d" ? 90 : range === "30d" ? 30 : 7;
    from = todayStart - (days - 1) * DAY;
    to = todayStart + DAY;
    prevFrom = from - days * DAY;
    prevTo = from;
  }

  const gran = to - from <= DAY ? "hour" : "day";

  return {
    from: new Date(from).toISOString(),
    to: new Date(to).toISOString(),
    prevFrom: new Date(prevFrom).toISOString(),
    prevTo: new Date(prevTo).toISOString(),
    gran,
    range,
  };
}

const MIGRATION_HINT =
  "احتمالاً مایگریشن آمار هنوز اجرا نشده. فایل supabase/analytics_migration.sql رو توی Supabase > SQL Editor اجرا کن.";

export async function GET(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // آمار زنده (کاربران آنلاین)
  if (searchParams.get("realtime") === "1") {
    const { data, error } = await supabaseAdmin.rpc("analytics_realtime");

    if (error) {
      console.error("ANALYTICS realtime error:", error);
      return NextResponse.json({ error: error.message, hint: MIGRATION_HINT }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  const r = resolveRange(searchParams);

  const { data, error } = await supabaseAdmin.rpc("analytics_overview", {
    p_from: r.from,
    p_to: r.to,
    p_prev_from: r.prevFrom,
    p_prev_to: r.prevTo,
    p_gran: r.gran,
  });

  if (error) {
    console.error("ANALYTICS overview error:", error);
    return NextResponse.json({ error: error.message, hint: MIGRATION_HINT }, { status: 500 });
  }

  return NextResponse.json({ ...data, meta: r });
}
