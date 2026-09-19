"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "./Providers";

export function FlavorCloud({ color = "#4F7FFF", size = 520, style }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        width: `clamp(150px, 42vw, ${size}px)`,
        height: `clamp(150px, 42vw, ${size}px)`,
        borderRadius: "50%",
        background: `radial-gradient(circle at 40% 40%, ${color}f2 0%, ${color}b3 22%, ${color}4d 45%, transparent 72%)`,
        filter: "blur(34px)",
        mixBlendMode: "screen",
        transition: "background 0.6s ease",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}

/* ---------------------------------------------------------
   فضا + ستاره‌های دنباله‌دار (canvas)
   --------------------------------------------------------- */

export function SpaceField({ density = 1, comets = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars = [];
    let shooters = [];
    let raf = null;
    let last = 0;
    let nextShooter = 800;
    let visible = true;

    const rand = (min, max) => min + Math.random() * (max - min);

    const buildStars = () => {
      const area = width * height;
      const count = Math.min(
        260,
        Math.round((area / 9000) * density)
      );

      stars = Array.from({ length: count }).map(() => {
        const layer = Math.random();
        const depth = layer < 0.6 ? 0.35 : layer < 0.9 ? 0.7 : 1;

        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: depth * rand(0.45, 1.25),
          depth,
          alpha: rand(0.25, 0.9),
          twinkleSpeed: rand(0.6, 2.1),
          phase: Math.random() * Math.PI * 2,
          hue:
            Math.random() < 0.12
              ? "255, 190, 130"
              : Math.random() < 0.2
              ? "175, 210, 255"
              : "255, 255, 255",
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    };

    const spawnShooter = () => {
      /* از بالا-راست به سمت پایین-چپ */
      const angle = rand(0.28, 0.46); // رادیان، شیب ملایم
      const speed = rand(620, 1000);

      shooters.push({
        x: rand(width * 0.35, width * 1.15),
        y: rand(-height * 0.1, height * 0.55),
        vx: -Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: rand(90, 220),
        life: 0,
        ttl: rand(0.9, 1.6),
        width: rand(1.1, 2.1),
        warm: Math.random() < 0.25,
      });
    };

    const drawStars = (t) => {
      for (const s of stars) {
        const tw =
          0.55 + 0.45 * Math.sin(t * s.twinkleSpeed + s.phase);

        ctx.globalAlpha = s.alpha * tw;
        ctx.fillStyle = `rgb(${s.hue})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        /* درخشش ملایم فقط برای ستاره‌های نزدیک */
        if (s.depth > 0.85) {
          ctx.globalAlpha = s.alpha * tw * 0.28;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const drawShooter = (s) => {
      const fade =
        s.life < 0.18
          ? s.life / 0.18
          : Math.max(0, 1 - (s.life - 0.18) / (s.ttl - 0.18));

      const mag = Math.hypot(s.vx, s.vy) || 1;
      const tailX = s.x - (s.vx / mag) * s.len;
      const tailY = s.y - (s.vy / mag) * s.len;

      const head = s.warm ? "255, 205, 150" : "235, 245, 255";

      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, `rgba(${head}, 0)`);
      grad.addColorStop(0.65, `rgba(${head}, ${0.35 * fade})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${0.95 * fade})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = s.width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      /* سر درخشان */
      const glow = ctx.createRadialGradient(
        s.x,
        s.y,
        0,
        s.x,
        s.y,
        s.width * 6
      );
      glow.addColorStop(0, `rgba(255, 255, 255, ${0.9 * fade})`);
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.width * 6, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;

      if (!last) last = now;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;

      const t = now / 1000;

      ctx.clearRect(0, 0, width, height);

      /* حرکت آرام ستاره‌ها (پارالاکس) */
      if (!reduced) {
        for (const s of stars) {
          s.x -= s.depth * 5 * dt;
          s.y += s.depth * 2.2 * dt;

          if (s.x < -4) {
            s.x = width + 4;
            s.y = Math.random() * height;
          }
          if (s.y > height + 4) {
            s.y = -4;
            s.x = Math.random() * width;
          }
        }
      }

      drawStars(reduced ? 0 : t);

      if (comets && !reduced) {
        nextShooter -= dt * 1000;
        if (nextShooter <= 0) {
          spawnShooter();
          nextShooter = rand(1400, 4200);
        }

        shooters = shooters.filter((s) => s.life < s.ttl);

        for (const s of shooters) {
          s.life += dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          drawShooter(s);
        }
      }
    };

    resize();

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(resize)
        : null;
    if (ro) ro.observe(canvas);
    else window.addEventListener("resize", resize);

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              visible = entries[0].isIntersecting;
              if (visible) last = 0;
            },
            { threshold: 0 }
          )
        : null;
    if (io) io.observe(canvas);

    raf = requestAnimationFrame(frame);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
      if (io) io.disconnect();
    };
  }, [density, comets]);

  return (
    <div className="space-field" aria-hidden>
      <div className="space-deep" />
      <canvas ref={canvasRef} />
    </div>
  );
}

/* افق نورانی سیاره — پشت وکتور ویپ */
export function HaloHorizon({ style }) {
  return (
    <div className="halo-wrap" aria-hidden style={style}>
      <div className="halo-bloom" />
      <div className="halo-planet" />
    </div>
  );
}

/* ستون نور بالا و پایین یک باکس */
export function LightBeams() {
  return (
    <>
      <span className="beam beam-top" aria-hidden />
      <span className="beam beam-bottom" aria-hidden />
    </>
  );
}

