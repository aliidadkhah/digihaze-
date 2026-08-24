"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame } from "lucide-react";
import { Badge, Reveal, Countdown } from "./ui";
import { FlavorCloud, VaporParticles, FloatingBottle } from "./visuals";
import ProductCard from "./ProductCard";
import BannerCarousel from "./BannerCarousel";
import { CATEGORIES, PRODUCTS } from "@/lib/data";

export default function HomeContent() {
  const router = useRouter();
  const featured = PRODUCTS.filter((p) => p.discount > 0 || p.badge);
  const saleItems = PRODUCTS.filter((p) => p.discount > 0);
  const weekEnd = useMemo(() => Date.now() + 1000 * 60 * 60 * 52, []);
  const [heroColor, setHeroColor] = useState("#2F86FF");
  const heroRef = useRef(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setParallax({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 30,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 30,
    });
  };

  return (
    <div>
      <BannerCarousel />

      {/* HERO */}
      <section ref={heroRef} onMouseMove={handleMouseMove} style={{ position: "relative", overflow: "hidden", padding: "90px 20px 70px", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${parallax.x}px, ${parallax.y}px)`, transition: "transform 0.3s ease-out" }}>
          <FlavorCloud color={heroColor} size={640} style={{ top: -160, right: "50%", transform: "translateX(50%)", animation: "driftA 14s ease-in-out infinite" }} />
          <FlavorCloud color="#22E5C9" size={340} style={{ top: 40, left: "8%", animation: "driftB 11s ease-in-out infinite" }} />
          <FlavorCloud color="#FF8A3D" size={300} style={{ top: 120, right: "6%", animation: "driftA 16s ease-in-out infinite reverse" }} />
        </div>

        <VaporParticles color={heroColor} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 760, margin: "0 auto" }}>
          <FloatingBottle color={heroColor} />

          <div className="hero-reveal" style={{ animationDelay: "0.05s" }}>
            <Badge bg="#22E5C9">فصل جدید طعم‌ها رسید 🌫️</Badge>
          </div>
          <h1 className="hero-reveal" style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: "clamp(32px, 6vw, 56px)", lineHeight: 1.25, margin: "20px 0 16px", animationDelay: "0.16s" }}>
            هر پاف، یک <span style={{ color: "#2F86FF", textShadow: "0 0 30px #2F86FF66" }}>طعم</span> تازه
          </h1>
          <p className="hero-reveal" style={{ color: "var(--text-lo)", fontSize: 16, lineHeight: 1.9, marginBottom: 30, animationDelay: "0.28s" }}>
            سالت نیکوتین، جویس، پاد، ویپ،کویل و کارتریج با ارسال سریع به سراسر کشور.
            طعم مورد علاقه‌ت رو پیدا کن، بقیه‌ش با ماست
          </p>
          <div className="hero-reveal" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", animationDelay: "0.4s" }}>
            <Link href="/shop" className="pulse-btn" style={{ background: "#2F86FF", color: "var(--ink)", border: "none", borderRadius: 14, padding: "14px 30px", fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 15, textDecoration: "none" }}>
              مشاهده فروشگاه
            </Link>
            <Link href="/about" style={{ background: "transparent", color: "var(--text-hi)", border: "1px solid var(--border-soft)", borderRadius: 14, padding: "14px 30px", fontFamily: "Vazirmatn", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
              درباره ما
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORY STRIP */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "10px 20px 50px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 16 }}>
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.id} delay={0.08 * i}>
              <button
                onMouseEnter={() => setHeroColor(c.color)}
                onClick={() => router.push(`/shop?category=${c.id}`)}
                style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 16, padding: "22px 14px", cursor: "pointer", textAlign: "center", transition: "border-color 0.25s ease, transform 0.25s ease" }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--surface2)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c.color}22`, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Flame size={20} color={c.color} />
                </div>
                <div style={{ fontFamily: "Vazirmatn", fontWeight: 700, fontSize: 14, color: "#FFFFFF" }}>{c.label}</div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* DISCOUNT BANNER */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px 50px" }}>
        <Reveal>
          <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, background: "linear-gradient(120deg,#3a1440,var(--bg) 70%)", border: "1px solid var(--border-soft)", padding: "42px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <FlavorCloud color="#C6FF3D" size={380} style={{ bottom: -140, left: -80 }} />
            <div style={{ position: "relative", zIndex: 2 }}>
              <Badge bg="#C6FF3D">پیشنهاد شگفت‌انگیز هفته</Badge>
              <h2 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 26, margin: "14px 0 8px" }}>تا ۲۰٪ تخفیف روی مایع‌های یخی</h2>
              <p style={{ color: "var(--text-lo)", fontSize: 14, marginBottom: 14 }}>فقط تا پایان این هفته، موجودی محدود</p>
              <Countdown target={weekEnd} color="#C6FF3D" />
            </div>
            <Link href="/shop" style={{ position: "relative", zIndex: 2, background: "#C6FF3D", color: "var(--ink)", border: "none", borderRadius: 14, padding: "14px 26px", fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>
              مشاهده تخفیف‌ها
            </Link>
          </div>
        </Reveal>
      </section>

      {/* SALE OFFERS */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px 50px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>پیشنهادهای فروش</h2>
            <p style={{ color: "var(--text-mut)", fontSize: 12.5 }}>محصولات تخفیف‌دار همین حالا</p>
          </div>
          <Link href="/shop" style={{ color: "#22E5C9", fontFamily: "Vazirmatn", fontSize: 13, textDecoration: "none" }}>
            مشاهده همه ←
          </Link>
        </div>
        <div className="sale-scroll" style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 10, scrollSnapType: "x mandatory" }}>
          {saleItems.map((p, i) => (
            <Reveal key={p.id} delay={0.06 * (i % 4)} style={{ minWidth: 190, maxWidth: 190, scrollSnapAlign: "start" }}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px 70px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h2 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 22 }}>پیشنهادهای ویژه</h2>
          <Link href="/shop" style={{ color: "#22E5C9", fontFamily: "Vazirmatn", fontSize: 13, textDecoration: "none" }}>
            مشاهده همه ←
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 18 }}>
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={0.08 * (i % 4)}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
