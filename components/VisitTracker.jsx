"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const VISITOR_KEY = "visitor_id";

function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    // localStorage در دسترس نیست (مثلاً حالت خصوصی مرورگر)؛ یک شناسه‌ی موقت می‌سازیم
    return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

// ثبت بی‌صدای بازدید صفحه؛ هیچ‌وقت نباید تجربه‌ی کاربر رو تحت تاثیر قرار بده
function VisitTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;

    const visitorId = getVisitorId();
    const query = searchParams?.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;

    const payload = JSON.stringify({
      path: fullPath,
      visitorId,
      referrer: typeof document !== "undefined" ? document.referrer : "",
    });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/track-visit", blob);
      } else {
        fetch("/api/track-visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // ثبت آمار هیچ‌وقت نباید خطا به کاربر نشون بده
    }
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
