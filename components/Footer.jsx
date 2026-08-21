"use client";

import Link from "next/link";
import { Instagram, Send } from "lucide-react";
import { CATEGORIES } from "@/lib/data";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--surface2)", marginTop: 60, padding: "40px 20px 24px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 28 }}>
        <div>
          <div style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 20, marginBottom: 10 }}>
            ابر<span style={{ color: "#2F86FF" }}>فروش</span>
          </div>
          <p style={{ color: "var(--text-lo)", fontSize: 13, lineHeight: 2 }}>
            فروشگاه تخصصی مایع ویپ، دستگاه و لوازم جانبی با ارسال سریع و ضمانت اصالت کالا.
          </p>
          <p style={{ color: "var(--text-mut)", fontSize: 11, marginTop: 10 }}>
            فروش این محصولات صرفاً به افراد بالای ۱۸ سال مجاز است.
          </p>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>دسترسی سریع</div>
          {[
            { href: "/", label: "خانه" },
            { href: "/shop", label: "فروشگاه" },
            { href: "/about", label: "درباره ما" },
            { href: "/contact", label: "تماس با ما" },
          ].map((l) => (
            <Link key={l.href} href={l.href} style={{ display: "block", color: "var(--text-lo)", fontSize: 13, padding: "5px 0", textDecoration: "none", fontFamily: "Vazirmatn" }}>
              {l.label}
            </Link>
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>دسته‌بندی‌ها</div>
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.id}`} style={{ display: "block", color: "var(--text-lo)", fontSize: 13, padding: "5px 0", textDecoration: "none" }}>
              {c.label}
            </Link>
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>ما را دنبال کنید</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 9 }}>
              <Instagram size={16} color="var(--text-hi)" />
            </div>
            <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 9 }}>
              <Send size={16} color="var(--text-hi)" />
            </div>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", color: "var(--text-faint)", fontSize: 12, marginTop: 34 }}>
        © تمامی حقوق برای ابرفروش محفوظ است.
      </div>
    </footer>
  );
}
