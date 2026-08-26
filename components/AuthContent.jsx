"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  ShoppingBag,
  Phone,
  PackageSearch,
} from "lucide-react";

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

  const [step, setStep] = useState("phone");

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const validPhone = /^09\d{9}$/.test(phone);

  /*
   * ارسال OTP واقعی
   */

  const sendCode = async (e) => {
    e?.preventDefault();

    setError("");

    if (!validPhone) {
      setError(
        "شماره موبایل را درست وارد کن؛ مثلاً 09123456789"
      );
      return;
    }

    if (timer > 0) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "ارسال کد تایید انجام نشد"
        );
      }

      setCode("");
      setStep("code");
      setTimer(60);
    } catch (error) {
      setError(
        error?.message ||
          "خطایی در ارسال کد تایید رخ داد"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * بررسی OTP واقعی
   */

  const verifyCode = async (e) => {
    e.preventDefault();

    setError("");

    if (!/^\d{5,9}$/.test(code)) {
      setError("کد تایید را کامل وارد کن");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone,
            code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "کد تایید صحیح نیست"
        );
      }

      /*
       * ورود کاربر در Providers
       */

      login(data.user);

      router.push("/");
    } catch (error) {
      setError(
        error?.message ||
          "کد تایید صحیح نیست"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * اگر قبلاً وارد شده
   */

  if (user) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "70px 20px 90px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 74,
            height: 74,
            borderRadius: "50%",
            background: "var(--surface2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
            border: "2px solid #22E5C9",
          }}
        >
          <User
            size={30}
            color="#22E5C9"
          />
        </div>

        <h2
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 20,
            marginBottom: 6,
          }}
        >
          خوش اومدی، {user.name}
        </h2>

        <p
          style={{
            color: "var(--text-mut)",
            fontSize: 13,
            marginBottom: 26,
          }}
        >
          {user.contact}
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            textAlign: "right",
          }}
        >
          <button
            onClick={() => router.push("/shop")}
            style={accountRowStyle}
          >
            <ShoppingBag
              size={16}
              color="var(--text-lo)"
            />
            فروشگاه
          </button>

          <button
            onClick={() => router.push("/cart")}
            style={accountRowStyle}
          >
            <ShoppingBag
              size={16}
              color="var(--text-lo)"
            />
            سبد خرید من
          </button>

          <button
            onClick={() => router.push("/orders")}
            style={accountRowStyle}
          >
            <PackageSearch
              size={16}
              color="var(--text-lo)"
            />
            سفارش‌های من
          </button>

          <button
            onClick={logout}
            style={{
              ...accountRowStyle,
              color: "#2F86FF",
              borderColor: "#3a1440",
            }}
          >
            <LogOut
              size={16}
              color="#2F86FF"
            />
            خروج از حساب
          </button>
        </div>
      </div>
    );
  }

  /*
   * صفحه ورود
   */

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "0 auto",
        padding: "60px 20px 90px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        <Badge bg="#FF8A3D">
          ورود سریع
        </Badge>

        <h1
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 26,
            margin: "16px 0 6px",
          }}
        >
          {step === "phone"
            ? "ورود با شماره موبایل"
            : "کد تایید رو وارد کن"}
        </h1>

        <p
          style={{
            color: "var(--text-mut)",
            fontSize: 13,
          }}
        >
          {step === "phone"
            ? "کد تایید برات پیامک می‌شه"
            : `کد تایید به ${phone} ارسال شد`}
        </p>
      </div>

      {step === "phone" && (
        <form
          onSubmit={sendCode}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              position: "relative",
            }}
          >
            <Phone
              size={16}
              color="var(--text-mut)"
              style={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform:
                  "translateY(-50%)",
              }}
            />

            <input
              type="tel"
              inputMode="numeric"
              placeholder="09123456789"
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 11)
                )
              }
              style={{
                ...inputStyle,
                width: "100%",
                paddingRight: 42,
                direction: "ltr",
                textAlign: "right",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                color: "#2F86FF",
                fontSize: 12.5,
                background: "#2F86FF22",
                borderRadius: 10,
                padding: "8px 12px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#2F86FF",
              color: "var(--ink)",
              border: "none",
              borderRadius: 12,
              padding: "13px 0",
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              fontSize: 14,
              cursor: loading
                ? "default"
                : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "در حال ارسال..."
              : "دریافت کد تایید"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form
          onSubmit={verifyCode}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="کد تایید"
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 9)
              )
            }
            style={{
              ...inputStyle,
              textAlign: "center",
              letterSpacing: 6,
              fontSize: 20,
              direction: "ltr",
            }}
            autoFocus
          />

          {error && (
            <div
              style={{
                color: "#2F86FF",
                fontSize: 12.5,
                background: "#2F86FF22",
                borderRadius: 10,
                padding: "8px 12px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#2F86FF",
              color: "var(--ink)",
              border: "none",
              borderRadius: 12,
              padding: "13px 0",
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              fontSize: 14,
              cursor: loading
                ? "default"
                : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "در حال بررسی..."
              : "تایید و ورود"}
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12.5,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-mut)",
                cursor: "pointer",
                fontFamily: "Vazirmatn",
              }}
            >
              ویرایش شماره
            </button>

            <button
              type="button"
              disabled={
                timer > 0 || loading
              }
              onClick={sendCode}
              style={{
                background: "none",
                border: "none",
                color:
                  timer > 0
                    ? "var(--text-faint)"
                    : "#22E5C9",
                cursor:
                  timer > 0 || loading
                    ? "default"
                    : "pointer",
                fontFamily: "Vazirmatn",
              }}
            >
              {timer > 0
                ? `ارسال مجدد (${timer})`
                : "ارسال مجدد کد"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
