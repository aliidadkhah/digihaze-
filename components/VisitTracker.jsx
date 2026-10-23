"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const VISITOR_KEY = "visitor_id";
const SESSION_KEY = "dh_session";
const NO_TRACK_KEY = "dh_no_track";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // بعد از ۳۰ دقیقه بی‌فعالیتی نشست جدید شروع می‌شه

function makeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// شناسه‌ی بازدیدکننده (ماندگار) + اینکه اولین بازدیدش هست یا نه
function getVisitor() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    let isNew = false;
    if (!id) {
      id = makeId();
      localStorage.setItem(VISITOR_KEY, id);
      isNew = true;
    }
    return { id, isNew };
  } catch {
    // localStorage در دسترس نیست (مثلاً حالت خصوصی مرورگر)؛ یک شناسه‌ی موقت می‌سازیم
    return { id: `temp-${makeId()}`, isNew: false };
  }
}

// نشست (Session): تا وقتی کاربر فعاله ثابته، بعد از ۳۰ دقیقه بی‌فعالیتی عوض می‌شه
function getSessionId() {
  try {
    const now = Date.now();
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (saved?.id && now - saved.last < SESSION_TIMEOUT_MS) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id: saved.id, last: now }));
      return saved.id;
    }
    const id = makeId();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id, last: now }));
    return id;
  } catch {
    return `s-${makeId()}`;
  }
}

function send(payload) {
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "text/plain" });
      if (navigator.sendBeacon("/api/track-visit", blob)) return;
    }
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ثبت آمار هیچ‌وقت نباید خطا به کاربر نشون بده
  }
}

// ثبت بی‌صدای بازدید صفحه؛ هیچ‌وقت نباید تجربه‌ی کاربر رو تحت تاثیر قرار بده
function VisitTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastRef = useRef({ key: "", at: 0, path: null });

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;

    try {
      // مرورگرهایی که ادمین از آمار حذف کرده
      if (localStorage.getItem(NO_TRACK_KEY) === "1") return;
    } catch {}

    const query = searchParams?.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;

    // جلوگیری از ثبت دوباره‌ی همون صفحه در کمتر از ۱ ثانیه (مثلاً StrictMode)
    const now = Date.now();
    if (lastRef.current.key === fullPath && now - lastRef.current.at < 1000) return;

    const isFirstOfPageLoad = lastRef.current.path === null;
    const origin = typeof location !== "undefined" ? location.origin : "";

    // document.referrer فقط موقع لود کامل صفحه درسته؛ برای جابه‌جایی‌های داخلی
    // سایت (بدون رفرش) صفحه‌ی قبلی خودمون رو به‌عنوان referrer می‌فرستیم
    const referrer = isFirstOfPageLoad
      ? document.referrer || ""
      : `${origin}${lastRef.current.path}`;

    const params = new URLSearchParams(typeof location !== "undefined" ? location.search : "");

    const visitor = getVisitor();
    const payload = JSON.stringify({
      path: fullPath,
      visitorId: visitor.id,
      sessionId: getSessionId(),
      isNewVisitor: visitor.isNew,
      referrer,
      utmSource: isFirstOfPageLoad ? params.get("utm_source") || "" : "",
      utmMedium: isFirstOfPageLoad ? params.get("utm_medium") || "" : "",
      utmCampaign: isFirstOfPageLoad ? params.get("utm_campaign") || "" : "",
    });

    lastRef.current = { key: fullPath, at: now, path: fullPath };
    send(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}

// useSearchParams توی App Router نیاز به Suspense داره؛ این‌طوری بقیه‌ی صفحه
// منتظرش نمی‌مونه و رندرش رو کند نمی‌کنه (چون چیزی روی صفحه نشون نمی‌ده)
export default function VisitTracker() {
  return (
    <Suspense fallback={null}>
      <VisitTrackerInner />
    </Suspense>
  );
}
