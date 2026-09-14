"use client";

import { useEffect, useRef } from "react";

/**
 * یک خط منحنی نازک که از بالای سایت تا پایین‌ترین نقطه کشیده می‌شود
 * و با اسکرول کاربر، رنگی/پر می‌شود (حس «زنده بودن» سایت).
 *
 * نکات مربوط به کارایی (عمداً این‌طور طراحی شده):
 * - هیچ blur یا mix-blend-mode ای استفاده نشده (سنگین‌ترین بخش افکت قبلی همین بود).
 * - روی اسکرول، هیچ state ری‌اکتی تغییر نمی‌کند و کامپوننت هیچ‌وقت دوباره
 *   render نمی‌شود؛ فقط یک attribute از یک <path> از طریق ref مستقیماً
 *   دستکاری می‌شود (strokeDashoffset)، که فقط repaint همان خط باریک رو
 *   لازم داره، نه کل صفحه.
 * - listener اسکرول passive است و با requestAnimationFrame محدود شده
 *   (حداکثر یک آپدیت در هر فریم، نه به ازای هر پیکسل اسکرول).
 * - مسیر منحنی فقط موقع mount، تغییر سایز پنجره، یا تغییر ارتفاع محتوا
 *   (با ResizeObserver روی body) دوباره محاسبه می‌شود، نه در اسکرول.
 */
export default function ScrollProgressLine() {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const trackRef = useRef(null);
  const rafRef = useRef(null);
  const lengthRef = useRef(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    const track = trackRef.current;
    if (!wrap || !svg || !path || !track) return;

    const buildPath = (height) => {
      const amplitude = 26;
      const wavelength = 460;
      const width = 80;
      const steps = Math.max(16, Math.min(120, Math.round(height / 60)));
      let d = "";
      for (let i = 0; i <= steps; i++) {
        const y = (height / steps) * i;
        const x = width / 2 + Math.sin((y / wavelength) * Math.PI * 2) * amplitude;
        d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
      }
      path.setAttribute("d", d);
      track.setAttribute("d", d);
      const length = path.getTotalLength();
      lengthRef.current = length;
      path.style.strokeDasharray = `${length}`;
      updateProgress();
    };

    const updateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      path.style.strokeDashoffset = `${lengthRef.current * (1 - progress)}`;
    };

    const setSize = () => {
      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      wrap.style.height = `${height}px`;
      svg.setAttribute("viewBox", `0 0 80 ${height}`);
      buildPath(height);
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        updateProgress();
        rafRef.current = null;
      });
    };

    setSize();

    window.addEventListener("resize", setSize);
    window.addEventListener("scroll", onScroll, { passive: true });

    // اگر ارتفاع محتوا بعد از لود عکس/فونت یا تغییر صفحه عوض بشه
    const ro = new ResizeObserver(() => setSize());
    ro.observe(document.body);

    return () => {
      window.removeEventListener("resize", setSize);
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        insetInlineEnd: 4,
        width: 80,
        zIndex: -1,
        pointerEvents: "none",
      }}
    >
      <svg
        ref={svgRef}
        width="80"
        preserveAspectRatio="none"
        style={{ display: "block", width: 80, height: "100%" }}
      >
        <defs>
          <linearGradient id="scrollLineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A84FF" />
            <stop offset="50%" stopColor="#00FFD1" />
            <stop offset="100%" stopColor="#FF7A1F" />
          </linearGradient>
        </defs>

        {/* ریل خاکستری کم‌رنگ (کل مسیر) */}
        <path
          ref={trackRef}
          fill="none"
          stroke="var(--border-soft)"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* خط رنگی که با اسکرول پر می‌شود */}
        <path
          ref={pathRef}
          fill="none"
          stroke="url(#scrollLineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
