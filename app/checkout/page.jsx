"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/Providers";
import { money, discountedPrice } from "@/lib/data";
import { Copy, CheckCircle } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [trackingCode, setTrackingCode] = useState("");

  const [transactionTime, setTransactionTime] =
    useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [copied, setCopied] = useState(false);

  // =========================
  // شماره کارت
  // =========================

  const cardNumber = "6037991234567890";

  // =========================
  // مبلغ کل
  // =========================

  const total = cart.reduce(
    (sum, item) =>
      sum +
      discountedPrice(item.product) *
        item.qty,
    0
  );

  // =========================
  // تغییر فرم
  // =========================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // کپی شماره کارت
  // =========================

  const copyCardNumber = async () => {
    try {
      await navigator.clipboard.writeText(
        cardNumber
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("COPY ERROR:", error);

      try {
        const textarea =
          document.createElement("textarea");

        textarea.value = cardNumber;

        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand("copy");

        document.body.removeChild(textarea);

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (fallbackError) {
        console.error(
          "FALLBACK COPY ERROR:",
          fallbackError
        );
      }
    }
  };

  // =========================
  // مرحله اول
  // اطلاعات مشتری
  // =========================

  const goToPayment = (e) => {
    e.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError(
        "لطفاً نام و نام خانوادگی را وارد کنید."
      );
      return;
    }

    if (!form.phone.trim()) {
      setError(
        "لطفاً شماره موبایل را وارد کنید."
      );
      return;
    }

    if (!form.address.trim()) {
      setError(
        "لطفاً آدرس کامل را وارد کنید."
      );
      return;
    }

    if (cart.length === 0) {
      setError("سبد خرید خالی است.");
      return;
    }

    setStep(2);
  };

  // =========================
  // مرحله دوم
  // ثبت پرداخت
  // =========================

  const submitPayment = async (e) => {
    e.preventDefault();

    setError("");

    if (!trackingCode.trim()) {
      setError(
        "لطفاً کد پیگیری واریز را وارد کنید."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            customer: {
              name: form.name.trim(),
              phone: form.phone.trim(),
              address: form.address.trim(),
            },

            payment: {
              trackingCode:
                trackingCode.trim(),

              transactionTime:
                transactionTime.trim(),
            },

            items: cart.map((item) => ({
              productId:
                item.product.id,

              qty: item.qty,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "ثبت سفارش انجام نشد."
        );
      }

      // فقط بعد از ثبت واقعی سفارش
      // به صفحه موفقیت می رویم

      router.push(
        `/order-success?id=${data.order.id}`
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "خطایی هنگام ثبت سفارش رخ داد."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // سبد خالی
  // =========================

  if (cart.length === 0) {
    return (
      <div
        dir="rtl"
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: "80px 20px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            marginBottom: 15,
          }}
        >
          سبد خرید خالی است
        </h1>

        <button
          onClick={() =>
            router.push("/shop")
          }
          style={{
            background: "#22E5C9",
            border: "none",
            borderRadius: 12,
            padding:
              "12px 28px",
            fontFamily:
              "Vazirmatn",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          بازگشت به فروشگاه
        </button>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding:
          "40px 20px 80px",
      }}
    >
      {/* ========================= */}
      {/* عنوان */}
      {/* ========================= */}

      <h1
        style={{
          fontFamily: "Vazirmatn",
          fontWeight: 800,
          fontSize: 26,
          marginBottom: 30,
        }}
      >
        {step === 1
          ? "اطلاعات سفارش"
          : "پرداخت سفارش"}
      </h1>

      {/* ========================= */}
      {/* STEP 1 */}
      {/* ========================= */}

      {step === 1 && (
        <form
          onSubmit={goToPayment}
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) minmax(280px, 380px)",
            gap: 20,
          }}
        >
          {/* اطلاعات مشتری */}

          <div
            style={{
              background:
                "var(--surface)",
              borderRadius: 18,
              padding: 22,
            }}
          >
            <h2
              style={{
                fontFamily:
                  "Vazirmatn",
                fontSize: 18,
                marginBottom: 20,
              }}
            >
              مشخصات گیرنده
            </h2>

            <label style={labelStyle}>
              نام و نام خانوادگی
            </label>

            <input
              name="name"
              value={form.name}
              onChange={
                handleChange
              }
              placeholder="مثلاً علی رضایی"
              style={inputStyle}
            />

            <label style={labelStyle}>
              شماره موبایل
            </label>

            <input
              name="phone"
              value={form.phone}
              onChange={
                handleChange
              }
              placeholder="09123456789"
              inputMode="tel"
              style={inputStyle}
            />

            <label style={labelStyle}>
              آدرس کامل
            </label>

            <textarea
              name="address"
              value={form.address}
              onChange={
                handleChange
              }
              placeholder="استان، شهر، خیابان، کوچه، پلاک..."
              rows={5}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />

            {error && (
              <ErrorBox>
                {error}
              </ErrorBox>
            )}
          </div>

          {/* خلاصه سفارش */}

          <div
            style={{
              background:
                "var(--surface)",
              borderRadius: 18,
              padding: 22,
              height: "fit-content",
            }}
          >
            <h2
              style={{
                fontFamily:
                  "Vazirmatn",
                fontSize: 18,
                marginBottom: 18,
              }}
            >
              خلاصه سفارش
            </h2>

            <OrderSummary
              cart={cart}
              total={total}
            />

            <button
              type="submit"
              style={primaryButton}
            >
              ادامه و پرداخت
            </button>
          </div>
        </form>
      )}

      {/* ========================= */}
      {/* STEP 2 */}
      {/* ========================= */}

      {step === 2 && (
        <form
          onSubmit={submitPayment}
          style={{
            maxWidth: 650,
            margin: "0 auto",
          }}
        >
          {/* کارت پرداخت */}

          <div
            style={{
              background:
                "var(--surface)",
              borderRadius: 20,
              padding: 25,
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontFamily:
                  "Vazirmatn",
                fontSize: 20,
                fontWeight: 900,
                marginBottom: 10,
              }}
            >
              پرداخت سفارش
            </h2>

            <p
              style={{
                fontFamily:
                  "Vazirmatn",
                fontSize: 13,
                color:
                  "var(--text-mut)",
                lineHeight: 1.9,
                marginBottom: 20,
              }}
            >
              لطفاً مبلغ سفارش را به
              شماره کارت زیر واریز کنید
              و سپس کد پیگیری تراکنش را
              وارد کنید.
            </p>

            {/* مبلغ */}

            <div
              style={{
                background:
                  "var(--bg)",
                borderRadius: 14,
                padding: 16,
                marginBottom: 15,
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
              }}
            >
              <span
                style={{
                  fontFamily:
                    "Vazirmatn",
                  fontSize: 13,
                  color:
                    "var(--text-mut)",
                }}
              >
                مبلغ قابل پرداخت
              </span>

              <strong
                style={{
                  fontFamily:
                    "Vazirmatn",
                  fontSize: 18,
                }}
              >
                {money(total)}
              </strong>
            </div>

            {/* شماره کارت */}

            <button
              type="button"
              onClick={
                copyCardNumber
              }
              style={{
                width: "100%",
                border:
                  "1px solid var(--surface2)",
                background:
                  "var(--bg)",
                borderRadius: 14,
                padding:
                  "17px 12px",
                cursor: "pointer",
                color:
                  "var(--text-hi)",
                fontFamily:
                  "Vazirmatn",
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: 1.5,
                direction: "ltr",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                gap: 10,
              }}
            >
              <span>
                {cardNumber}
              </span>

              {copied ? (
                <span
                  style={{
                    color:
                      "#22E5C9",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  Copied ✓
                </span>
              ) : (
                <Copy size={17} />
              )}
            </button>

            <div
              style={{
                textAlign:
                  "center",
                fontFamily:
                  "Vazirmatn",
                fontSize: 12,
                color:
                  "var(--text-mut)",
                marginTop: 9,
              }}
            >
              برای کپی شماره کارت
              روی آن کلیک کنید
            </div>
          </div>

          {/* ========================= */}
          {/* کد پیگیری */}
          {/* ========================= */}

          <div
            style={{
              background:
                "var(--surface)",
              borderRadius: 20,
              padding: 25,
            }}
          >
            <h2
              style={{
                fontFamily:
                  "Vazirmatn",
                fontSize: 18,
                fontWeight: 900,
                marginBottom: 15,
              }}
            >
              ثبت اطلاعات پرداخت
            </h2>

            <label
              style={labelStyle}
            >
              کد پیگیری تراکنش
            </label>

            <input
              value={trackingCode}
              onChange={(e) =>
                setTrackingCode(
                  e.target.value
                )
              }
              placeholder="کد پیگیری واریز را وارد کنید"
              inputMode="numeric"
              style={{
                ...inputStyle,
                fontSize: 15,
                direction: "ltr",
                textAlign: "left",
              }}
            />

            <label
              style={labelStyle}
            >
              ساعت تراکنش
              <span
                style={{
                  color:
                    "var(--text-mut)",
                  fontSize: 11,
                  marginRight: 5,
                }}
              >
                (اختیاری)
              </span>
            </label>

            <input
              type="text"
              value={
                transactionTime
              }
              onChange={(e) =>
                setTransactionTime(
                  e.target.value
                )
              }
              placeholder="مثلاً 14:35"
              style={{
                ...inputStyle,
                direction: "ltr",
                textAlign: "left",
              }}
            />

            {error && (
              <ErrorBox>
                {error}
              </ErrorBox>
            )}

            {/* ثبت نهایی */}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...primaryButton,
                marginTop: 5,
                opacity:
                  loading
                    ? 0.6
                    : 1,
                cursor:
                  loading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading
                ? "در حال ثبت سفارش..."
                : "ثبت پرداخت و تکمیل سفارش"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setError("");
                setStep(1);
              }}
              style={{
                width: "100%",
                marginTop: 10,
                background:
                  "transparent",
                border:
                  "1px solid var(--surface2)",
                color:
                  "var(--text-hi)",
                borderRadius: 12,
                padding:
                  "12px 0",
                fontFamily:
                  "Vazirmatn",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              بازگشت به اطلاعات سفارش
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ========================================
// خلاصه سفارش
// ========================================

function OrderSummary({
  cart,
  total,
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection:
            "column",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {cart.map((item) => (
          <div
            key={
              item.product.id
            }
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 10,
              fontSize: 13,
              fontFamily:
                "Vazirmatn",
            }}
          >
            <span>
              {item.product.name} ×{" "}
              {item.qty}
            </span>

            <span
              style={{
                whiteSpace:
                  "nowrap",
              }}
            >
              {money(
                discountedPrice(
                  item.product
                ) * item.qty
              )}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop:
            "1px solid var(--surface2)",
          paddingTop: 15,
          display: "flex",
          justifyContent:
            "space-between",
          fontWeight: 800,
          fontSize: 17,
          marginBottom: 20,
          fontFamily:
            "Vazirmatn",
        }}
      >
        <span>
          مبلغ نهایی
        </span>

        <span>
          {money(total)}
        </span>
      </div>
    </>
  );
}

// ========================================
// خطا
// ========================================

function ErrorBox({ children }) {
  return (
    <div
      style={{
        marginTop: 15,
        marginBottom: 15,
        padding: 12,
        borderRadius: 10,
        background:
          "#ff3b3b18",
        color: "#ff6b6b",
        fontSize: 13,
        fontFamily:
          "Vazirmatn",
      }}
    >
      {children}
    </div>
  );
}

// ========================================
// استایل
// ========================================

const labelStyle = {
  display: "block",
  fontSize: 13,
  marginBottom: 7,
  fontFamily: "Vazirmatn",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "var(--bg)",
  border:
    "1px solid var(--surface2)",
  color: "var(--text-hi)",
  borderRadius: 10,
  padding: "12px 13px",
  outline: "none",
  fontFamily: "Vazirmatn",
  fontSize: 13,
  marginBottom: 16,
};

const primaryButton = {
  width: "100%",
  background: "#22E5C9",
  color: "#061014",
  border: "none",
  borderRadius: 12,
  padding: "14px 0",
  fontFamily: "Vazirmatn",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
};
