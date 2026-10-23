import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// مسیرهایی که نباید توی آمار حساب بشن (پنل ادمین و API ها)
function shouldSkip(path) {
  return !path || path.startsWith("/admin") || path.startsWith("/api");
}

// توی این صفحات query string ممکنه اطلاعات حساس داشته باشه (توکن پرداخت، لینک بازیابی رمز)
const STRIP_QUERY_PREFIXES = ["/order-success", "/reset-password", "/auth", "/checkout", "/cart"];

const ID_RE = /^[A-Za-z0-9_.:-]{6,80}$/;

// ---------------------------------------------------------------
// محدودیت ساده‌ی تعداد درخواست (جلوگیری از اسپم آمار)
// ---------------------------------------------------------------
const hits = new Map();
function rateLimited(key) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + 60_000 });
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > 120; // حداکثر ۱۲۰ بازدید در دقیقه برای هر بازدیدکننده
}

// ---------------------------------------------------------------
// تشخیص ربات، دستگاه، مرورگر و سیستم‌عامل از روی User-Agent
// ---------------------------------------------------------------
const BOT_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor|curl\/|wget|python-requests|axios|node-fetch|go-http|java\/|preview|whatsapp\/|petalbot|semrush|ahrefs|mj12|dotbot|bytespider|gtmetrix|chrome-lighthouse/i;

