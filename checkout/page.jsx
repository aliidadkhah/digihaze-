"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/Providers";
import { money, discountedPrice } from "@/lib/data";

const CARD_NUMBER = "5022291316719168";
const CARD_DISPLAY = "5022 2913 1671 9168";
const CARD_OWNER = "علی دادخواه";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [payment, setPayment] = useState({
    trackingCode: "",
    transactionTime: "",
  });

  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const total = cart.reduce(
    (sum, item) =>
      sum + discountedPrice(item.product) * item.qty,
    0
  );

  function updateForm(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function copyCard() {
    try {
      await navigator.clipboard.writeText(CARD_NUMBER);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  function continueToPayment() {
    setError("");

    if (!form.name.trim()) {
      setError("لطفاً نام و نام خانوادگی را وارد کنید.");
      return;
    }

    if (!form.phone.trim()) {
      setError("لطفاً شماره موبایل را وارد کنید.");
      return;
    }

    if (!form.address.trim()) {
      setError("لطفاً آدرس کامل را وارد کنید.");
      return;
    }

    if (cart.length === 0) {
      setError("سبد خرید شما خالی است.");
      return;
    }

    setStep(2);
  }

  async function submitOrder() {
    setError("");

    if (!payment.trackingCode.trim()) {
      setError("لطفاً کد پیگیری تراکنش را وارد کنید.");
      return;
    }

    if (!payment.transactionTime.trim()) {
      setError("لطفاً ساعت تراکنش را وارد کنید.");
      return;
    }

    if (cart.length === 0) {
      setError("سبد خرید شما خالی است.");
      return;
    }

    try {
      setLoading(true);

      const items = cart.map((item) => ({
        productId: item.product.id,
        qty: item.qty,
      }));

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,

          customer: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
          },

          payment: {
            trackingCode: payment.trackingCode.trim(),
            transactionTime: payment.transactionTime.trim(),
          },
        }),
      });

      /*
       * مهم:
       * اول متن پاسخ را می‌خوانیم.
       * این کار باعث می‌شود اگر سرور به جای JSON
       * صفحه HTML یا خطای دیگری برگرداند،
       * خطای "Unexpected token <" نگیریم.
       */
      const responseText = await response.text();

      let data = null;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "پاسخ نامعتبر از سرور دریافت شد. لطفاً دوباره تلاش کنید."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error || "ثبت سفارش انجام نشد."
        );
      }

      /*
       * سفارش ثبت شده را نگه می‌داریم
       * تا مرحله موفقیت بتواند اطلاعات واقعی سفارش
       * را نمایش دهد.
       */
      if (data?.order) {
        setOrder(data.order);
      } else {
        /*
         * اگر API فقط success برگرداند،
         * اطلاعات موجود فرم را نگه می‌داریم.
         */
        setOrder({
          id: data?.order?.id || data?.id || "—",

          customer_name: form.name.trim(),
          customer_phone: form.phone.trim(),
          customer_address: form.address.trim(),

          total: total,

          payment_tracking_code:
            payment.trackingCode.trim(),

          payment_transaction_time:
            payment.transactionTime.trim(),
        });
      }

      /*
       * خیلی مهم:
       * دیگر router.push به order-success نداریم.
       * مستقیماً مرحله موفقیت را نمایش می‌دهیم.
       */
      setStep(3);
    } catch (err) {
      console.error("Submit order error:", err);

      setError(
        err?.message ||
          "خطایی در ثبت سفارش رخ داد. دوباره تلاش کنید."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * اگر سبد خالی باشد و هنوز به مرحله موفقیت نرسیده باشیم
   */
  if (cart.length === 0 && step !== 3) {
    return (
      <main
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: "80px 20px",
          textAlign: "center",
          fontFamily: "Vazirmatn, sans-serif",
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 20,
          }}
        >
          سبد خرید خالی است
        </h1>

        <button
          onClick={() => router.push("/shop")}
          style={{
            background: "#22E5C9",
            color: "#061014",
            border: "none",
            borderRadius: 12,
            padding: "13px 28px",
            fontFamily: "Vazirmatn, sans-serif",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          بازگشت به فروشگاه
        </button>
      </main>
    );
  }

  return (
    <>
      <main
        dir="rtl"
        style={{
          width: "100%",
          maxWidth: 720,
          margin: "0 auto",
          padding: "40px 20px 100px",
          boxSizing: "border-box",
          fontFamily: "Vazirmatn, sans-serif",
        }}
      >
        {/* عنوان */}
        <div
          style={{
            marginBottom: 28,
            textAlign: "right",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            تکمیل سفارش
          </h1>

          {step !== 3 && (
            <p
              style={{
                marginTop: 8,
                color: "var(--text-mut)",
                fontSize: 14,
              }}
            >
              سفارش خود را در چند مرحله تکمیل کنید.
            </p>
          )}
        </div>

        {/* ========================= */}
        {/* STEP 1 */}
        {/* ========================= */}

        {step === 1 && (
          <section
            style={{
              background: "var(--surface)",
              border: "1px solid var(--surface2)",
              borderRadius: 20,
              padding: 22,
              boxSizing: "border-box",
            }}
          >
            <h2
              style={{
                margin: "0 0 22px",
                fontSize: 19,
                fontWeight: 800,
              }}
            >
              اطلاعات گیرنده
            </h2>

            {/* نام */}
            <div style={fieldWrapper}>
              <label style={labelStyle}>
                نام و نام خانوادگی
              </label>

              <input
                className="checkout-input"
                type="text"
                value={form.name}
                onChange={(e) =>
                  updateForm("name", e.target.value)
                }
                placeholder="مثلاً علی رضایی"
                autoComplete="name"
              />
            </div>

            {/* موبایل */}
            <div style={fieldWrapper}>
              <label style={labelStyle}>
                شماره موبایل
              </label>

              <input
                className="checkout-input"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) =>
                  updateForm("phone", e.target.value)
                }
                placeholder="09123456789"
                autoComplete="tel"
                dir="ltr"
              />
            </div>

            {/* آدرس */}
            <div style={fieldWrapper}>
              <label style={labelStyle}>
                آدرس کامل
              </label>

              <textarea
                className="checkout-input"
                value={form.address}
                onChange={(e) =>
                  updateForm("address", e.target.value)
                }
                placeholder="استان، شهر، خیابان، کوچه، پلاک..."
                rows={5}
              />
            </div>

            {/* مبلغ */}
            <div style={totalBoxStyle}>
              <span>مبلغ سفارش</span>

              <strong>
                {money(total)}
              </strong>
            </div>

            {error && (
              <div style={errorStyle}>
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={continueToPayment}
              style={mainButtonStyle}
            >
              ادامه فرآیند پرداخت
            </button>
          </section>
        )}

        {/* ========================= */}
        {/* STEP 2 */}
        {/* ========================= */}

        {step === 2 && (
          <section
            style={{
              background: "var(--surface)",
              border: "1px solid var(--surface2)",
              borderRadius: 20,
              padding: 22,
              boxSizing: "border-box",
            }}
          >
            <h2
              style={{
                margin: "0 0 10px",
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              پرداخت کارت به کارت
            </h2>

            <p
              style={{
                margin: "0 0 22px",
                color: "var(--text-mut)",
                fontSize: 13,
                lineHeight: 2,
              }}
            >
              ابتدا مبلغ سفارش را به شماره کارت زیر
              واریز کنید، سپس کد پیگیری و ساعت تراکنش
              را وارد کنید.
            </p>

            {/* کارت بانکی */}
            <button
              type="button"
              onClick={copyCard}
              aria-label="کپی شماره کارت"
              style={{
                width: "100%",
                border: "none",
                borderRadius: 18,
                padding: "24px 15px",
                background:
                  "linear-gradient(135deg, #171717, #090909)",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "Vazirmatn, sans-serif",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.65,
                  marginBottom: 8,
                }}
              >
                شماره کارت
              </div>

              <div
                style={{
                  direction: "ltr",
                  fontFamily: "Arial, sans-serif",
                  fontSize:
                    "clamp(18px, 5vw, 28px)",
                  fontWeight: 800,
                  letterSpacing: 1,
                  whiteSpace: "nowrap",
                  marginBottom: 15,
                }}
              >
                {CARD_DISPLAY}
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {CARD_OWNER}
              </div>

              <div
                style={{
                  marginTop: 15,
                  fontSize: 12,
                  color: copied
                    ? "#22E5C9"
                    : "rgba(255,255,255,.6)",
                  fontWeight: 700,
                }}
              >
                {copied
                  ? "Copied ✓"
                  : "برای کپی شماره کارت ضربه بزنید"}
              </div>
            </button>

            {/* مبلغ */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                margin: "20px 0",
                padding: 16,
                borderRadius: 13,
                background: "var(--bg)",
              }}
            >
              <span>مبلغ قابل پرداخت</span>

              <strong
                style={{
                  fontSize: 17,
                  whiteSpace: "nowrap",
                }}
              >
                {money(total)}
              </strong>
            </div>

            {/* کد پیگیری */}
            <div style={fieldWrapper}>
              <label style={labelStyle}>
                کد پیگیری تراکنش
              </label>

              <input
                className="checkout-input"
                type="text"
                inputMode="numeric"
                value={payment.trackingCode}
                onChange={(e) =>
                  setPayment((prev) => ({
                    ...prev,
                    trackingCode: e.target.value,
                  }))
                }
                placeholder="کد پیگیری را وارد کنید"
                dir="ltr"
              />
            </div>

            {/* ساعت */}
            <div style={fieldWrapper}>
              <label style={labelStyle}>
                ساعت تراکنش
              </label>

              <input
                className="checkout-input"
                type="text"
                inputMode="numeric"
                value={payment.transactionTime}
                onChange={(e) =>
                  setPayment((prev) => ({
                    ...prev,
                    transactionTime: e.target.value,
                  }))
                }
                placeholder="مثلاً 14:35"
                dir="ltr"
              />
            </div>

            {error && (
              <div style={errorStyle}>
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={submitOrder}
              disabled={loading}
              style={{
                ...mainButtonStyle,
                opacity: loading ? 0.55 : 1,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "در حال ثبت سفارش..."
                : "ثبت نهایی سفارش"}
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
                padding: 14,
                border: "1px solid var(--surface2)",
                borderRadius: 14,
                background: "transparent",
                color: "var(--text-hi)",
                fontFamily: "Vazirmatn, sans-serif",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              بازگشت
            </button>
          </section>
        )}

        {/* ========================= */}
        {/* STEP 3 - SUCCESS */}
        {/* ========================= */}

        {step === 3 && (
          <section
            style={{
              background: "var(--surface)",
              border: "1px solid var(--surface2)",
              borderRadius: 22,
              padding: 25,
              boxSizing: "border-box",
            }}
          >
            {/* موفقیت */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  margin: "0 auto 18px",
                  borderRadius: "50%",
                  background: "#22E5C920",
                  color: "#22E5C9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 38,
                  fontWeight: 900,
                }}
              >
                ✓
              </div>

              <h1
                style={{
                  margin: "0 0 10px",
                  fontSize: 25,
                  fontWeight: 900,
                }}
              >
                سفارش شما با موفقیت ثبت شد
              </h1>

              <p
                style={{
                  margin: 0,
                  color: "var(--text-mut)",
                  fontSize: 14,
                  lineHeight: 2,
                }}
              >
                اطلاعات سفارش شما با موفقیت دریافت شد.
              </p>
            </div>

            {/* شماره سفارش */}
            <div style={successBoxStyle}>
              <div style={rowStyle}>
                <span>شماره سفارش</span>

                <strong>
                  #{order?.id || "—"}
                </strong>
              </div>
            </div>

            {/* اطلاعات گیرنده */}
            <div style={successBoxStyle}>
              <h2 style={successTitleStyle}>
                اطلاعات گیرنده
              </h2>

              <div style={rowStyle}>
                <span>نام و نام خانوادگی</span>

                <strong>
                  {order?.customer_name ||
                    form.name}
                </strong>
              </div>

              <div style={rowStyle}>
                <span>شماره موبایل</span>

                <strong dir="ltr">
                  {order?.customer_phone ||
                    form.phone}
                </strong>
              </div>

              <div
                style={{
                  paddingTop: 12,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    color: "var(--text-mut)",
                    marginBottom: 6,
                  }}
                >
                  آدرس
                </div>

                <strong
                  style={{
                    lineHeight: 1.9,
                  }}
                >
                  {order?.customer_address ||
                    form.address}
                </strong>
              </div>
            </div>

            {/* اطلاعات پرداخت */}
            <div style={successBoxStyle}>
              <h2 style={successTitleStyle}>
                اطلاعات پرداخت
              </h2>

              <div style={rowStyle}>
                <span>مبلغ سفارش</span>

                <strong>
                  {money(
                    Number(
                      order?.total ?? total
                    )
                  )}
                </strong>
              </div>

              <div style={rowStyle}>
                <span>روش پرداخت</span>

                <strong>
                  کارت به کارت
                </strong>
              </div>

              <div style={rowStyle}>
                <span>کد پیگیری</span>

                <strong dir="ltr">
                  {order?.payment_tracking_code ||
                    payment.trackingCode}
                </strong>
              </div>

              <div style={rowStyle}>
                <span>زمان تراکنش</span>

                <strong dir="ltr">
                  {order?.payment_transaction_time ||
                    payment.transactionTime}
                </strong>
              </div>
            </div>

            {/* وضعیت */}
            <div
              style={{
                background: "#22E5C915",
                border: "1px solid #22E5C940",
                borderRadius: 14,
                padding: 15,
                textAlign: "center",
                color: "#22E5C9",
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 2,
                marginBottom: 20,
              }}
            >
              سفارش شما در انتظار بررسی و تأیید پرداخت
              است.
            </div>

            <button
              type="button"
              onClick={() => router.push("/shop")}
              style={{
                width: "100%",
                background: "#22E5C9",
                color: "#061014",
                border: "none",
                borderRadius: 12,
                padding: "14px",
                fontFamily:
                  "Vazirmatn, sans-serif",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              بازگشت به فروشگاه
            </button>
          </section>
        )}
      </main>

      <style jsx>{`
        .checkout-input {
          display: block;
          width: 100%;
          min-width: 0;
          max-width: 100%;
          padding: 14px;
          box-sizing: border-box;
          border: 1px solid var(--surface2);
          border-radius: 12px;
          outline: none;
          background: var(--bg);
          color: var(--text-hi);
          font-family: Vazirmatn, sans-serif;
          font-size: 14px;
          line-height: 1.6;
        }

        .checkout-input:focus {
          border-color: #22e5c9;
        }

        textarea.checkout-input {
          min-height: 130px;
          resize: vertical;
        }

        @media (max-width: 600px) {
          .checkout-input {
            font-size: 14px;
            padding: 13px 12px;
          }
        }
      `}</style>
    </>
  );
}

/* ========================= */
/* STYLES */
/* ========================= */

const fieldWrapper = {
  width: "100%",
  marginBottom: 17,
};

const labelStyle = {
  display: "block",
  marginBottom: 7,
  fontSize: 13,
  fontWeight: 700,
  color: "var(--text-hi)",
};

const totalBoxStyle = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 15,
  marginTop: 25,
  padding: 17,
  boxSizing: "border-box",
  borderRadius: 13,
  background: "var(--bg)",
  fontSize: 14,
};

const mainButtonStyle = {
  display: "block",
  width: "100%",
  marginTop: 20,
  padding: 15,
  boxSizing: "border-box",
  border: 0,
  borderRadius: 14,
  background: "#22E5C9",
  color: "#061014",
  fontFamily: "Vazirmatn, sans-serif",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
};

const errorStyle = {
  width: "100%",
  marginTop: 15,
  padding: 12,
  boxSizing: "border-box",
  borderRadius: 10,
  background: "#ff3b3b18",
  color: "#ff5f5f",
  fontSize: 13,
  lineHeight: 1.8,
};

const successBoxStyle = {
  background: "var(--bg)",
  borderRadius: 14,
  padding: 18,
  marginBottom: 15,
};

const successTitleStyle = {
  marginTop: 0,
  marginBottom: 15,
  fontSize: 16,
  fontWeight: 800,
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 15,
  padding: "10px 0",
  fontSize: 13,
  borderBottom: "1px solid var(--surface2)",
};
