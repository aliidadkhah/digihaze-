"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Copy } from "lucide-react";
import { money, discountedPrice } from "@/lib/data";
import { useCart } from "@/components/Providers";

const CARD_NUMBER = "5022291316719168";
const CARD_HOLDER = "علی دادخواه";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [payment, setPayment] = useState({
    trackingCode: "",
    transactionTime: "",
  });

  const total = cart.reduce(
    (sum, item) =>
      sum + discountedPrice(item.product) * item.qty,
    0
  );

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updatePayment = (field, value) => {
    setPayment((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const continueToPayment = () => {
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

    setStep(2);
  };

  const copyCard = async () => {
    try {
      await navigator.clipboard.writeText(CARD_NUMBER);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("کپی شماره کارت انجام نشد.");
    }
  };

  const submitOrder = async () => {
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
       * به جای response.json() مستقیم،
       * اول متن پاسخ را می‌گیریم تا اگر Cloudflare
       * یا سرور HTML برگرداند، برنامه کرش نکند.
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
       * مهم:
       * دیگر router.push به /order-success نداریم.
       * مستقیماً مرحله سوم را نمایش می‌دهیم.
       */
      setStep(3);

    } catch (err) {
      setError(
        err?.message ||
          "خطایی هنگام ثبت سفارش رخ داد. لطفاً دوباره تلاش کنید."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * اگر سبد خالی است
   */
  if (cart.length === 0 && step !== 3) {
    return (
      <main
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
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          سبد خرید خالی است
        </h1>

        <p
          style={{
            color: "var(--text-mut)",
            marginBottom: 24,
          }}
        >
          ابتدا محصولی به سبد خرید اضافه کنید.
        </p>

        <button
          onClick={() => router.push("/shop")}
          style={primaryButton}
        >
          رفتن به فروشگاه
        </button>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        width: "100%",
        maxWidth: 720,
        margin: "0 auto",
        padding: "40px 20px 80px",
      }}
    >

      {/* عنوان */}
      <div style={{ marginBottom: 30 }}>
        <h1
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 28,
            marginBottom: 10,
          }}
        >
          تکمیل سفارش
        </h1>

        {step !== 3 && (
          <p
            style={{
              color: "var(--text-mut)",
              fontSize: 14,
            }}
          >
            سفارش خود را در چند مرحله تکمیل کنید.
          </p>
        )}
      </div>

      {/* مراحل */}
      {step !== 3 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 30,
          }}
        >
          <Step
            number="1"
            active={step >= 1}
            title="مشخصات"
          />

          <div
            style={{
              width: 50,
              height: 1,
              background: "var(--surface2)",
            }}
          />

          <Step
            number="2"
            active={step >= 2}
            title="پرداخت"
          />
        </div>
      )}

      {/* =========================
          STEP 1
      ========================= */}

      {step === 1 && (
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--surface2)",
            borderRadius: 20,
            padding: 22,
          }}
        >
          <h2
            style={{
              fontFamily: "Vazirmatn",
              fontSize: 19,
              fontWeight: 800,
              marginBottom: 20,
            }}
          >
            اطلاعات گیرنده
          </h2>

          <Field
            label="نام و نام خانوادگی"
            value={form.name}
            onChange={(value) =>
              updateForm("name", value)
            }
            placeholder="مثلاً علی احمدی"
          />

          <Field
            label="شماره موبایل"
            value={form.phone}
            onChange={(value) =>
              updateForm("phone", value)
            }
            placeholder="09xxxxxxxxx"
            type="tel"
          />

          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              آدرس کامل
            </label>

            <textarea
              value={form.address}
              onChange={(e) =>
                updateForm("address", e.target.value)
              }
              placeholder="استان، شهر، خیابان، کوچه، پلاک و واحد"
              rows={4}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>

          {error && <ErrorBox>{error}</ErrorBox>}

          <Summary total={total} />

          <button
            onClick={continueToPayment}
            style={primaryButton}
          >
            ادامه و مشاهده اطلاعات پرداخت
          </button>
        </section>
      )}

      {/* =========================
          STEP 2
      ========================= */}

      {step === 2 && (
        <section>

          {/* اطلاعات کارت */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--surface2)",
              borderRadius: 20,
              padding: 24,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <CreditCard
                size={24}
                color="#22E5C9"
              />

              <h2
                style={{
                  fontFamily: "Vazirmatn",
                  fontSize: 19,
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                پرداخت کارت‌به‌کارت
              </h2>
            </div>

            <div
              style={{
                background: "var(--bg)",
                borderRadius: 16,
                padding: 20,
                textAlign: "center",
                marginBottom: 20,
              }}
            >

              <div
                style={{
                  color: "var(--text-mut)",
                  fontSize: 12,
                  marginBottom: 8,
                }}
              >
                مبلغ قابل پرداخت
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  marginBottom: 20,
                }}
              >
                {money(total)}
              </div>

              <div
                style={{
                  color: "var(--text-mut)",
                  fontSize: 12,
                  marginBottom: 8,
                }}
              >
                شماره کارت
              </div>

              {/* شماره کارت قابل کلیک */}
              <button
                type="button"
                onClick={copyCard}
                style={{
                  display: "block",
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  color: "var(--text-hi)",
                  cursor: "pointer",
                  padding: 5,
                  margin: "0 auto 8px",
                }}
                title="برای کپی کلیک کنید"
              >
                <div
                  style={{
                    direction: "ltr",
                    fontSize: "clamp(18px, 5vw, 24px)",
                    fontWeight: 900,
                    letterSpacing: 2,
                    whiteSpace: "nowrap",
                  }}
                >
                  5022 2913 1671 9168
                </div>
              </button>

              <div
                style={{
                  color: "var(--text-hi)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                به نام {CARD_HOLDER}
              </div>

              {/* دکمه کپی */}
              <button
                type="button"
                onClick={copyCard}
                style={{
                  marginTop: 16,
                  background: "var(--surface2)",
                  color: "var(--text-hi)",
                  border: "none",
                  borderRadius: 10,
                  padding: "9px 15px",
                  cursor: "pointer",
                  fontFamily: "Vazirmatn",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <Copy size={15} />

                {copied
                  ? "Copied ✓"
                  : "کپی شماره کارت"}
              </button>

            </div>

            <div
              style={{
                background: "#22E5C912",
                border: "1px solid #22E5C933",
                borderRadius: 12,
                padding: 14,
                lineHeight: 1.9,
                fontSize: 13,
              }}
            >
              ابتدا مبلغ دقیق سفارش را به شماره کارت بالا
              واریز کنید. سپس کد پیگیری و ساعت تراکنش را
              در قسمت پایین وارد کنید.
            </div>
          </div>

          {/* اطلاعات تراکنش */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--surface2)",
              borderRadius: 20,
              padding: 22,
            }}
          >
            <h2
              style={{
                fontFamily: "Vazirmatn",
                fontSize: 18,
                fontWeight: 800,
                marginBottom: 20,
              }}
            >
              اطلاعات تراکنش
            </h2>

            <Field
              label="کد پیگیری تراکنش"
              value={payment.trackingCode}
              onChange={(value) =>
                updatePayment(
                  "trackingCode",
                  value
                )
              }
              placeholder="کد پیگیری واریز را وارد کنید"
            />

            <Field
              label="ساعت تراکنش"
              value={payment.transactionTime}
              onChange={(value) =>
                updatePayment(
                  "transactionTime",
                  value
                )
              }
              placeholder="مثلاً 14:35"
              type="time"
            />

            {error && <ErrorBox>{error}</ErrorBox>}

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
                disabled={loading}
                style={{
                  flex: 1,
                  background: "var(--surface2)",
                  color: "var(--text-hi)",
                  border: "none",
                  borderRadius: 12,
                  padding: 14,
                  fontFamily: "Vazirmatn",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                بازگشت
              </button>

              <button
                type="button"
                onClick={submitOrder}
                disabled={loading}
                style={{
                  ...primaryButton,
                  flex: 2,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading
                  ? "در حال ثبت سفارش..."
                  : "ثبت نهایی سفارش"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =========================
          STEP 3
      ========================= */}

      {step === 3 && (
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--surface2)",
            borderRadius: 22,
            padding: 35,
            textAlign: "center",
          }}
        >
          <CheckCircle2
            size={64}
            color="#22E5C9"
            style={{
              marginBottom: 18,
            }}
          />

          <h2
            style={{
              fontFamily: "Vazirmatn",
              fontWeight: 900,
              fontSize: 24,
              marginBottom: 12,
            }}
          >
            سفارش شما ثبت شد 🎉
          </h2>

          <p
            style={{
              color: "var(--text-mut)",
              lineHeight: 2,
              fontSize: 14,
              marginBottom: 25,
            }}
          >
            اطلاعات سفارش شما با موفقیت دریافت شد و
            برای بررسی ارسال می‌شود.
            <br />
            پس از بررسی تراکنش، سفارش شما پردازش خواهد شد.
          </p>

          <button
            type="button"
            onClick={() => router.push("/")}
            style={primaryButton}
          >
            بازگشت به فروشگاه
          </button>
        </section>
      )}

    </main>
  );
}


/* =========================
   Components
========================= */

function Step({ number, active, title }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        color: active
          ? "#22E5C9"
          : "var(--text-mut)",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: active
            ? "#22E5C9"
            : "var(--surface2)",
          color: active
            ? "#000"
            : "var(--text-mut)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
        }}
      >
        {number}
      </span>

      {title}
    </div>
  );
}


function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}


function ErrorBox({ children }) {
  return (
    <div
      style={{
        background: "#ff4d4d12",
        border: "1px solid #ff4d4d44",
        color: "#ff7777",
        borderRadius: 10,
        padding: 12,
        fontSize: 13,
        marginBottom: 16,
        lineHeight: 1.8,
      }}
    >
      {children}
    </div>
  );
}


function Summary({ total }) {
  return (
    <div
      style={{
        borderTop: "1px solid var(--surface2)",
        paddingTop: 16,
        marginTop: 20,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 14,
        }}
      >
        <span
          style={{
            color: "var(--text-mut)",
          }}
        >
          مبلغ سفارش
        </span>

        <strong>
          {money(total)}
        </strong>
      </div>
    </div>
  );
}


const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "var(--bg)",
  color: "var(--text-hi)",
  border: "1px solid var(--surface2)",
  borderRadius: 11,
  padding: "12px 13px",
  outline: "none",
  fontFamily: "Vazirmatn",
  fontSize: 13,
};


const primaryButton = {
  width: "100%",
  background: "#22E5C9",
  color: "#000",
  border: "none",
  borderRadius: 12,
  padding: "14px 18px",
  fontFamily: "Vazirmatn",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
};
