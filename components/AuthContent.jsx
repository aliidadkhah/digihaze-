"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, ShoppingBag, Phone } from "lucide-react";
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

// ⚠️ این یک شبیه‌سازی سمت فرانت‌اند هست (بدون پیامک واقعی).
// برای اتصال واقعی باید دو مسیر از بک‌اند صدا زده بشه:
//   POST /api/auth/send-otp   { phone }
//   POST /api/auth/verify-otp { phone, code }
// که پیامک واقعی رو از طریق سرویس‌هایی مثل کاوه‌نگار یا SMS.ir ارسال می‌کنن.
function fakeSendOtp(phone) {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  return new Promise((resolve) => setTimeout(() => resolve(code), 700));
}

export default function AuthContent() {
  const { user, login, logout } = useUser();
  const router = useRouter();

  const [step, setStep] = useState("phone"); // phone | code
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState(""); // فقط برای نمایش دمو، در نسخه‌ی واقعی حذف می‌شه
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timer]);

  const validPhone = /^09\d{9}$/.test(phone);

  const sendCode = async (e) => {
    e.preventDefault();
    setError("");
    if (!validPhone) {
      setError("شماره موبایل رو درست وارد کن (مثلاً 09123456789)");
      return;
    }
    setLoading(true);
    const generated = await fakeSendOtp(phone);
    setDevCode(generated);
    setLoading(false);
    setStep("code");
    setTimer(60);
  };

  const verifyCode = (e) => {
    e.preventDefault();
    setError("");
    if (code.trim() !== devCode) {
      setError("کد وارد شده صحیح نیست");
      return;
    }
    login({ name: `کاربر ${phone.slice(-4)}`, contact: phone });
    router.push("/");
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
        <Badge bg="#FF8A3D">ورود سریع</Badge>
        <h1 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 26, margin: "16px 0 6px" }}>
          {step === "phone" ? "ورود با شماره موبایل" : "کد تایید رو وارد کن"}
        </h1>
        <p style={{ color: "var(--text-mut)", fontSize: 13 }}>
          {step === "phone" ? "کد تایید برات پیامک می‌شه" : `کد ۴ رقمی به ${phone} ارسال شد`}
        </p>
      </div>

      {step === "phone" && (
        <form onSubmit={sendCode} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Phone size={16} color="var(--text-mut)" style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="tel"
              inputMode="numeric"
              placeholder="09123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              style={{ ...inputStyle, width: "100%", paddingRight: 42, direction: "ltr", textAlign: "right" }}
            />
          </div>
          {error && <div style={{ color: "#2F86FF", fontSize: 12.5, background: "#2F86FF22", borderRadius: 10, padding: "8px 12px" }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ background: "#2F86FF", color: "var(--ink)", border: "none", borderRadius: 12, padding: "13px 0", fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 14, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "در حال ارسال..." : "دریافت کد تایید"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyCode} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="کد ۴ رقمی"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            style={{ ...inputStyle, textAlign: "center", letterSpacing: 6, fontSize: 20, direction: "ltr" }}
            autoFocus
          />

          {/* فقط برای دمو، چون پیامک واقعی وصل نیست — در نسخه‌ی واقعی این باکس حذف می‌شه */}
          <div style={{ background: "#C6FF3D22", border: "1px solid #C6FF3D55", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "var(--text-hi)" }}>
            حالت دمو — کد ارسالی: <b style={{ direction: "ltr", display: "inline-block" }}>{devCode}</b>
          </div>

          {error && <div style={{ color: "#2F86FF", fontSize: 12.5, background: "#2F86FF22", borderRadius: 10, padding: "8px 12px" }}>{error}</div>}

          <button type="submit" style={{ background: "#2F86FF", color: "var(--ink)", border: "none", borderRadius: 12, padding: "13px 0", fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
            تایید و ورود
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
            <button type="button" onClick={() => setStep("phone")} style={{ background: "none", border: "none", color: "var(--text-mut)", cursor: "pointer", fontFamily: "Vazirmatn" }}>
              ویرایش شماره
            </button>
            <button
              type="button"
              disabled={timer > 0}
              onClick={sendCode}
              style={{ background: "none", border: "none", color: timer > 0 ? "var(--text-faint)" : "#22E5C9", cursor: timer > 0 ? "default" : "pointer", fontFamily: "Vazirmatn" }}
            >
              {timer > 0 ? `ارسال مجدد (${timer})` : "ارسال مجدد کد"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
