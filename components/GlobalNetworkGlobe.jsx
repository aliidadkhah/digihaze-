"use client";

import { useEffect, useRef } from "react";

/* ============================================================
   نقشه‌ی نقطه‌ای دنیا (Global Network Globe)

   این نسخه از یک نقشه‌ی واقعی زمین (بردار کشورهای دنیا، تفکیک‌شده
   به صورت یک بیت‌مپ فشرده‌ی خشکی/دریا) استفاده می‌کنه، نه بیضی‌های
   تقریبی. بیت‌مپ یک‌بار در پایین این فایل به صورت base64 جاسازی
   شده (هر بیت = یک خانه‌ی ۱٫۵ درجه‌ای از عرض/طول جغرافیایی، خشکی=۱
   دریا=۰) و در زمان اجرا decode و روی کانواس با نقطه رسم می‌شه.
============================================================ */

// --- متادیتای گرید بیت‌مپ خشکی/دریا ---
const MASK_LAT_MIN = -78.0;
const MASK_LAT_STEP = 1.5;
const MASK_ROWS = 105;
const MASK_LON_MIN = -180.0;
const MASK_LON_STEP = 1.5;
const MASK_COLS = 240;

// base64 یک بیت‌مپ فشرده از خشکی‌های دنیا (خروجی گرفته‌شده از نقشه‌ی
// برداری واقعی کشورها، نه بیضی‌های دستی)
const LAND_MASK_B64 =
  "AAH////////+AADAf/////////////////////wAAAAD////////gAAAB/////////////////////gAAAAAP///9////AAAAAf///////////////////wAAAAAAAmID/+5/wAAAAP///////////////////+AAAAAAAAADwAD7wAAAAB////////8///////////gAAAAAAAAAAAA/gAAAAAADv/////+f/////////wAAAAAAAAAAAAAXAAAAAAAAAADn//+D////////wAAAAAAAAAAAAAAGAAAAAAAAAAAAf+QAf//////wAAAAAAAAAAAAAAADgAAAAAAAAAAAB4AAAAMGAAgAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4AAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAD+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB+AAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAA+AAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAB+AAAAAAAAAAAAAAAAAAAAAAAYAAQAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAA/gAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAB/8AAAAAAAAAAAAAAAAAAAAAD8AAFAAAAAAAAAAAA/8AAAAAAAAAAAAAAAAAAAAAH+AAIAAAAAAAAAAAA/9AAAAAAAAQAAAAAAAAAAwAP+AAQAAAAAAAAAAAAf/gAAAAAAA/gAAAAAAAAB+A//AAAAAAAAAAAAAAAf/wAAAAAAA/wAAAAAAAAB/7//AAAAAAAAAAAAAAAf/4AAAAAAA/4AAAAAAAAB////gAAAAAAAAAAAAAAf/8AAAAAAB/8AAAAAAAAB////gAAAAAAAAAAAAAAf/8AAAAAAD/8AAAAAAAAD////gAAAAAAAAAAAAAAf/8AAAAAAD/8AAAAAAAAD////AAAAAAAAAAAAAAAf//AAAAAAD//AwAAAAAAD////AAAAAAAAAAAAAAAf//4AAAAAD//BwAAAAAAD///+AAAAAAAAAAAAAAAP//4AAAAAH//A4AAAAAAA///8AIAAAAAAAAAAAAAP//8AAAAAH//A4AAAAAAAH//4AAAAAAAAAAAAAAAf//8AAAAAP//g4AAAAAAAD//wAABgAAAAAAAAAAA///8AAAAAP//48AAAAAAAD/5gAABAAAAAAAAAAAD///+AAAAAP//8MAAAAAAAA/hgAEAAAAAAAAAAAAH///+AAAAAH//8EAAAAAAAAHhAAAAAAAAAAAAAAAH///+AAAAAH//4AAAAAAAAABxAAAAAAAAAAAAAAAP////AAAAAH//4AAAAAAAAAABCAgAAAAAAAAAAAAP////gAAAAH//4AAAAAAAAhADMAAAAAAAAAAAAAAf////gAAAAH//4AAAAAAA8AAP4AAAAAAAAAAAAAA/////gAAAAH//wAAAAAABAAAH6AAAAAAAAAAAAAA/////AAAAAP//4AAAAAAGAOAfxAAAAAAAAAAAAAAf///8AAAAAf//4AAAAAAOPMpeBAAAAAAAAAAAAAA////gAAAAA///8AAAAAAcPMDIAAAAAAAAAAAAAAAf//8AAAAAA///+AAAAAAcfoQAAAAAAAAAAAAAAAAP//4AAAAAAf///AAAAAA8fgQAAAAAAAAAAAAAAAAP//4AAAAAAf///wAAAABsHgAAAAAAAAAAAAAAAAAH//wAAAAAC////wAAAADYDwAAAAAAAAAAAAAAAAAH//gAAAB/j////4AAAAAYAgAAAAAAAAAAAAAAAAAv/8AAAAD//////8AAAgAAADgAAAAAAAAAAAAAAAB//wAAAAD//////8AAGgAiAAgAAAAAAAAAAAAAAAGD/wAAAAH//////8AAHAAjACAAAAAAAAAAAAAAAAGAwAAAAAf/////+CAAHAAngAAAAAAAAAAAAAAAAAeAAAAAAAf//////wAAPAA/gCAAAAAAAAAAAAAAAB+AAAAAAAf/////58AAPAA/gMAAAAAAAAAAAAAAAfgAAAAAAAf/////5+AAfgH/AEAAAAAAAAAAAAAAD/wMCAAAAAP/////z/wAfwH/AEAAAAAAAACAAAAAPwwAwAAAAAf/////j/4Af4H+QAAAAAAAAACAAAAAPw4MAAAAAAf/////n/8Bf+P/QAAAAAAAAAAAAAAAPgC4AAAAAAf/////v/8B////+AAAAAAAAAAAAAAAfgAIAAAAAAP/////P/4H/////kAAAAAAAAAAAAAC/wAgAAAAAAP/////f+T//////wAAAAAAAAAAAAAN/wBoAAAAAAH////+/8///////4AAAAAAAAAAAAAL/wBgAAAAAAB////+/5///////8AAAAAAAAAAAAAX//lAAAAAAAA//////////////8AAAAAAAAAAAAAX///AAAAAAAA//+Pt/////////8EAAAAAAAAAAAA////gAAAAAAA//4AA/////////4GAAAAAAAAAAAD////4AAAAAAAP/gAA/////////4CwAAAAAAAAAAH////8AAAAAAAI/wAA/////////4YcAAAAAAAAAAH////8AAAAAAAfAGEf/8///////8YcAAAAAAAAAAP////+AAAAAAA/ABM//4///////gwCAAAAAAAAAAf////+AAAAAAA/gj8f/9///////74CAAAAAAAAAAP/////wAAAAAA/4ufjD5////////4CAAAAAAAAAAf/////wAAAAAAf+d/gHx/////////DwAAAAAAAAAP/////9gAAAAAB/7/xfx/////////xAAAAAAAAAAP/////+gAAAAAB////P4/////////4AAAAAAAAAAX/////+HgAAAAH///////////////9AAAAAAAAAAv/////4jgAAAAB///////////////9gAAAAAAAAB///////6AAAAAH///////////////9AAAAAAAAAJ/////P/+AAAAAz3///////////////AMAAAAAAAL/////P/+AAAAAzA//////////////9AOAAAAgAAP////8P/4AAAAAGAsH////////////gAPAAAANAAP////gH/wAAAAAOAnv////////////4APgAAAHAD////8AP7gAAAAAEBPD////////////8ADgAAF/cv////4AHxAAAAAAAD/gf/////////////g4AAD///////8APgADwAAAAD/H//////////////5PwAB////////BAeAHwAAAAB/n/////////////////CCf///////3P+AP4AD4AAf7/f//////////////+/n////////4B7gf/AN4AAH9/D///////////////4B/////////E/Af/wAAAAD//9v//v///////////gD/////3ED3H4AP//gAAAA//gAhzv/////////+/AA/4ABAH8Of/4A///gAAAAD4AAAHv////////+AAAAAAAA9/x0/+AB///4AAAAAAABwDvf////wH8AAAAAAAAAfgZ/b4AB///+AAAAAAAAwAA////xwDAAAAAAAAAAAGAt/gAD///+AAAAAAAAMAAD//4AAPmAAAAAAAAAHRDvfgP////+AAAAAAAAB8AAA/4AAAAAAAAAAAAAAGAcX4/////+AAADmAAAAAAAAAAAAAAAAA";

