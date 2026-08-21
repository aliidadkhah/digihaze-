"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Eye, EyeOff, LogOut, ShoppingBag } from "lucide-react";
import { Badge, inputStyle } from "./ui";
import { useUser } from "./Providers";

const accountRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "var(--surface)",
  border: "1px solid var(--surface2)",
  borderRadius: 12,
  padding: "13px 16px",
  color: "var(--text-hi)",
  fontFamily: "Vazirmatn",
  fontSize: 13.5,
  cursor: "pointer",
};

export default function AuthContent() {
  const { user, login, logout } = useUser();
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.contact || !form.password) {
      setError("لطفاً همه فیلدهای ضروری را پر کن");
      return;
    }
    if (mode === "signup") {
      if (!form.name) {
        setError("لطفاً نام خود را وارد کن");
        return;
      }
      if (form.password !== form.confirm) {
        setError("رمز عبور و تکرار آن یکسان نیستند");
        return;
      }
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      login({ name: form.name || form.contact.split("@")[0], contact: form.contact });
      router.push("/");
    }, 800);
  };

  if (user) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "70px 20px 90px", textAlign: "center" }}>
        <div style={{ width: 74, height: 74, borderRadius: "50%", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", border: "2px solid #22E5C9" }}>
          <User size={30} color="#22E5C9" />
        </div>
        <h2 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 20, marginBottom: 6 }}>خوش اومدی، {user.name}</h2>
        <p style={{ color: "var(--text-mut)", fontSize: 13, marginBottom: 26 }}>{user.contact}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "right" }}>
          <button onClick={() => router.push("/shop")} style={accountRowStyle}>
            <ShoppingBag size={16} color="var(--text-lo)" /> فروشگاه
          </button>
          <button onClick={() => router.push("/cart")} style={accountRowStyle}>
            <ShoppingBag size={16} color="var(--text-lo)" /> سبد خرید من
          </button>
          <button onClick={logout} style={{ ...accountRowStyle, color: "#2F86FF", borderColor: "#3a1440" }}>
            <LogOut size={16} color="#2F86FF" /> خروج از حساب
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "60px 20px 90px" }}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <Badge bg="#FF8A3D">{mode === "login" ? "خوش برگشتی" : "عضویت سریع"}</Badge>
        <h1 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 26, margin: "16px 0 6px" }}>
          {mode === "login" ? "ورود به حساب کاربری" : "ساخت حساب کاربری"}
        </h1>
        <p style={{ color: "var(--text-mut)", fontSize: 13 }}>{mode === "login" ? "برای ادامه خرید وارد شو" : "چند ثانیه‌ای عضو ابرفروش شو"}</p>
      </div>

      <div style={{ display: "flex", background: "var(--surface)", borderRadius: 14, padding: 4, marginBottom: 24, border: "1px solid var(--surface2)" }}>
        {["login", "signup"].map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError("");
            }}
            style={{ flex: 1, background: mode === m ? "#2F86FF" : "transparent", color: mode === m ? "var(--ink)" : "var(--text-lo)", border: "none", borderRadius: 10, padding: "10px 0", fontFamily: "Vazirmatn", fontWeight: 700, fontSize: 13.5, cursor: "pointer", transition: "all 0.25s ease" }}
          >
            {m === "login" ? "ورود" : "ثبت‌نام"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mode === "signup" && <input placeholder="نام و نام خانوادگی" value={form.name} onChange={update("name")} style={inputStyle} />}
        <input placeholder="شماره موبایل یا ایمیل" value={form.contact} onChange={update("contact")} style={inputStyle} />
        <div style={{ position: "relative" }}>
          <input type={showPw ? "text" : "password"} placeholder="رمز عبور" value={form.password} onChange={update("password")} style={{ ...inputStyle, width: "100%", paddingLeft: 42 }} />
          <button type="button" onClick={() => setShowPw((s) => !s)} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
            {showPw ? <EyeOff size={16} color="var(--text-mut)" /> : <Eye size={16} color="var(--text-mut)" />}
          </button>
        </div>
        {mode === "signup" && <input type="password" placeholder="تکرار رمز عبور" value={form.confirm} onChange={update("confirm")} style={inputStyle} />}

        {mode === "login" && (
          <div style={{ textAlign: "left" }}>
            <button type="button" style={{ background: "none", border: "none", color: "#22E5C9", fontSize: 12.5, cursor: "pointer", fontFamily: "Vazirmatn" }}>
              رمز عبور را فراموش کردی؟
            </button>
          </div>
        )}

        {error && <div style={{ color: "#2F86FF", fontSize: 12.5, background: "#2F86FF22", borderRadius: 10, padding: "8px 12px" }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ background: "#2F86FF", color: "var(--ink)", border: "none", borderRadius: 12, padding: "13px 0", fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 14, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 6 }}>
          {loading ? "لطفاً صبر کن…" : mode === "login" ? "ورود" : "ساخت حساب"}
        </button>
      </form>

      <p style={{ textAlign: "center", color: "var(--text-mut)", fontSize: 12.5, marginTop: 20 }}>
        {mode === "login" ? "هنوز حساب نداری؟" : "قبلاً ثبت‌نام کردی؟"}{" "}
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ background: "none", border: "none", color: "#22E5C9", fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn" }}>
          {mode === "login" ? "ثبت‌نام کن" : "وارد شو"}
        </button>
      </p>
    </div>
  );
}
