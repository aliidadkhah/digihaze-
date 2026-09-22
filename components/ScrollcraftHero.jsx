"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SpaceField } from "./visuals";
import { useTheme } from "./Providers";

/* =========================================================
   دیتای آماری هدر (اعداد شمارشی)
========================================================= */
const STATS = [
  { value: 200, suffix: "+", label: "مشتری راضی" },
  { value: 10, suffix: "+", label: "طعم متنوع" },
  { value: 24, suffix: "h", label: "ارسال سریع" },
];

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
          fontFamily: "var(--font-primary)",
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
   تیتر با ریویل کلمه‌به‌کلمه — یک‌بار، زمان‌محور (نه وابسته به اسکرول)
   هر کلمه با یک تأخیر ثابت (ms) ظاهر می‌شود، نرم و بدون پرش
========================================================= */
function RevealWords({ words, revealed, startDelay = 0, stepDelay = 55, gradient = false }) {
  return words.map((w, i) => {
    const delay = startDelay + i * stepDelay;
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
            transform: revealed ? "translateY(0)" : "translateY(100%)",
            opacity: revealed ? 1 : 0,
            transition: `transform 0.6s cubic-bezier(.22,1,.36,1) ${delay}ms, opacity 0.5s ease ${delay}ms`,
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
   دستگاه ویپ سیگنچر — همیشه پررنگ، جلوی ستاره‌های دنباله‌دار
   (مستقل از هر انیمیشن fade، هرگز کم‌رنگ نمی‌شود)
========================================================= */
function FloatingDevice({ color = "#9B5CFF", isLight = false }) {
  // نکته: قبلاً این کلاهک بالای دستگاه (دهانی) همیشه با یک سفید-بنفش
  // ثابت (#F5F1FF) پر می‌شد. تو حالت تیره روی پس‌زمینه‌ی مشکی خوب دیده
  // می‌شد، اما تو لایت‌مود چون پس‌زمینه‌ی صفحه هم روشنه، همین رنگ تقریباً
  // نامرئی می‌شد. الان تو لایت‌مود از یک رنگ تیره (هم‌خانواده‌ی بدنه)
  // استفاده می‌کنیم تا همیشه، مستقل از تم، قابل دیدن باشه.
  const capFill = isLight ? "#2a2050" : "#F5F1FF";

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
          transition: "background 0.5s ease",
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
          transition: "filter 0.5s ease",
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
        <path
          d="M48 0 h24 a4 4 0 0 1 4 4 v14 h-32 v-14 a4 4 0 0 1 4-4 z"
          fill={capFill}
          style={{ transition: "fill 0.4s ease" }}
        />
        <rect x="42" y="18" width="36" height="8" rx="2" fill={color} style={{ transition: "fill 0.4s ease" }} />
        <rect x="18" y="26" width="84" height="164" rx="20" fill="url(#scBodyGrad)" stroke={`${color}99`} strokeWidth="2" style={{ transition: "stroke 0.4s ease" }} />
        <rect x="30" y="86" width="60" height="74" rx="10" fill="#0b0818" stroke={`${color}77`} strokeWidth="1.5" style={{ transition: "stroke 0.4s ease" }} />
        <rect x="35" y="118" width="50" height="37" rx="7" fill="url(#scWinGrad)" />
        <circle cx="60" cy="176" r="10" fill="#0b0818" stroke={color} strokeWidth="2" style={{ transition: "stroke 0.4s ease" }} />
        <circle cx="60" cy="176" r="4" fill={color} style={{ transition: "fill 0.4s ease" }} />
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
            transition: "background 0.4s ease",
          }}
        />
      ))}
    </div>
  );
}

/* =========================================================
   هیروی سبک Scrollcraft
   بدون اسکرول‌جک؛ ورود یک‌بار و زمان‌محور، دقیقاً 100vh
   بلافاصله بعدش سکشن دسته‌بندی شروع می‌شود (بدون فاصله‌ی اضافه)
========================================================= */
export default function ScrollcraftHero({ deviceColor }) {
  const sectionRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const [scrolledPast, setScrolledPast] = useState(false);
  const themeCtx = useTheme();
  const isLight = themeCtx?.theme === "light";

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setRevealed(true);
      return;
    }

    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolledPast(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="home-title"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <SpaceField />

      {/* لایه‌ی عمق ثابت */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          // این گرادیان قبلاً همیشه به رنگ تیره‌ی #000410 ثابت بود، حتی
          // تو لایت‌مود — همون چیزیه که باعث می‌شد کل هیرو صرف‌نظر از
          // تم، تیره/سیاه دیده بشه. الان بر اساس تم صفحه رنگش عوض میشه.
          background: isLight
            ? "radial-gradient(circle at 50% 38%, transparent, #f7f5fb 62%)"
            : "radial-gradient(circle at 50% 38%, transparent, #000410 62%)",
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
          padding: "70px 20px",
          textAlign: "center",
        }}
      >
        {/* وکتور ویپ — همیشه پررنگ و همیشه جلوی ستاره‌های دنباله‌دار.
            وقتی کاربر روی یکی از باکس‌های دسته‌بندی هاور می‌کند، رنگ نور
            این دستگاه به رنگ همون دسته‌بندی تغییر می‌کند (deviceColor از
            HomeContent پاس داده می‌شود)؛ وقتی هاور نیست به بنفش پیش‌فرض
            برمی‌گردد. */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <FloatingDevice color={deviceColor || "#9B5CFF"} isLight={isLight} />
        </div>

        <div
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontFamily: "var(--font-primary)",
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
              fontFamily: "var(--font-primary)",
              fontWeight: 800,
              fontSize: "clamp(26px, 4.6vw, 46px)",
              lineHeight: 1.35,
              margin: "0 0 16px",
            }}
          >
            <RevealWords
              words={["دیجی", "هیز؛", "فروشگاه"]}
              revealed={revealed}
              startDelay={80}
              stepDelay={55}
            />
            <br />
            <RevealWords
              words={["پاد،", "سالت", "نیکوتین", "و", "کارتریج"]}
              revealed={revealed}
              startDelay={240}
              stepDelay={55}
              gradient
            />
          </h1>

          <p
            style={{
              color: "var(--text-lo)",
              fontSize: 16,
              lineHeight: 1.9,
              marginBottom: 30,
              opacity: revealed ? 1 : 0,
              transition: "opacity 0.6s ease 0.5s",
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
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(16px)",
              transition: "opacity .6s ease .62s, transform .6s ease .62s",
            }}
          >
            {STATS.map((s) => (
              <StatItem key={s.label} {...s} active={revealed} />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(18px)",
              transition: "opacity .6s ease .74s, transform .6s ease .74s",
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
                fontFamily: "var(--font-primary)",
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
                fontFamily: "var(--font-primary)",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              درباره ما
            </Link>
          </div>
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
          opacity: scrolledPast ? 0 : 1,
          transition: "opacity .3s ease",
          color: "var(--text-mut)",
          fontFamily: "var(--font-primary)",
          fontSize: 12,
        }}
      >
        اسکرول کنید
        <ChevronDown size={18} className="sc-bounce" />
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
