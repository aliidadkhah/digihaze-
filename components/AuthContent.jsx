"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, LogOut, ShoppingBag, Phone, PackageSearch, MapPin } from "lucide-react";
import { Badge, inputStyle } from "./ui";
import { useUser, isProfileComplete } from "./Providers";
import { IRAN_PROVINCES, IRAN_LOCATIONS } from "@/lib/iranLocations";

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

const selectStyle = {
  ...inputStyle,
  width: "100%",
  appearance: "auto",
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
  const { user, login, logout, updateProfile } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [step, setStep] = useState("phone"); // phone | code | profile
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState(""); // فقط برای نمایش دمو، در نسخه‌ی واقعی حذف می‌شه
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const [profileForm, setProfileForm] = useState({
    name: "",
    address: "",
    province: "",
    city: "",
    postalCode: "",
  });
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timer]);

  // اگه از قبل لاگین بود ولی پروفایلش ناقصه (و برای تکمیل اومده) هدایتش کن به فرم پروفایل
  useEffect(() => {
    if (user && !isProfileComplete(user) && searchParams.get("redirect")) {
      setStep("profile");
      setProfileForm((f) => ({ ...f, name: user.name?.startsWith("کاربر ") ? "" : user.name || "" }));
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const finishLogin = (loggedInUser) => {
    if (isProfileComplete(loggedInUser)) {
      router.push(redirectTo);
    } else {
      setStep("profile");
    }
  };

  const verifyCode = (e) => {
    e.preventDefault();
    setError("");
    if (code.trim() !== devCode) {
      setError("کد وارد شده صحیح نیست");
      return;
    }
    const newUser = { name: `کاربر ${phone.slice(-4)}`, contact: phone };
    login(newUser);
    finishLogin(newUser);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((f) => ({
      ...f,
      [name]: value,
      ...(name === "province" ? { city: "" } : {}),
    }));
  };

  const submitProfile = (e) => {
    e.preventDefault();
    setProfileError("");

    if (!profileForm.name.trim()) {
      setProfileError("لطفاً نام و نام خانوادگی را وارد کنید.");
      return;
    }
    if (!profileForm.province) {
      setProfileError("لطفاً استان را انتخاب کنید.");
      return;
    }
    if (!profileForm.city) {
      setProfileError("لطفاً شهر را انتخاب کنید.");
      return;
    }
    if (!profileForm.address.trim()) {
      setProfileError("لطفاً آدرس کامل را وارد کنید.");
      return;
    }
    if (!/^\d{10}$/.test(profileForm.postalCode.trim())) {
      setProfileError("کد پستی باید ۱۰ رقم باشد.");
      return;
    }

    updateProfile({
      name: profileForm.name.trim(),
      province: profileForm.province,
      city: profileForm.city,
      address: profileForm.address.trim(),
      postalCode: profileForm.postalCode.trim(),
    });

    router.push(redirectTo);
  };

  if (user && isProfileComplete(user)) {
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
          <button onClick={() => router.push("/orders")} style={accountRowStyle}>
            <PackageSearch size={16} color="var(--text-lo)" /> سفارش‌های من
          </button>
          <button onClick={() => setStep("profile")} style={accountRowStyle}>
            <MapPin size={16} color="var(--text-lo)" /> ویرایش آدرس و مشخصات
          </button>
          <button onClick={logout} style={{ ...accountRowStyle, color: "#2F86FF", borderColor: "#3a1440" }}>
            <LogOut size={16} color="#2F86FF" /> خروج از حساب
          </button>
        </div>
      </div>
    );
  }

  // ========================
  // مرحله تکمیل پروفایل (اولین‌بار ورود)
  // ========================
  if (user && step === "profile") {
    const cities = profileForm.province ? IRAN_LOCATIONS[profileForm.province] || [] : [];

    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "50px 20px 90px" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <Badge bg="#22E5C9">یک قدم مونده</Badge>
          <h1 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 22, margin: "16px 0 6px" }}>
            تکمیل مشخصات گیرنده
          </h1>
          <p style={{ color: "var(--text-mut)", fontSize: 13 }}>
            این اطلاعات فقط یکبار ازت پرسیده می‌شه و برای سفارش‌های بعدی ذخیره می‌مونه
          </p>
        </div>

        <form onSubmit={submitProfile} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>نام و نام خانوادگی</label>
            <input
              name="name"
              value={profileForm.name}
              onChange={handleProfileChange}
              placeholder="مثلاً علی رضایی"
              style={{ ...inputStyle, width: "100%" }}
              autoComplete="name"
            />
          </div>

          <div>
            <label style={labelStyle}>شماره موبایل</label>
            <input
              value={user.contact}
              disabled
              dir="ltr"
              style={{ ...inputStyle, width: "100%", opacity: 0.6 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>استان</label>
              <select name="province" value={profileForm.province} onChange={handleProfileChange} style={selectStyle}>
                <option value="">انتخاب کنید</option>
                {IRAN_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>شهر</label>
              <select
                name="city"
                value={profileForm.city}
                onChange={handleProfileChange}
                style={selectStyle}
                disabled={!profileForm.province}
              >
                <option value="">
                  {profileForm.province ? "انتخاب کنید" : "ابتدا استان را انتخاب کنید"}
                </option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>آدرس کامل</label>
            <textarea
              name="address"
              value={profileForm.address}
              onChange={handleProfileChange}
              placeholder="خیابان، کوچه، پلاک، واحد..."
              rows={4}
              style={{ ...inputStyle, width: "100%", resize: "vertical", lineHeight: 1.8, boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={labelStyle}>کد پستی (۱۰ رقم)</label>
            <input
              name="postalCode"
              value={profileForm.postalCode}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, postalCode: e.target.value.replace(/\D/g, "").slice(0, 10) }))
              }
              placeholder="1234567890"
              inputMode="numeric"
              dir="ltr"
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>

          {profileError && (
            <div style={{ color: "#2F86FF", fontSize: 12.5, background: "#2F86FF22", borderRadius: 10, padding: "8px 12px" }}>
              {profileError}
            </div>
          )}

          <button type="submit" style={{ background: "#22E5C9", color: "#061014", border: "none", borderRadius: 12, padding: "13px 0", fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
            ذخیره و ادامه
          </button>
        </form>
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

const labelStyle = {
  display: "block",
  marginBottom: 7,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-hi)",
  fontFamily: "Vazirmatn",
};
