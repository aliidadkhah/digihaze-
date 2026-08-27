"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch, RefreshCw, ChevronLeft } from "lucide-react";
import { useUser } from "./Providers";
import { getProductById, money } from "@/lib/data";

const STATUS_LABELS = {
  pending: "در انتظار بررسی پرداخت",
  paid: "پرداخت‌شده",
  failed: "ناموفق",
  cancelled: "لغوشده",
};

const STATUS_COLORS = {
  pending: "#FF8A3D",
  paid: "#22E5C9",
  failed: "#2F86FF",
  cancelled: "var(--text-faint)",
};

export default function OrdersContent() {
  const { user } = useUser();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.contact) {
      fetchOrders();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.contact]);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/orders?phone=${encodeURIComponent(user.contact)}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "خطا در دریافت سفارش‌ها");
      }

      setOrders(data.orders || []);
    } catch (e) {
      setError(e.message || "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // کاربر لاگین نیست
  // ================================

  if (!user) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <PackageSearch size={40} color="var(--text-mut)" style={{ margin: "0 auto 16px" }} />
        <h1 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
          ابتدا وارد حساب کاربری‌ات شو
        </h1>
        <p style={{ color: "var(--text-mut)", fontSize: 13, marginBottom: 24, lineHeight: 2 }}>
          برای دیدن سفارش‌هایت باید با شماره موبایلت وارد شوی.
        </p>
        <button
          onClick={() => router.push("/auth")}
          style={{
            background: "#22E5C9",
            color: "var(--ink)",
            border: "none",
            borderRadius: 12,
            padding: "13px 24px",
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          ورود به حساب کاربری
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "50px 20px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 22 }}>سفارش‌های من</h1>

        <button
          onClick={fetchOrders}
          disabled={loading}
          style={{
            background: "var(--surface2)",
            border: "none",
            borderRadius: 10,
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: loading ? "default" : "pointer",
            color: "var(--text-hi)",
            fontFamily: "Vazirmatn",
            fontSize: 13,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <RefreshCw size={14} /> به‌روزرسانی
        </button>
      </div>

      {loading && (
        <p style={{ color: "var(--text-mut)", fontSize: 13.5 }}>در حال بارگذاری سفارش‌ها...</p>
      )}

      {!loading && error && (
        <div style={{ background: "#ff3b3b18", color: "#ff6b6b", borderRadius: 10, padding: "12px 14px", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-mut)" }}>
          <PackageSearch size={36} color="var(--text-faint)" style={{ margin: "0 auto 14px" }} />
          <p style={{ fontSize: 14, marginBottom: 20 }}>هنوز هیچ سفارشی ثبت نکردی.</p>
          <button
            onClick={() => router.push("/shop")}
            style={{
              background: "var(--surface2)",
              border: "none",
              borderRadius: 12,
              padding: "12px 22px",
              color: "var(--text-hi)",
              fontFamily: "Vazirmatn",
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
            }}
          >
            مشاهده فروشگاه
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {orders.map((o) => (
          <div
            key={o.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--surface2)",
              borderRadius: 16,
              padding: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, fontFamily: "Vazirmatn" }}>
                  سفارش #{String(o.id).slice(0, 8)}
                </div>
                <div style={{ color: "var(--text-mut)", fontSize: 12, marginTop: 3 }}>
                  {new Date(o.created_at).toLocaleString("fa-IR")}
                </div>
              </div>

              <span
                style={{
                  background: `${STATUS_COLORS[o.status] || "var(--text-faint)"}22`,
                  color: STATUS_COLORS[o.status] || "var(--text-hi)",
                  fontFamily: "Vazirmatn",
                  fontWeight: 700,
                  fontSize: 12,
                  padding: "6px 12px",
                  borderRadius: 999,
                  height: "fit-content",
                }}
              >
                {STATUS_LABELS[o.status] || o.status}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {(o.order_items || []).map((it) => {
                const product = getProductById(it.product_id);

                return (
                  <div
                    key={it.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      color: "var(--text-lo)",
                      fontFamily: "Vazirmatn",
                    }}
                  >
                    <span>
                      {product?.name || it.product_id} × {it.qty}
                    </span>
                    <span style={{ whiteSpace: "nowrap" }}>{money(it.price * it.qty)}</span>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                borderTop: "1px solid var(--surface2)",
                paddingTop: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontFamily: "Vazirmatn",
              }}
            >
              <span style={{ color: "var(--text-mut)", fontSize: 12.5 }}>مبلغ کل</span>
              <span style={{ fontWeight: 800, fontSize: 15 }}>{money(o.total)}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push("/auth")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "var(--text-mut)",
          fontFamily: "Vazirmatn",
          fontSize: 13,
          marginTop: 24,
          cursor: "pointer",
          padding: 0,
        }}
      >
        <ChevronLeft size={15} /> بازگشت به حساب کاربری
      </button>
    </div>
  );
}
