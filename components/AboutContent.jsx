"use client";

import { Badge, Reveal } from "./ui";
import AboutGlobe from "./AboutGlobe";

export default function AboutContent() {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "60px 20px 80px" }}>
      <Reveal style={{ marginBottom: 36 }}>
        <AboutGlobe />
      </Reveal>
      <Reveal>
        <Badge bg="#FF7A1F">داستان ما</Badge>
        <h1 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 30, margin: "18px 0 20px" }}>درباره دیجی هیز</h1>
        <p style={{ color: "var(--text-lo)", fontSize: 15, lineHeight: 2.1, marginBottom: 18 }}>
          دیجی هیز از دل علاقه به دنیای طعم‌ها شکل گرفت. هدف ما اینه که تجربه‌ی خرید پاد و سالت و لوازم جانبی ویپینگ رو ساده، مطمئن و
          لذت‌بخش کنیم؛ با تضمین اصالت کالا، بسته‌بندی مناسب و پشتیبانی واقعی قبل و بعد از خرید.
        </p>
        <p style={{ color: "var(--text-lo)", fontSize: 15, lineHeight: 2.1, marginBottom: 30 }}>
          همه محصولات موجود در فروشگاه از برندهای معتبر تهیه می‌شن و پیش از قرارگیری در سایت، از نظر کیفیت و تاریخ تولید
          بررسی می‌شن. فروش محصولات صرفاً به افراد بالای ۱۸ سال انجام می‌شود.
        </p>
      </Reveal>
      <div className="about-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          { n: "+200", l: "مشتری راضی" },
          { n: "+30", l: "محصول متنوع" },
          { n: "24h", l: "پشتیبانی پاسخگو" },
        ].map((s, i) => (
          <Reveal key={i} delay={0.1 * i}>
            <div style={{ background: "var(--surface)", borderRadius: 14, padding: "22px 14px", textAlign: "center" }}>
              <div style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 22, color: "#9B5CFF" }}>{s.n}</div>
              <div style={{ color: "var(--text-mut)", fontSize: 12, marginTop: 6 }}>{s.l}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
