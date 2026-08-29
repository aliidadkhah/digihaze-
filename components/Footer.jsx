"use client";

import Link from "next/link";
import { Instagram, Send } from "lucide-react";
import { CATEGORIES } from "@/lib/data";

function WhatsAppIcon({ size = 16, color = "var(--text-hi)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
        fill={color}
      />
      <path
        d="M12.004 2C6.477 2 2 6.477 2 12.004c0 1.887.524 3.65 1.432 5.155L2 22l4.955-1.399A9.945 9.945 0 0 0 12.004 22C17.53 22 22 17.53 22 12.004 22 6.477 17.53 2 12.004 2zm0 18.152c-1.65 0-3.19-.457-4.505-1.25l-.323-.192-3.096.875.83-3.06-.21-.315a8.13 8.13 0 0 1-1.348-4.206c0-4.517 3.674-8.19 8.192-8.19 4.517 0 8.19 3.673 8.19 8.19 0 4.518-3.673 8.148-8.23 8.148z"
        fill={color}
      />
    </svg>
  );
}

const WHATSAPP_NUMBER = "989020951384";
const INSTAGRAM_USERNAME = "digihaze.ir";
const TELEGRAM_USERNAME = "digihaze";

export default function Footer() {
  const SOCIAL_LINKS = [
    { icon: Instagram, href: `https://instagram.com/${INSTAGRAM_USERNAME}`, label: "اینستاگرام" },
    { icon: Send, href: `https://t.me/${TELEGRAM_USERNAME}`, label: "تلگرام" },
    { icon: WhatsAppIcon, href: `https://wa.me/${WHATSAPP_NUMBER}`, label: "واتساپ" },
  ];

  return (
    <footer style={{ borderTop: "1px solid var(--surface2)", marginTop: 60, padding: "40px 20px 24px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 28 }}>
        <div>
          <div style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 20, marginBottom: 10 }}>
            دیجی<span style={{ color: "#2F86FF" }}>هیز</span>
          </div>
          <p style={{ color: "var(--text-lo)", fontSize: 13, lineHeight: 2 }}>
            فروشگاه پاد، ویپ، سالت نیکوتین و لوازم جانبی با ارسال سریع و ضمانت اصالت کالا.
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
            { href: "/terms", label: "قوانین و مقررات" },
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
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                style={{
                  background: "var(--surface2)",
                  borderRadius: 10,
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                <s.icon size={16} color="var(--text-hi)" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", color: "var(--text-faint)", fontSize: 12, marginTop: 34 }}>
        © تمامی حقوق برای دیجی‌هیز محفوظ است.
      </div>
    </footer>
  );
}
