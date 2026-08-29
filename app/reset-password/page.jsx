"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false); // یعنی لینک ایمیل معتبر بوده و سشن موقت ساخته شده
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // وقتی لینک ایمیل ریست پسورد کلیک می‌شه، Supabase یه سشن موقت
    // با رویداد PASSWORD_RECOVERY می‌سازه. تا وقتی این رویداد نیومده
    // فرم رو نشون نمی‌دیم.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // اگه کاربر صفحه رو رفرش کرده و سشن از قبل موجوده
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشه");
      return;
    }
    if (password !== confirm) {
      setError("رمز عبور و تکرارش یکی نیستن");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setError("مشکلی پیش اومد، دوباره امتحان کن");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/admin"), 1800);
  };

  if (done) {
    return (
      <div style={{ maxWidth: 380, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <CheckCircle2 size={30} color="#22E5C9" style={{ margin: "0 auto 10px" }} />
        <h1 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 20 }}>
          رمز عبور با موفقیت تغییر کرد
        </h1>
        <p style={{ color: "var(--text-mut)", fontSize: 13, marginTop: 8 }}>
          داری منتقل می‌شی به پنل مدیریت...
        </p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ maxWidth: 380, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <p style={{ color: "var(--text-mut)", fontSize: 13.5 }}>
          در حال بررسی لینک... اگه از طریق لینک ایمیل ریست پسورد اومدی و این پیام موند،
          یعنی لینک منقضی شده — دوباره از پنل ادمین درخواست ریست بده.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 380, margin: "0 auto", padding: "80px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <KeyRound size={30} color="var(--text-mut)" style={{ margin: "0 auto 10px" }} />
        <h1 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 20 }}>
          تنظیم رمز عبور جدید
        </h1>
      </div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="password"
          placeholder="رمز عبور جدید"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="تکرار رمز عبور جدید"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={inputStyle}
        />
        {error && (
          <div style={{ color: "#2F86FF", fontSize: 12.5, background: "#2F86FF22", borderRadius: 10, padding: "8px 12px" }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          style={{
            background: "#2F86FF",
            color: "var(--ink)",
            border: "none",
            borderRadius: 12,
            padding: "13px 0",
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            cursor: "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "در حال ذخیره..." : "ذخیره رمز جدید"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  background: "var(--surface)",
  border: "1px solid var(--surface2)",
  borderRadius: 12,
  padding: "13px 16px",
  color: "var(--text-hi)",
  fontFamily: "Vazirmatn",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
