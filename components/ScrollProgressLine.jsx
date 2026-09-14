"use client";

import { useEffect, useRef } from "react";

/**
 * یک خط منحنی نرم که مثل بک‌گراند، پشت کل محتوای سایت (z-index منفی)
 * از بالای صفحه تا پایین‌ترین نقطه کشیده می‌شود و با اسکرول پر (رنگی)
 * می‌شود. روی موبایل و دسکتاپ هر دو نمایش داده می‌شود — چون پشت محتواست
 * (نه کنارش)، جایی که پشت باکس/کارت‌های تو-پر قرار بگیره دیده نمی‌شه،
 * ولی توی فاصله‌ها و پس‌زمینه‌ی صفحه (بین سکشن‌ها، اطراف هیرو و ...) پیداست.
 *
 * از نظر کارایی: هیچ blur/mix-blend-mode ای نداره، روی اسکرول هیچ
 * ری‌اندر React ای اتفاق نمی‌افته (فقط یک attribute از طریق ref مستقیم
 * آپدیت می‌شه)، و listener اسکرول با requestAnimationFrame محدود شده.
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

    let canvasWidth = 80;

    // نقاط موج رو با فاصله‌ی ثابت (نه بر اساس ارتفاع صفحه) می‌سازیم که
    // چگالی نقاط همیشه کافی باشه و منحنی نرم دربیاد
    const buildWavePoints = (height, width) => {
      const amplitude = width * 0.32;
      const wavelength = 420;
      const spacing = 32; // فاصله‌ی هر نقطه از نقطه‌ی بعدی (px)
      const steps = Math.max(8, Math.round(height / spacing));
      const points = [];
      for (let i = 0; i <= steps; i++) {
        const y = (height / steps) * i;
        const x = width / 2 + Math.sin((y / wavelength) * Math.PI * 2) * amplitude;
        points.push([x, y]);
      }
      return points;
    };

    // تبدیل مجموعه نقاط به یک مسیر Bezier نرم (Catmull-Rom -> Cubic Bezier)
    const smoothPathFromPoints = (points) => {
      if (points.length < 2) return "";
      let d = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)} `;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        const c1x = p1[0] + (p2[0] - p0[0]) / 6;
        const c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6;
        const c2y = p2[1] - (p3[1] - p1[1]) / 6;

        d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)} `;
      }
      return d;
    };

    const updateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      path.style.strokeDashoffset = `${lengthRef.current * (1 - progress)}`;
    };

    const setSize = () => {
      // عرض کانواس متناسب با عرض صفحه (روی موبایل باریک‌تر، روی دسکتاپ عریض‌تر)
      canvasWidth = Math.round(
        Math.min(260, Math.max(70, window.innerWidth * 0.5))
      );

      wrap.style.width = `${canvasWidth}px`;

      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      wrap.style.height = `${height}px`;
      svg.setAttribute("viewBox", `0 0 ${canvasWidth} ${height}`);

      const d = smoothPathFromPoints(buildWavePoints(height, canvasWidth));
      path.setAttribute("d", d);
      track.setAttribute("d", d);

      const length = path.getTotalLength();
      lengthRef.current = length;
      path.style.strokeDasharray = `${length}`;
      updateProgress();
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
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: -1,
        pointerEvents: "none",
      }}
    >
      <svg
        ref={svgRef}
        preserveAspectRatio="none"
        style={{ display: "block", width: "100%", height: "100%" }}
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
          strokeOpacity="0.3"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* خط رنگی که با اسکرول پر می‌شود */}
        <path
          ref={pathRef}
          fill="none"
          stroke="url(#scrollLineGrad)"
          strokeOpacity="0.55"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
