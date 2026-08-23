"use client";

import { useEffect, useState } from "react";
import { Lock, RefreshCw, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const STATUS_LABELS = { pending: "در انتظار پرداخت", paid: "پرداخت‌شده", failed: "ناموفق", cancelled: "لغوشده" };
const STATUS_COLORS = { pending: "#FF8A3D", paid: "#22E5C9", failed: "#2F86FF", cancelled: "var(--text-faint)" };

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchOrders();
  }, [session]);

  const login = async (e) => {
    e.preventDefault();
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError("ایمیل یا رمز عبور اشتباهه");
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const token = session.access_token;
      const res = await fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در دریافت سفارش‌ها");
      setOrders(data.orders || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (orderId, status) => {
    const token = session.access_token;
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId, status }),
    });
    fetchOrders();
  };

  if (checking) return null;

  if (!session) {
    return (
      <div style={{ maxWidth: 380, margin: "0 auto", padding: "80px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Lock size={30} color="var(--text-mut)" style={{ margin: "0 auto 10px" }} />
          <h1 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 20 }}>ورود به پنل مدیریت</h1>
        </div>
        <form onSubmit={login} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" placeholder="ایمیل" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="رمز عبور" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          {loginError && <div style={{ color: "#2F86FF", fontSize: 12.5, background: "#2F86FF22", borderRadius: 10, padding: "8px 12px" }}>{loginError}</div>}
          <button type="submit" style={{ background: "#2F86FF", color: "var(--ink)", border: "none", borderRadius: 12, padding: "13px 0", fontFamily: "Vazirmatn", fontWeight: 800, cursor: "pointer" }}>
            ورود
          </button>
        </form>
        <p style={{ color: "var(--text-mut)", fontSize: 12, marginTop: 16, textAlign: "center" }}>
          این کاربر باید از قبل توی Supabase ساخته شده و is_admin=true داشته باشه.
        </p>
      </div>
    );
  }

  if (error === "دسترسی مدیریتی نداری") {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <p style={{ color: "var(--text-hi)", marginBottom: 16 }}>این حساب دسترسی مدیریتی نداره.</p>
        <button onClick={logout} style={{ background: "var(--surface2)", border: "none", borderRadius: 10, padding: "10px 20px", color: "var(--text-hi)", cursor: "pointer" }}>
          خروج
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
        <h1 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 24 }}>سفارش‌ها ({orders.length})</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchOrders} style={iconTextBtn}>
            <RefreshCw size={14} /> به‌روزرسانی
          </button>
          <button onClick={logout} style={iconTextBtn}>
            <LogOut size={14} /> خروج
          </button>
        </div>
      </div>

      {loading && <p style={{ color: "var(--text-mut)" }}>در حال بارگذاری...</p>}
      {orders.length === 0 && !loading && <p style={{ color: "var(--text-mut)" }}>هنوز سفارشی ثبت نشده.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {orders.map((o) => (
          <div key={o.id} style={{ background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>سفارش #{o.id.slice(0, 8)}</div>
                <div style={{ color: "var(--text-mut)", fontSize: 12 }}>{new Date(o.created_at).toLocaleString("fa-IR")}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 800 }}>{o.total?.toLocaleString("fa-IR")} تومان</span>
                <select
                  value={o.status}
                  onChange={(e) => changeStatus(o.id, e.target.value)}
                  style={{ background: "var(--surface2)", color: STATUS_COLORS[o.status] || "var(--text-hi)", border: "none", borderRadius: 8, padding: "6px 10px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700 }}
                >
                  {Object.entries(STATUS_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {(o.order_items || []).map((it) => (
                <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-lo)" }}>
                  <span>{it.product_id}</span>
                  <span>× {it.qty}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = { background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 12, padding: "13px 16px", color: "var(--text-hi)", fontFamily: "Vazirmatn", outline: "none" };
const iconTextBtn = { background: "var(--surface2)", border: "none", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--text-hi)", fontFamily: "Vazirmatn", fontSize: 13 };