function parseUA(ua) {
  const s = ua || "";
  const isBot = !s || BOT_RE.test(s);

  let device = "desktop";
  if (/ipad|tablet|playbook|silk/i.test(s) || (/android/i.test(s) && !/mobile/i.test(s))) {
    device = "tablet";
  } else if (/mobi|iphone|ipod|android/i.test(s)) {
    device = "mobile";
  }

  let browser = "Other";
  if (/instagram/i.test(s)) browser = "Instagram";
  else if (/fban|fbav/i.test(s)) browser = "Facebook";
  else if (/edg(e|a|ios)?\//i.test(s)) browser = "Edge";
  else if (/opr\/|opera/i.test(s)) browser = "Opera";
  else if (/samsungbrowser/i.test(s)) browser = "Samsung Internet";
  else if (/firefox|fxios/i.test(s)) browser = "Firefox";
  else if (/ucbrowser/i.test(s)) browser = "UC Browser";
  else if (/crios|chrome|chromium/i.test(s)) browser = "Chrome";
  else if (/safari/i.test(s)) browser = "Safari";
  else if (/msie|trident/i.test(s)) browser = "IE";

  let os = "Other";
  if (/windows/i.test(s)) os = "Windows";
  else if (/iphone|ipad|ipod/i.test(s)) os = "iOS";
  else if (/android/i.test(s)) os = "Android";
  else if (/cros/i.test(s)) os = "ChromeOS";
  else if (/mac os x|macintosh/i.test(s)) os = "macOS";
  else if (/linux/i.test(s)) os = "Linux";

  return { isBot, device, browser, os };
}

// ---------------------------------------------------------------
// تشخیص کانال ورود (مستقیم، گوگل، شبکه‌ی اجتماعی، ...)
// ---------------------------------------------------------------
const SEARCH_HOSTS = /(^|\.)(google|bing|yahoo|duckduckgo|yandex|ecosia|baidu|startpage|brave|ask)\./i;
const SOCIAL_HOSTS =
  /(^|\.)(instagram\.com|facebook\.com|fb\.com|l\.facebook\.com|t\.co|twitter\.com|x\.com|t\.me|telegram\.org|telegram\.me|whatsapp\.com|wa\.me|youtube\.com|youtu\.be|linkedin\.com|pinterest\.com|reddit\.com|tiktok\.com|aparat\.com|bale\.ai|ble\.ir|eitaa\.com|rubika\.ir|splus\.ir)$/i;

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function classify({ referrerHost, siteHosts, utmSource, utmMedium }) {
  const medium = (utmMedium || "").toLowerCase();

  if (referrerHost && siteHosts.includes(referrerHost)) return "internal";
  if (/^(cpc|ppc|paid|paidsearch|cpm|display)$/.test(medium)) return "paid";
  if (medium === "email") return "email";
  if (medium === "social" || (referrerHost && SOCIAL_HOSTS.test(referrerHost))) return "social";
  if (referrerHost && SEARCH_HOSTS.test(referrerHost)) return "organic";
  if (referrerHost) return "referral";
  if (utmSource) return "campaign";
  return "direct";
}

function clean(value, max) {
  const v = String(value || "").trim().slice(0, max);
  return v || null;
}

export async function POST(request) {
  try {
    const raw = await request.text();
    let body = {};
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ success: true });
    }

    let path = String(body.path || "").trim().slice(0, 300);
    const visitorId = String(body.visitorId || "").trim();
    const sessionId = String(body.sessionId || "").trim();

    if (!path.startsWith("/") || !ID_RE.test(visitorId) || shouldSkip(path)) {
      // سکوت می‌کنیم؛ این درخواست برای کاربر نهایی اهمیتی نداره که ببینه
      return NextResponse.json({ success: true });
    }

    path = path.split("#")[0];
    const pathname = path.split("?")[0];
    if (STRIP_QUERY_PREFIXES.some((p) => pathname.startsWith(p))) path = pathname;

    const ua = request.headers.get("user-agent") || "";
    const { isBot, device, browser, os } = parseUA(ua);

    // ربات‌ها و خزنده‌ها آمار رو الکی بالا می‌برن؛ ثبتشون نمی‌کنیم
    if (isBot) return NextResponse.json({ success: true });

    if (rateLimited(visitorId)) return NextResponse.json({ success: true });

    const siteHost = hostOf(SITE_URL);
    const reqHost = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
      .split(":")[0]
      .toLowerCase()
      .replace(/^www\./, "");
    const siteHosts = [siteHost, reqHost].filter(Boolean);

    const referrer = clean(body.referrer, 300);
    const referrerHost = hostOf(referrer || "");
    const utmSource = clean(body.utmSource, 80);
    const utmMedium = clean(body.utmMedium, 80);
    const utmCampaign = clean(body.utmCampaign, 120);

    const channel = classify({ referrerHost, siteHosts, utmSource, utmMedium });

    // کشور از هدر کلادفلر (اگه دامنه از پروکسی کلادفلر رد بشه) گرفته می‌شه
    const countryRaw = (
      request.headers.get("cf-ipcountry") ||
      request.headers.get("x-vercel-ip-country") ||
      ""
    ).toUpperCase();
    const country = /^[A-Z]{2}$/.test(countryRaw) && countryRaw !== "XX" && countryRaw !== "T1"
      ? countryRaw
      : "unknown";

    const fullRow = {
      path,
      visitor_id: visitorId,
      session_id: ID_RE.test(sessionId) ? sessionId : null,
      referrer: channel === "internal" ? null : referrer,
      referrer_host: channel === "internal" ? null : referrerHost || null,
      channel,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      device,
      browser,
      os,
      country,
      is_new_visitor: body.isNewVisitor === true,
    };

    const { error } = await supabaseAdmin.from("page_views").insert(fullRow);

    if (error) {
      console.error("TRACK VISIT ERROR:", error);

      // اگه مایگریشن جدید هنوز اجرا نشده (ستون‌های جدید نیستن)، حداقل خود بازدید ثبت بشه
      const legacy = await supabaseAdmin.from("page_views").insert({
        path,
        visitor_id: visitorId,
        referrer: fullRow.referrer,
      });
      if (legacy.error) console.error("TRACK VISIT LEGACY ERROR:", legacy.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // هیچ‌وقت نباید تجربه‌ی کاربر رو به‌خاطر ثبت آمار خراب کنیم
    console.error("TRACK VISIT ERROR:", error);
    return NextResponse.json({ success: true });
  }
}
