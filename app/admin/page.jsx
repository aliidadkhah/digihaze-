"use client";

import { useEffect, useState } from "react";
import { Lock, RefreshCw, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const STATUS_LABELS = {
  pending: "در انتظار پرداخت",
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session]);

  const login = async (e) => {
    e.preventDefault();

    setLoginError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError("ایمیل یا رمز عبور اشتباهه");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const fetchOrders = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError("");

    try {
      const token = session.access_token;

      const res = await fetch("/api/admin/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "خطا در دریافت سفارش‌ها"
        );
      }

      setOrders(data.orders || []);
    } catch (e) {
      setError(e.message || "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (orderId, status) => {
    if (!session?.access_token) return;

    try {
      const token = session.access_token;

      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "خطا در تغییر وضعیت سفارش"
        );
      }

      await fetchOrders();
    } catch (e) {
      setError(e.message || "خطا در تغییر وضعیت سفارش");
    }
  };

  if (checking) {
    return null;
  }

  /*
   * ================================
   * LOGIN
   * ================================
   */

  if (!session) {
    return (
      <div
        style={{
          maxWidth: 380,
          margin: "0 auto",
          padding: "80px 20px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <Lock
            size={30}
            color="var(--text-mut)"
            style={{
              margin: "0 auto 10px",
            }}
          />

          <h1
            style={{
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            ورود به پنل مدیریت
          </h1>
        </div>

        <form
          onSubmit={login}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <input
            type="email"
            placeholder="ایمیل"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="رمز عبور"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            style={inputStyle}
          />

          {loginError && (
            <div
              style={{
                color: "#2F86FF",
                fontSize: 12.5,
                background: "#2F86FF22",
                borderRadius: 10,
                padding: "8px 12px",
                fontFamily: "Vazirmatn",
              }}
            >
              {loginError}
            </div>
          )}

          <button
            type="submit"
            style={{
              background: "#2F86FF",
              color: "var(--ink)",
              border: "none",
              borderRadius: 12,
              padding: "13px 0",
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ورود
          </button>
        </form>

        <p
          style={{
            color: "var(--text-mut)",
            fontSize: 12,
            marginTop: 16,
            textAlign: "center",
            lineHeight: 1.8,
          }}
        >
          این کاربر باید از قبل توی Supabase ساخته شده
          و is_admin=true داشته باشه.
        </p>
      </div>
    );
  }

  /*
   * ================================
   * ACCESS DENIED
   * ================================
   */

  if (error === "دسترسی مدیریتی نداری") {
    return (
      <div
        style={{
          maxWidth: 420,
          margin: "0 auto",
          padding: "80px 20px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "var(--text-hi)",
            marginBottom: 16,
            fontFamily: "Vazirmatn",
          }}
        >
          این حساب دسترسی مدیریتی نداره.
        </p>

        <button
          onClick={logout}
          style={{
            background: "var(--surface2)",
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            color: "var(--text-hi)",
            cursor: "pointer",
            fontFamily: "Vazirmatn",
          }}
        >
          خروج
        </button>
      </div>
    );
  }

  /*
   * ================================
   * ADMIN PANEL
   * ================================
   */

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "40px 20px 80px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 26,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 24,
            margin: 0,
          }}
        >
          سفارش‌ها ({orders.length})
        </h1>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={fetchOrders}
            disabled={loading}
            style={{
              ...iconTextBtn,
              opacity: loading ? 0.6 : 1,
              cursor: loading
                ? "default"
                : "pointer",
            }}
          >
            <RefreshCw size={14} />
            به‌روزرسانی
          </button>

          <button
            onClick={logout}
            style={iconTextBtn}
          >
            <LogOut size={14} />
            خروج
          </button>
        </div>
      </div>

      {loading && (
        <p
          style={{
            color: "var(--text-mut)",
            fontFamily: "Vazirmatn",
            fontSize: 13,
          }}
        >
          در حال بارگذاری...
        </p>
      )}

      {!loading && error && (
        <div
          style={{
            color: "#ff6b6b",
            background: "#ff3b3b18",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            fontFamily: "Vazirmatn",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {orders.length === 0 && !loading && !error && (
        <p
          style={{
            color: "var(--text-mut)",
            fontFamily: "Vazirmatn",
          }}
        >
          هنوز سفارشی ثبت نشده.
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {orders.map((o) => {
          /*
           * مهم:
           * id ممکن است در Supabase عددی یا رشته‌ای باشد.
           * بنابراین قبل از slice آن را به String تبدیل می‌کنیم.
           */
          const orderId = String(o.id);

          return (
            <div
              key={orderId}
              style={{
                background: "var(--surface)",
                border:
                  "1px solid var(--surface2)",
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13.5,
                      fontFamily: "Vazirmatn",
                    }}
                  >
                    سفارش #{orderId.slice(0, 8)}
                  </div>

                  <div
                    style={{
                      color: "var(--text-mut)",
                      fontSize: 12,
                      marginTop: 3,
                      fontFamily: "Vazirmatn",
                    }}
                  >
                    {new Date(
                      o.created_at
                    ).toLocaleString("fa-IR")}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      fontFamily: "Vazirmatn",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {Number(
                      o.total || 0
                    ).toLocaleString("fa-IR")}{" "}
                    تومان
                  </span>

                  <select
                    value={o.status}
                    onChange={(e) =>
                      changeStatus(
                        o.id,
                        e.target.value
                      )
                    }
                    style={{
                      background:
                        "var(--surface2)",
                      color:
                        STATUS_COLORS[
                          o.status
                        ] ||
                        "var(--text-hi)",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontFamily:
                        "Vazirmatn",
                      fontSize: 12,
                      fontWeight: 700,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {Object.entries(
                      STATUS_LABELS
                    ).map(
                      ([key, label]) => (
                        <option
                          key={key}
                          value={key}
                        >
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {(o.order_items || []).map(
                  (it) => (
                    <div
                      key={String(it.id)}
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        fontSize: 12.5,
                        color:
                          "var(--text-lo)",
                        fontFamily:
                          "Vazirmatn",
                      }}
                    >
                      <span>
                        {it.product_id}
                      </span>

                      <span>
                        × {it.qty}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/*
 * ================================
 * STYLES
 * ================================
 */

const inputStyle = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--surface2)",
  borderRadius: 12,
  padding: "13px 16px",
  color: "var(--text-hi)",
  fontFamily: "Vazirmatn",
  outline: "none",
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
  fontFamily: "Vazirmatn",
  fontSize: 13,
};
