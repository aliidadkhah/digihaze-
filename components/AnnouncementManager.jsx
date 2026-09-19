"use client";

import { useEffect, useState } from "react";
import { Megaphone, Loader2, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// رنگ‌های موجود در پالت سایت
const COLOR_OPTIONS = [
  { id: "#4F7FFF", label: "آبی" },
  { id: "#9B5CFF", label: "فیروزه‌ای" },
  { id: "#FF7A1F", label: "نارنجی" },
  { id: "#B6FF1A", label: "سبز لیمویی" },
];

// رنگ‌های پیشنهادی برای متن اطلاعیه
const TEXT_COLOR_OPTIONS = [
  { id: "#0B0E14", label: "مشکی" },
  { id: "#FFFFFF", label: "سفید" },
];

const inputStyle = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--surface2)",
  borderRadius: 10,
  padding: "10px 12px",
  fontFamily: "var(--font-primary)",
  fontSize: 13.5,
  color: "var(--text-hi)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontFamily: "var(--font-primary)",
  fontSize: 12.5,
  fontWeight: 700,
  color: "var(--text-mut)",
  marginBottom: 6,
};

export default function AnnouncementManager() {
  const [text, setText] = useState("");
  const [color, setColor] = useState("#4F7FFF");
  const [textColor, setTextColor] = useState("#0B0E14");
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setText(data.announcement_text || "");
        setColor(data.announcement_color || "#4F7FFF");
        setTextColor(data.announcement_text_color || "#0B0E14");
        setActive(!!data.announcement_active);
      })
      .catch(() => setError("خطا در دریافت تنظیمات"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          announcement_text: text,
          announcement_color: color,
          announcement_text_color: textColor,
          announcement_active: active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ذخیره ناموفق بود");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message || "خطایی رخ داد");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p style={{ color: "var(--text-mut)", fontSize: 13.5, fontFamily: "var(--font-primary)" }}>
        در حال بارگذاری تنظیمات...
      </p>
    );
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--surface2)",
        borderRadius: 14,
        padding: 20,
        maxWidth: 560,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Megaphone size={18} color="#4F7FFF" />
        <span style={{ fontFamily: "var(--font-primary)", fontWeight: 800, fontSize: 15 }}>
          اطلاعیه بالای سایت
        </span>
      </div>

      <p style={{ color: "var(--text-mut)", fontSize: 12.5, fontFamily: "var(--font-primary)", margin: 0 }}>
        اگه فعال باشه، این متن بالای منوی سایت با رنگ انتخابی نمایش داده می‌شه.
      </p>

      <div>
        <label style={labelStyle}>متن اطلاعیه</label>
        <textarea
          style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
          placeholder="مثلا: ارسال سفارش‌ها تا شنبه انجام نمی‌شود"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div>
        <label style={labelStyle}>رنگ اطلاعیه</label>
        <div style={{ display: "flex", gap: 10 }}>
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColor(c.id)}
              title={c.label}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: c.id,
                border:
                  color === c.id
                    ? "3px solid var(--text-hi)"
                    : "1px solid var(--surface2)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>رنگ نوشته اطلاعیه</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {TEXT_COLOR_OPTIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setTextColor(c.id)}
              title={c.label}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: c.id,
                border:
                  textColor.toLowerCase() === c.id.toLowerCase()
                    ? "3px solid var(--text-hi)"
                    : "1px solid var(--surface2)",
                cursor: "pointer",
              }}
            />
          ))}

          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            title="انتخاب رنگ دلخواه"
            style={{
              width: 34,
              height: 34,
              padding: 0,
              border: "1px solid var(--surface2)",
              borderRadius: "50%",
              overflow: "hidden",
              cursor: "pointer",
              background: "transparent",
            }}
          />
        </div>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--font-primary)",
          fontSize: 13,
          color: "var(--text-hi)",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        نمایش اطلاعیه روی سایت
      </label>

      {/* پیش‌نمایش */}
      {text.trim() && (
        <div>
          <label style={labelStyle}>پیش‌نمایش</label>
          <div
            style={{
              background: color,
              color: textColor,
              borderRadius: 10,
              padding: "10px 16px",
              textAlign: "center",
              fontFamily: "var(--font-primary)",
              fontWeight: 700,
              fontSize: 12.5,
            }}
          >
            {text}
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#ff3b3b18",
            color: "#ff6b6b",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            fontFamily: "var(--font-primary)",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        style={{
          alignSelf: "flex-start",
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: saved ? "#9B5CFF" : "#4F7FFF",
          border: "none",
          borderRadius: 10,
          padding: "10px 20px",
          fontFamily: "var(--font-primary)",
          fontWeight: 700,
          fontSize: 13,
          color: "var(--ink)",
          cursor: saving ? "default" : "pointer",
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? (
          <Loader2 size={14} className="spin" />
        ) : saved ? (
          <Check size={14} />
        ) : null}
        {saved ? "ذخیره شد" : "ذخیره تنظیمات"}
      </button>

      <style jsx>{`
        .spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
