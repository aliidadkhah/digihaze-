"use client";

import { useEffect, useMemo, useState } from "react";

export function FlavorCloud({ color = "#2F86FF", size = 520, style }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${color}55, transparent 70%)`,
        filter: "blur(40px)",
        transition: "background 0.6s ease",
        pointerEvents: "none",
        ...style,
      }}
    />
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
          background: `radial-gradient(circle, ${color}66, transparent 70%)`,
          filter: "blur(20px)",
          animation: "pulseGlow 2.8s ease-in-out infinite",
        }}
      />
      <svg
        viewBox="0 0 120 230"
        width="130"
        height="240"
        style={{ position: "relative", display: "block", filter: `drop-shadow(0 24px 30px ${color}55)` }}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2a2050" />
            <stop offset="100%" stopColor="#150f2c" />
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
        <rect x="26" y="190" width="68" height="16" rx="6" fill="#0b0818" />
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
            background: `${color}99`,
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

const MORPH_BLOBS = [
  { color: "#2F86FF", top: "0%", side: "right", size: 460, speed: 0.18, rotSpeed: 0.05, phase: 0 },
  { color: "#FF8A3D", top: "35%", side: "left", size: 520, speed: 0.28, rotSpeed: -0.04, phase: 2 },
  { color: "#22E5C9", top: "70%", side: "right", size: 400, speed: 0.12, rotSpeed: 0.07, phase: 4 },
  { color: "#C6FF3D", top: "110%", side: "left", size: 440, speed: 0.22, rotSpeed: -0.06, phase: 1 },
];

export function ScrollMorphBackground() {
  const y = useScrollY();
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
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: b.top,
              [b.side]: `-${b.size * 0.25}px`,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle at 35% 35%, ${b.color}3d, transparent 70%)`,
              filter: "blur(46px)",
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
