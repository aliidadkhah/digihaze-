"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, navArrowStyle } from "./ui";

const BANNER_SLIDES = [
  {
    id: "b1",
    color: "#2F86FF",
    eyebrow: "پیشنهاد لحظه‌ای",
    title: "تا ۲۵٪ تخفیف روی مایع‌های یخی",
    cta: "مشاهده تخفیف‌ها",
    href: "/shop?category=eliquid",
    img: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "b2",
    color: "#FF8A3D",
    eyebrow: "تازه رسیده",
    title: "کیت جدید Nova Mesh رسید",
    cta: "مشاهده محصول",
    href: "/product/p3",
    img: "https://images.unsplash.com/photo-1560807707-8cc77767d783?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "b3",
    color: "#22E5C9",
    eyebrow: "مزیت خرید",
    title: "ارسال رایگان بالای ۵۰۰ هزار تومان",
    cta: "شروع خرید",
    href: "/shop",
    img: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function BannerCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % BANNER_SLIDES.length), 4500);
    return () => clearInterval(t);
  }, [paused]);

  const go = (i) => setIdx((i + BANNER_SLIDES.length) % BANNER_SLIDES.length);

  return (
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 20px 0" }}>
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="banner-slider"
        style={{ position: "relative", width: "100%", borderRadius: 18, overflow: "hidden", border: "1px solid var(--surface2)", aspectRatio: "16 / 5", boxSizing: "border-box" }}
      >
        <div style={{ display: "flex", width: "100%", height: "100%", direction: "ltr", transform: `translateX(-${idx * 100}%)`, transition: "transform 0.6s cubic-bezier(.65,0,.35,1)" }}>
          {BANNER_SLIDES.map((s) => (
            <button
              key={s.id}
              onClick={() => router.push(s.href)}
              style={{ position: "relative", flex: "0 0 100%", width: "100%", maxWidth: "100%", height: "100%", border: "none", padding: 0, margin: 0, cursor: "pointer", display: "block", boxSizing: "border-box" }}
            >
              <img src={s.img} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, color-mix(in srgb, var(--bg) 80%, transparent) 0%, transparent 35%)" }} />
              <div dir="rtl" style={{ position: "absolute", bottom: 14, right: 16, left: 16, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 10, textAlign: "right" }}>
                <div style={{ minWidth: 0, flex: "1 1 auto", overflow: "hidden" }}>
                  <div style={{ marginBottom: 6 }}>
                    <Badge bg={s.color}>{s.eyebrow}</Badge>
                  </div>
                  <div style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: "clamp(13px,2.4vw,20px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.title}
                  </div>
                </div>
                <span style={{ flexShrink: 0, background: s.color, color: "var(--ink)", borderRadius: 10, padding: "7px 14px", fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 12, whiteSpace: "nowrap" }}>
                  {s.cta}
                </span>
              </div>
            </button>
          ))}
        </div>

        <button onClick={() => go(idx + 1)} className="banner-arrow" style={{ ...navArrowStyle("right"), top: "50%" }}>
          <ChevronRight size={18} color="#120C22" />
        </button>
        <button onClick={() => go(idx - 1)} className="banner-arrow" style={{ ...navArrowStyle("left"), top: "50%" }}>
          <ChevronLeft size={18} color="#120C22" />
        </button>

        <div style={{ position: "absolute", top: 12, right: "50%", transform: "translateX(50%)", display: "flex", gap: 7, zIndex: 2 }}>
          {BANNER_SLIDES.map((s, i) => (
            <button key={s.id} onClick={() => go(i)} style={{ width: i === idx ? 22 : 8, height: 8, borderRadius: 999, border: "none", background: i === idx ? s.color : "#ffffff77", cursor: "pointer", transition: "all 0.3s ease" }} />
          ))}
        </div>
      </div>
    </section>
  );
}
