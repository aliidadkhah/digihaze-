"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SpaceField } from "./visuals";

/* =========================================================
   دیتای آماری هدر (اعداد شمارشی)
========================================================= */
const STATS = [
  { value: 12000, suffix: "+", label: "مشتری راضی" },
  { value: 60, suffix: "+", label: "طعم متنوع" },
  { value: 24, suffix: "h", label: "ارسال سریع" },
];

/* =========================================================
   پیشرفت اسکرول داخل یک سکشن بلند (section = تایم‌لاین)
========================================================= */
function useSectionProgress(ref) {
  const [progress, setProgress] = useState(0);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const el = ref.current;
    if (!el) return;

    let raf = null;

    const measure = () => {
      raf = null;
      if (reducedRef.current) {
        setProgress(1);
        return;
      }
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const total = rect.height - vh;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      setProgress(p);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);

  return progress;
}

/* =========================================================
   شمارنده‌ی عدد (وقتی وارد دید می‌شود اجرا می‌شود)
========================================================= */
function useCountUp(target, active, duration = 1300) {
  const [val, setVal] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;
    let raf = null;
    let start = null;

    const step = (t) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return val;
}

function StatItem({ value, suffix, label, active }) {
  const n = useCountUp(value, active);
  return (
    <div style={{ textAlign: "center", minWidth: 84 }}>
      <div
        style={{
          fontFamily: "Vazirmatn",
          fontWeight: 800,
          fontSize: "clamp(20px, 3vw, 30px)",
          color: "var(--text-hi)",
          direction: "ltr",
        }}
      >
        {n.toLocaleString("en-US")}
        <span style={{ color: "var(--neon-teal)" }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-mut)", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

/* =========================================================
   تیتر با ریویل کلمه‌به‌کلمه (ماسک) هماهنگ با اسکرول
========================================================= */
function ScrollWords({ words, progress, startAt = 0, stagger = 0.03, span = 0.16, gradient = false }) {
  return words.map((w, i) => {
    const wp = Math.min(1, Math.max(0, (progress - (startAt + i * stagger)) / span));
    const eased = 1 - Math.pow(1 - wp, 3);
    return (
      <span
        key={i}
        style={{
          display: "inline-block",
          overflow: "hidden",
          verticalAlign: "top",
          marginInlineEnd: "0.28em",
        }}
      >
        <span
          className={gradient ? "brand-gradient-text" : undefined}
          style={{
            display: "inline-block",
            transform: `translateY(${(1 - eased) * 100}%)`,
            opacity: 0.15 + eased * 0.85,
            transition: "transform 0.05s linear, opacity 0.05s linear",
            textShadow: gradient ? "0 0 34px #9B5CFFaa" : undefined,
          }}
        >
          {w}
        </span>
      </span>
    );
  });
}

/* =========================================================
   دستگاه ویپ سیگنچر — همون افکت بالا‌پایین رفتن نسخه‌ی اول
========================================================= */
function FloatingDevice({ color = "#9B5CFF" }) {
  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        width: 130,
        height: 240,
        margin: "0 auto 6px",
        animation: "scFloatY 4.5s ease-in-out infinite",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -30,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}cc 0%, ${color}55 35%, transparent 70%)`,
          filter: "blur(18px)",
          mixBlendMode: "screen",
          animation: "scPulseGlow 2.8s ease-in-out infinite",
        }}
      />
      <svg
        viewBox="0 0 120 230"
        width="130"
        height="240"
        style={{
          position: "relative",
          display: "block",
          filter: `drop-shadow(0 24px 30px ${color}55)`,
        }}
      >
        <defs>
          <linearGradient id="scBodyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2a2050" />
            <stop offset="100%" stopColor="#150f2c" />
          </linearGradient>
          <linearGradient id="scWinGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <path d="M48 0 h24 a4 4 0 0 1 4 4 v14 h-32 v-14 a4 4 0 0 1 4-4 z" fill="#F5F1FF" />
        <rect x="42" y="18" width="36" height="8" rx="2" fill={color} />
        <rect x="18" y="26" width="84" height="164" rx="20" fill="url(#scBodyGrad)" stroke={`${color}99`} strokeWidth="2" />
        <rect x="30" y="86" width="60" height="74" rx="10" fill="#0b0818" stroke={`${color}77`} strokeWidth="1.5" />
        <rect x="35" y="118" width="50" height="37" rx="7" fill="url(#scWinGrad)" />
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
            background: `${color}99`,
            filter: "blur(2px)",
            animation: `scRiseUp ${3.5 + i}s ease-in ${i * 0.9}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* =========================================================
   هیروی سبک Scrollcraft — اسکرول = تایم‌لاین
   سکشن بلند (220vh) با محتوای sticky در 100vh
========================================================= */
export default function ScrollcraftHero() {
  const sectionRef = useRef(null);
  const progress = useSectionProgress(sectionRef);

  const introP = Math.min(1, progress / 0.16);
  const statsActive = progress > 0.3;
  const ctaP = Math.min(1, Math.max(0, (progress - 0.36) / 0.14));
  const cueOpacity = Math.max(0, 1 - progress / 0.06);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="home-title"
      style={{ position: "relative", height: "150vh" }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SpaceField />

        {/* لایه‌ی عمق: با اسکرول کمی روشن‌تر می‌شود */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 50% 38%, transparent, #000410 ${78 - progress * 26}%)`,
            pointerEvents: "none",
          }}
        />

        {/* محتوای متنی */}
        <div
          style={{
            position: "relative",
            zIndex: 3,
            maxWidth: 760,
            margin: "0 auto",
            padding: "0 20px",
            textAlign: "center",
            opacity: 0.35 + introP * 0.65,
            transform: `translateY(${(1 - introP) * 36}px)`,
          }}
        >
          <FloatingDevice color="#9B5CFF" />

          <span
            style={{
              display: "inline-block",
              fontFamily: "Vazirmatn",
              fontWeight: 700,
              fontSize: 12.5,
              letterSpacing: 0.3,
              color: "var(--neon-teal)",
              border: "1px solid #00FFD155",
              borderRadius: 999,
              padding: "6px 16px",
              marginBottom: 18,
              background: "#00FFD10f",
            }}
          >
            ضمانت اصالت کالا · ارسال به سراسر ایران
          </span>

          <h1
            id="home-title"
            style={{
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              fontSize: "clamp(26px, 4.6vw, 46px)",
              lineHeight: 1.35,
              margin: "0 0 16px",
            }}
          >
            <ScrollWords
              words={["دیجی", "هیز؛", "فروشگاه"]}
              progress={progress}
              startAt={0.01}
              stagger={0.014}
              span={0.08}
            />
            <br />
            <ScrollWords
              words={["پاد،", "سالت", "نیکوتین", "و", "کارتریج"]}
              progress={progress}
              startAt={0.05}
              stagger={0.014}
              span={0.08}
              gradient
            />
          </h1>

          <p
            style={{
              color: "var(--text-lo)",
              fontSize: 16,
              lineHeight: 1.9,
              marginBottom: 30,
            }}
          >
            محصولات را ببینید، مشخصات و قیمت را بررسی کنید و از میان
            دسته‌بندی‌های مختلف، محصول موردنظرتان را پیدا کنید.
          </p>

          <div
            style={{
              display: "flex",
              gap: 40,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 30,
              opacity: statsActive ? 1 : 0,
              transform: statsActive ? "translateY(0)" : "translateY(16px)",
              transition: "opacity .6s ease, transform .6s ease",
            }}
          >
            {STATS.map((s) => (
              <StatItem key={s.label} {...s} active={statsActive} />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
              opacity: 0.25 + ctaP * 0.75,
              transform: `translateY(${(1 - ctaP) * 18}px)`,
            }}
          >
            <Link
              href="/shop"
              className="pulse-btn brand-gradient-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "14px 30px",
                fontFamily: "Vazirmatn",
                fontWeight: 800,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              مشاهده فروشگاه
            </Link>

            <Link
              href="/about"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                color: "var(--text-hi)",
                border: "1px solid var(--border-soft)",
                borderRadius: 14,
                padding: "14px 30px",
                fontFamily: "Vazirmatn",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              درباره ما
            </Link>
          </div>
        </div>

        {/* نشانه‌ی اسکرول */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 26,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            opacity: cueOpacity,
            transition: "opacity .2s linear",
            color: "var(--text-mut)",
            fontFamily: "Vazirmatn",
            fontSize: 12,
          }}
        >
          اسکرول کنید
          <ChevronDown size={18} className="sc-bounce" />
        </div>
      </div>

      <style>{`
        @keyframes scFloatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes scPulseGlow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes scRiseUp {
          0% { transform: translateY(0); opacity: 0.9; }
          100% { transform: translateY(-70px); opacity: 0; }
        }
        .sc-bounce {
          animation: scBounce 1.6s ease-in-out infinite;
        }
        @keyframes scBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sc-bounce { animation: none; }
        }
      `}</style>
    </section>
  );
}
