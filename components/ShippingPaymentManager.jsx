"use client";

import { useEffect, useState } from "react";
import { Truck, CreditCard, Loader2, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const SHIPPING_OPTIONS = [
  { id: "tipax", label: "ارسال با تیپاکس (پس‌کرایه)" },
  { id: "post", label: "ارسال با پست" },
  { id: "chapar", label: "ارسال با چاپار (پس‌کرایه)" },
];

const PAYMENT_OPTIONS = [
  { id: "card_to_card", label: "کارت به کارت" },
  { id: "gateway", label: "پرداخت با درگاه شاپرک" },
];

const DEFAULT_SHIPPING = { tipax: true, post: true, chapar: true };
const DEFAULT_PAYMENT = { card_to_card: true, gateway: true };

export default function ShippingPaymentManager() {
  const [shipping, setShipping] = useState(DEFAULT_SHIPPING);
  const [payment, setPayment] = useState(DEFAULT_PAYMENT);
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
        setShipping({ ...DEFAULT_SHIPPING, ...(data.shipping_methods_enabled || {}) });
        setPayment({ ...DEFAULT_PAYMENT, ...(data.payment_methods_enabled || {}) });
      })
      .catch(() => setError("خطا در دریافت تنظیمات"))
      .finally(() => setLoading(false));
  }, []);

  const toggleShipping = (id) =>
    setShipping((prev) => ({ ...prev, [id]: !prev[id] }));

  const togglePayment = (id) =>
    setPayment((prev) => ({ ...prev, [id]: !prev[id] }));

  const activeShippingCount = Object.values(shipping).filter(Boolean).length;
  const activePaymentCount = Object.values(payment).filter(Boolean).length;

  const save = async () => {
    setError("");

    if (activeShippingCount === 0) {
      setError("حداقل یک روش ارسال باید فعال باشه");
      return;
    }

    if (activePaymentCount === 0) {
      setError("حداقل یک روش پرداخت باید فعال باشه");
      return;
    }

    setSaving(true);
    setSaved(false);
    try {
      const token = await getToken();
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shipping_methods_enabled: shipping,
          payment_methods_enabled: payment,
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
      <p style={{ color: "var(--text-mut)", fontSize: 13.5, fontFamily: "Vazirmatn" }}>
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
        gap: 20,
      }}
    >
      <p style={{ color: "var(--text-mut)", fontSize: 12.5, fontFamily: "Vazirmatn", margin: 0 }}>
        هر کدوم از روش‌های ارسال یا پرداخت رو که خاموش کنی، توی صفحه تسویه‌حساب برای
        مشتری‌ها نمایش داده نمی‌شه.
      </p>

      {/* روش‌های ارسال */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Truck size={17} color="#2F86FF" />
          <span style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 15 }}>
            روش‌های ارسال
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SHIPPING_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                background: "var(--bg)",
                border: "1px solid var(--surface2)",
                borderRadius: 10,
                padding: "10px 14px",
                fontFamily: "Vazirmatn",
                fontSize: 13,
                color: "var(--text-hi)",
                cursor: "pointer",
              }}
            >
              <span>{opt.label}</span>
              <input
                type="checkbox"
                checked={!!shipping[opt.id]}
                onChange={() => toggleShipping(opt.id)}
              />
            </label>
          ))}
        </div>
      </div>

      {/* روش‌های پرداخت */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <CreditCard size={17} color="#22E5C9" />
          <span style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 15 }}>
            روش‌های پرداخت
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PAYMENT_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                background: "var(--bg)",
                border: "1px solid var(--surface2)",
                borderRadius: 10,
                padding: "10px 14px",
                fontFamily: "Vazirmatn",
                fontSize: 13,
                color: "var(--text-hi)",
                cursor: "pointer",
              }}
            >
              <span>{opt.label}</span>
              <input
                type="checkbox"
                checked={!!payment[opt.id]}
                onChange={() => togglePayment(opt.id)}
              />
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#ff3b3b18",
            color: "#ff6b6b",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            fontFamily: "Vazirmatn",
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
          background: saved ? "#22E5C9" : "#2F86FF",
          border: "none",
          borderRadius: 10,
          padding: "10px 20px",
          fontFamily: "Vazirmatn",
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

      <style>{`
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