// decode سبک base64 -> Uint8Array که هم روی مرورگر و هم روی سرور
// (بدون وابستگی به atob یا Buffer) کار می‌کنه
function decodeBase64(b64) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  const clean = b64.replace(/=+$/, "");
  const len = clean.length;
  const bytesLen = Math.floor((len * 6) / 8);
  const bytes = new Uint8Array(bytesLen);

  let bitBuffer = 0;
  let bitCount = 0;
  let byteIndex = 0;
  for (let i = 0; i < len; i++) {
    bitBuffer = (bitBuffer << 6) | lookup[clean.charCodeAt(i)];
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes[byteIndex++] = (bitBuffer >> bitCount) & 0xff;
    }
  }
  return bytes;
}

let landMaskBytes = null;
function getLandMaskBytes() {
  if (!landMaskBytes) landMaskBytes = decodeBase64(LAND_MASK_B64);
  return landMaskBytes;
}

function getBit(bytes, index) {
  const byte = bytes[index >> 3];
  return (byte >> (7 - (index & 7))) & 1;
}

// آیا نقطه‌ی (lat, lon) روی خشکیه؟ نزدیک‌ترین خانه‌ی گرید رو چک می‌کنه
function isLand(lat, lon) {
  const bytes = getLandMaskBytes();

  let row = Math.round((lat - MASK_LAT_MIN) / MASK_LAT_STEP);
  if (row < 0) row = 0;
  if (row > MASK_ROWS - 1) row = MASK_ROWS - 1;

  let normLon = ((lon - MASK_LON_MIN) % 360 + 360) % 360;
  let col = Math.round(normLon / MASK_LON_STEP) % MASK_COLS;

  const index = row * MASK_COLS + col;
  return getBit(bytes, index) === 1;
}

function buildDots(step = 3) {
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
          fontFamily: "var(--font-primary)",
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
          fontFamily: "var(--font-primary)",
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
  color = "#108de2",
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

    if (!dotsRef.current) dotsRef.current = buildDots(3);

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
