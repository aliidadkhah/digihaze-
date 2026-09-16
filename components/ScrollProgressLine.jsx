"use client";

import { useEffect, useRef } from "react";

/**
 * نوار پیشرفت اسکرول: یه خط نازک بالای صفحه (روی همه‌چیز، حتی روی
 * ناوبار) که با اسکرول کردن، از یه طرف به طرف دیگه پر می‌شه — حس
 * «زنده بودن» سایت رو می‌ده، بدون این‌که هیچ‌وقت روی متن محتوا بیفته.
 *
 * چرا این‌بار فرق داره: دو تلاش قبلی سعی می‌کردن یه خط عمودی وسط
 * محتوا یا کنارش قرار بگیرن — چون عرض محتوا و متن‌ها متغیره، همیشه
 * یه جایی یا پشت چیزی گم می‌شد یا روی متن می‌افتاد. این‌جا خط فقط
 * ۳px از بالای viewport رو اشغال می‌کنه (بالاتر از ناوبار)، یه نوار
 * افقیِ باریکه که به هیچ محتوایی نمی‌خوره چون اصلاً همون بالا، بیرون
 * از ناحیه‌ی متن می‌مونه.
 *
 * از نظر کارایی: بدون blur، بدون ری‌اندر React روی اسکرول (فقط یک
 * transform با ref مستقیم آپدیت می‌شه)، listener اسکرول با
 * requestAnimationFrame محدود شده.
 */
export default function ScrollProgressLine() {
  const fillRef = useRef(null);
  const dotRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const fill = fillRef.current;
    const dot = dotRef.current;
    if (!fill) return;

    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      fill.style.transform = `scaleX(${progress})`;
      if (dot) dot.style.insetInlineStart = `${progress * 100}%`;
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        update();
        rafRef.current = null;
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 200,
        pointerEvents: "none",
        background: "rgba(255,255,255,0.06)",
      }}
    >
      <div
        ref={fillRef}
        style={{
          height: "100%",
          width: "100%",
          transformOrigin: "100% 0", // چون سایت RTL هست، پر شدن از راست به چپه
          transform: "scaleX(0)",
          background:
            "linear-gradient(90deg, #FF7A1F, #9B5CFF, #4F7FFF)",
        }}
      />
      <span
        ref={dotRef}
        style={{
          position: "absolute",
          top: "50%",
          insetInlineStart: "0%",
          transform: "translate(50%, -50%)",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#9B5CFF",
          boxShadow: "0 0 8px 2px #9B5CFF",
        }}
      />
    </div>
  );
}
