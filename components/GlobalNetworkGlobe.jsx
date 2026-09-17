"use client";

import { useEffect, useRef } from "react";

/* ============================================================
   نقشه‌ی نقطه‌ای دنیا (Global Network Globe)

   این یک کره‌ی نقطه‌ای «تزئینی» است، شبیه گرافیک شبکه‌ی جهانی
   Cloudflare: خشکی‌ها با بیضی‌های ساده تقریب زده شده‌اند (نه با
   داده‌ی جغرافیایی دقیق)، روی کانواس رسم می‌شن و به آرومی می‌چرخن.
============================================================ */

const LANDMASSES = [
  { cy: 48, cx: -100, ry: 20, rx: 32 }, // آمریکای شمالی
  { cy: 18, cx: -92, ry: 7, rx: 6 }, // آمریکای مرکزی
  { cy: 72, cx: -42, ry: 9, rx: 11 }, // گرینلند
  { cy: -15, cx: -60, ry: 34, rx: 17 }, // آمریکای جنوبی
  { cy: 52, cx: 15, ry: 13, rx: 19 }, // اروپا
  { cy: 5, cx: 20, ry: 34, rx: 21 }, // آفریقا
  { cy: 55, cx: 90, ry: 24, rx: 52 }, // آسیای شمالی و مرکزی
  { cy: 20, cx: 80, ry: 14, rx: 19 }, // جنوب آسیا
  { cy: 55, cx: 145, ry: 12, rx: 18 }, // شرق آسیا
  { cy: -25, cx: 135, ry: 10, rx: 17 }, // استرالیا
];

const OCEAN_CARVES = [
  { cy: 60, cx: -85, ry: 6, rx: 6 }, // خلیج هادسون
  { cy: 25, cx: -92, ry: 6, rx: 8 }, // خلیج مکزیک
  { cy: 39, cx: 18, ry: 4, rx: 12 }, // دریای مدیترانه
  { cy: 15, cx: 90, ry: 6, rx: 8 }, // خلیج بنگال
];

function inEllipse(lat, lon, e) {
  const dy = (lat - e.cy) / e.ry;
  const dx = (lon - e.cx) / e.rx;
  return dx * dx + dy * dy <= 1;
}

function isLand(lat, lon) {
  if (!LANDMASSES.some((e) => inEllipse(lat, lon, e))) return false;
  if (OCEAN_CARVES.some((e) => inEllipse(lat, lon, e))) return false;
  return true;
}

function buildDots(step = 4) {
  const dots = [];
  for (let lat = -78; lat <= 78; lat += step) {
    // نزدیک قطب‌ها نقاط کمتری بذاریم چون دایره‌ی عرضی کوچیک‌تره
    const lonStep = step / Math.max(0.18, Math.cos((lat * Math.PI) / 180));
    for (let lon = -180; lon <= 180; lon += lonStep) {
      if (isLand(lat, lon)) dots.push([lat, lon]);
    }
  }
  return dots;
}

/* ---------------------------------------------------------
   باکس آماری با کادر خط‌چین
--------------------------------------------------------- */
function StatCallout({ title, text, color, className }) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        border: `1px dashed ${color}90`,
        borderRadius: 6,
        padding: "16px 18px",
        width: "100%",
        maxWidth: 260,
        flex: "0 0 auto",
      }}
    >
      <div
        style={{
          fontFamily: "Vazirmatn",
          fontWeight: 800,
          fontSize: 16,
          color,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "Vazirmatn",
          fontSize: 13,
          lineHeight: 1.9,
          color: "var(--text-lo)",
          textAlign: "justify",
        }}
      >
        {text}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   خود کره — کامپوننت اصلی
--------------------------------------------------------- */
export default function GlobalNetworkGlobe({
  height = 440,
  color = "#FF7A1F",
  leftStat = {
    title: "ارسال به سراسر ایران",
    text: "بسته‌بندی امن و ارسال از نزدیک‌ترین انبار، برای رسیدن سریع‌تر بسته به دستتون.",
  },
  rightStat = {
    title: "پشتیبانی ۲۴ ساعته",
    text: "قبل و بعد از خرید، هر روز هفته یه نفر واقعی پاسخگوی سوالاتتونه.",
  },
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const dotsRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!dotsRef.current) dotsRef.current = buildDots(4);

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const TILT = (-16 * Math.PI) / 180;

    let raf = null;
    let width = 0;
    let heightPx = 0;
    let dpr = 1;
    let rotation = 0.9; // زاویه‌ی شروع، برای اینکه از اول یه قاره جلو باشه
    let visible = true;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      heightPx = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(heightPx * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = heightPx + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const project = (lat, lon, rot, R, cx, cy) => {
      const latR = (lat * Math.PI) / 180;
      const lonR = (lon * Math.PI) / 180 + rot;
      const x = R * Math.cos(latR) * Math.sin(lonR);
      const y = R * Math.sin(latR);
      const z = R * Math.cos(latR) * Math.cos(lonR);
      const y2 = y * Math.cos(TILT) - z * Math.sin(TILT);
      const z2 = y * Math.sin(TILT) + z * Math.cos(TILT);
      return { sx: cx + x, sy: cy - y2, z: z2 };
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      if (!reduced) rotation += 0.0015;

      ctx.clearRect(0, 0, width, heightPx);

      const cx = width / 2;
      const cy = heightPx / 2;
      const R = Math.min(width, heightPx) * 0.42;

      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 1; i <= 2; i++) {
        const ry = R * (1 - i * 0.32);
        ctx.beginPath();
        ctx.ellipse(cx, cy, R, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.045)";
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 0.55, R, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.045)";
      ctx.stroke();

      const dots = dotsRef.current || [];
      for (let i = 0; i < dots.length; i++) {
        const [lat, lon] = dots[i];
        const p = project(lat, lon, rotation, R, cx, cy);
        if (p.z <= 0) continue;
        const depth = p.z / R;
        const size = 0.5 + depth * 1.15;
        ctx.globalAlpha = 0.22 + depth * 0.68;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    resize();
    raf = requestAnimationFrame(draw);

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    let io;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => entries.forEach((en) => (visible = en.isIntersecting)),
        { threshold: 0.05 }
      );
      io.observe(wrap);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (io) io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [color]);

  return (
    <div className="gng-wrap">
      <StatCallout className="gng-box" color={color} {...leftStat} />

      <div ref={wrapRef} className="gng-globe" style={{ height }}>
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
      </div>

      <StatCallout className="gng-box" color={color} {...rightStat} />

      <style>{`
        .gng-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 22px;
          flex-wrap: wrap;
        }
        .gng-globe {
          position: relative;
          width: min(100%, 520px);
          flex: 1 1 320px;
        }
        @media (max-width: 860px) {
          .gng-wrap { flex-direction: column; }
          .gng-globe { flex-basis: auto; }
        }
      `}</style>
    </div>
  );
}
