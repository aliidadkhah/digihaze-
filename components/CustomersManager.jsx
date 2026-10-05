"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Phone, MapPin, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { HOW_HEARD_LABELS } from "@/lib/telegram";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const cardStyle = {
  background: "var(--surface)",
  border: "1px solid var(--surface2)",
  borderRadius: 14,
  padding: 16,
};

const inputStyle = {
  background: "var(--surface)",
  border: "1px solid var(--surface2)",
  borderRadius: 12,
  padding: "11px 14px",
  color: "var(--text-hi)",
  fontFamily: "var(--font-primary)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const iconTextBtn = {
  background: "var(--surface2)",
  border: "none",
  borderRadius: 10,
  padding: "8px 14px",
  display: "flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
  color: "var(--text-hi)",
  fontFamily: "var(--font-primary)",
  fontSize: 13,
};

export default function CustomersManager() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const getToken = async () => {
    const { data: s } = await supabase.auth.getSession();
    return s?.session?.access_token;
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطا در دریافت مشتریان");
      setCustomers(json.customers || []);
    } catch (e) {
      setError(e.message || "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.trim();
    if (!q) return true;
    return (
      (c.name || "").includes(q) ||
      (c.phone || "").includes(q) ||
      (c.city || "").includes(q)
    );
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              top: "50%",
              right: 14,
              transform: "translateY(-50%)",
              color: "var(--text-mut)",
            }}
          />
          <input
            placeholder="جستجو با نام، موبایل یا شهر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingRight: 36 }}
          />
        </div>
        <button onClick={load} style={iconTextBtn}>
          <RefreshCw size={14} /> به‌روزرسانی
        </button>
      </div>

      {loading && <p style={{ color: "var(--text-mut)" }}>در حال بارگذاری...</p>}
      {error && (
        <div style={{ color: "#4F7FFF", fontSize: 12.5, background: "#4F7FFF22", borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>
          {error}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <p style={{ color: "var(--text-mut)" }}>
          {customers.length === 0 ? "هنوز هیچ مشتری‌ای ثبت‌نام نکرده." : "موردی پیدا نشد."}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((c) => (
          <div key={c.phone} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name || "بدون نام"}</div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-mut)" }}>
                <span>{c.ordersCount} سفارش</span>
                <span>{Number(c.paidTotal || 0).toLocaleString("fa-IR")} تومان خرید موفق</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, color: "var(--text-lo)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Phone size={13} />
                <span dir="ltr">{c.phone}</span>
              </div>
              {(c.province || c.city || c.address) && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <MapPin size={13} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>
                    {c.province} {c.city && `/ ${c.city}`} {c.address && `— ${c.address}`}
                    {c.postal_code && ` (کدپستی: ${c.postal_code})`}
                  </span>
                </div>
              )}
              {c.how_heard && (
                <div>نحوه آشنایی: {HOW_HEARD_LABELS[c.how_heard] || c.how_heard}</div>
              )}
              <div style={{ color: "var(--text-mut)" }}>
                تاریخ ثبت‌نام: {formatDate(c.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
