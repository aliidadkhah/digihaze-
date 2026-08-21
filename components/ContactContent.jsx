"use client";

import { useState } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import { Reveal, inputStyle } from "./ui";

export default function ContactContent() {
  const [sent, setSent] = useState(false);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 20px 80px" }}>
      <h1 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 28, marginBottom: 30 }}>تماس با ما</h1>
      <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 34 }}>
        <Reveal>
          <div>
            {[
              { icon: Phone, label: "تلفن تماس", value: "021-88889999" },
              { icon: Mail, label: "ایمیل", value: "info@abrforoush.ir" },
              { icon: MapPin, label: "آدرس", value: "تهران، خیابان نمونه، پلاک ۱۲" },
            ].map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 22 }}>
                <div style={{ background: "var(--surface2)", borderRadius: 12, padding: 10 }}>
                  <it.icon size={17} color="#22E5C9" />
                </div>
                <div>
                  <div style={{ color: "var(--text-mut)", fontSize: 12, marginBottom: 3 }}>{it.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{it.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
              setTimeout(() => setSent(false), 2200);
            }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <input placeholder="نام شما" required style={inputStyle} />
            <input placeholder="شماره تماس یا ایمیل" required style={inputStyle} />
            <textarea placeholder="پیام شما" required rows={5} style={{ ...inputStyle, resize: "vertical" }} />
            <button
              type="submit"
              style={{ background: sent ? "#22E5C9" : "#2F86FF", color: "var(--ink)", border: "none", borderRadius: 12, padding: "13px 0", fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 14, cursor: "pointer", transition: "background 0.25s ease" }}
            >
              {sent ? "پیام شما ارسال شد ✓" : "ارسال پیام"}
            </button>
          </form>
        </Reveal>
      </div>
    </div>
  );
}