export function VaporParticles({ color }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }).map(() => ({
        left: Math.round(Math.random() * 100),
        size: 6 + Math.round(Math.random() * 16),
        duration: 7 + Math.random() * 8,
        delay: Math.random() * 8,
        drift: (Math.random() - 0.5) * 80,
        opacity: 0.15 + Math.random() * 0.35,
      })),
    []
  );
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            bottom: -40,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color}${Math.round(p.opacity * 255)
              .toString(16)
              .padStart(2, "0")}, transparent 70%)`,
            filter: "blur(1px)",
            animation: `riseUp ${p.duration}s ease-in ${p.delay}s infinite`,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

/* signature hero visual: a recognizable pod-vape device, not a bottle */
export function FloatingBottle({ color }) {
  const themeCtx = useTheme();
  const isLight = themeCtx?.theme === "light";

  return (
    <div
      style={{
        position: "relative",
        width: 130,
        height: 240,
        margin: "0 auto",
        animation: "floatY 4.5s ease-in-out infinite",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -30,
          borderRadius: "50%",
          background: isLight
            ? `radial-gradient(circle, ${color}77 0%, ${color}33 35%, transparent 70%)`
            : `radial-gradient(circle, ${color}cc 0%, ${color}55 35%, transparent 70%)`,
          filter: "blur(18px)",
          mixBlendMode: isLight ? "multiply" : "screen",
          animation: "pulseGlow 2.8s ease-in-out infinite",
        }}
      />
      <svg
        viewBox="0 0 120 230"
        width="130"
        height="240"
        style={{
          position: "relative",
          display: "block",
          filter: isLight
            ? `drop-shadow(0 18px 22px ${color}88)`
            : `drop-shadow(0 24px 30px ${color}55)`,
        }}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={isLight ? "#3a3160" : "#2a2050"} />
            <stop offset="100%" stopColor={isLight ? "#221a40" : "#150f2c"} />
          </linearGradient>
          <linearGradient id="winGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.85" />
            <stop offset="100%" stopColor={color} stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <path d="M48 0 h24 a4 4 0 0 1 4 4 v14 h-32 v-14 a4 4 0 0 1 4-4 z" fill="#F5F1FF" />
        <rect x="42" y="18" width="36" height="8" rx="2" fill={color} />
        <rect x="18" y="26" width="84" height="164" rx="20" fill="url(#bodyGrad)" stroke={`${color}88`} strokeWidth="2" />
        <rect x="32" y="44" width="56" height="30" rx="6" fill="#0b0818" stroke={`${color}55`} strokeWidth="1.5" />
        <text x="60" y="64" textAnchor="middle" fontSize="12" fontFamily="Vazirmatn" fontWeight="800" fill={color}>
          70W
        </text>
        <rect x="30" y="86" width="60" height="74" rx="10" fill="#0b0818" stroke={`${color}66`} strokeWidth="1.5" />
        <rect x="35" y="118" width="50" height="37" rx="7" fill="url(#winGrad)" />
        <circle cx="60" cy="176" r="10" fill="#0b0818" stroke={color} strokeWidth="2" />
        <circle cx="60" cy="176" r="4" fill={color} />
      </svg>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: -6,
            left: `calc(50% + ${(i - 1) * 14}px)`,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isLight ? `${color}cc` : `${color}99`,
            filter: "blur(2px)",
            animation: `riseUp ${3.5 + i}s ease-in ${i * 0.9}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------------- Scroll-linked morphing background ---------------- */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setY(window.scrollY || window.pageYOffset || 0);
        raf = null;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return y;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    setIsMobile(mq.matches);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange);
    };
  }, []);
  return isMobile;
}

const MORPH_BLOBS = [
  { color: "#4F7FFF", top: "2%", side: "right", size: 380, speed: 0.16, rotSpeed: 0.05, phase: 0 },
  { color: "#FF7A1F", top: "55%", side: "left", size: 420, speed: 0.2, rotSpeed: -0.04, phase: 2 },
  { color: "#9B5CFF", top: "108%", side: "right", size: 340, speed: 0.14, rotSpeed: 0.07, phase: 4 },
  { color: "#B6FF1A", top: "160%", side: "left", size: 360, speed: 0.18, rotSpeed: -0.06, phase: 1 },
];

export function ScrollMorphBackground() {
  const y = useScrollY();
  const isMobile = useIsMobile();
  const sizeMult = isMobile ? 0.6 : 1;
  const alphaCore = isMobile ? "55" : "80";
  const alphaMid = isMobile ? "14" : "26";
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden", pointerEvents: "none" }}>
      {MORPH_BLOBS.map((b, i) => {
        const t = y / 260 + b.phase;
        const translateY = y * b.speed;
        const rotate = y * b.rotSpeed;
        const scale = 1 + Math.sin(t) * 0.16;
        const r1 = 50 + Math.sin(t) * 22;
        const r2 = 50 - Math.sin(t * 1.3) * 22;
        const r3 = 50 + Math.cos(t) * 22;
        const r4 = 50 - Math.cos(t * 1.3) * 22;
        const r5 = 50 - Math.cos(t * 0.8) * 18;
        const r6 = 50 + Math.sin(t * 0.8) * 18;
        const r7 = 50 - Math.sin(t * 1.1) * 18;
        const r8 = 50 + Math.cos(t * 1.1) * 18;
        const renderedSize = Math.round(b.size * sizeMult);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: b.top,
              [b.side]: `-${renderedSize * 0.25}px`,
              width: renderedSize,
              height: renderedSize,
              background: `radial-gradient(circle at 35% 35%, ${b.color}${alphaCore} 0%, ${b.color}${alphaMid} 42%, transparent 70%)`,
              filter: "blur(50px)",
              mixBlendMode: "screen",
              borderRadius: `${r1}% ${r2}% ${r3}% ${r4}% / ${r5}% ${r6}% ${r7}% ${r8}%`,
              transform: `translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
              willChange: "transform, border-radius",
            }}
          />
        );
      })}
    </div>
  );
}
