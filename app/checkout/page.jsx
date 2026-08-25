"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/Providers";
import { money, discountedPrice } from "@/lib/data";
import { Copy } from "lucide-react";

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
  const [transactionTime, setTransactionTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const cardNumber = "6037991234567890";

  const total = cart.reduce(
    (sum, item) =>
      sum + discountedPrice(item.product) * item.qty,
    0
  );

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const copyCardNumber = async () => {
    try {
      await navigator.clipboard.writeText(cardNumber);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("COPY ERROR:", error);
    }
  };

  const goToPayment = (e) => {
    e.preventDefault();

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
      setError("سبد خرید خالی است.");
      return;
    }

    setStep(2);
  };

  const submitPayment = async (e) => {
    e.preventDefault();

    setError("");

    if (!trackingCode.trim()) {
      setError("لطفاً کد پیگیری واریز را وارد کنید.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          customer: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
          },

          payment: {
            trackingCode: trackingCode.trim(),
            transactionTime: transactionTime.trim(),
          },

          items: cart.map((item) => ({
            productId: item.product.id,
            qty: item.qty,
          })),
        }),
      });

      /*
       * اول متن پاسخ را می‌گیریم.
       * این کار باعث می‌شود اگر API به جای JSON
       * یک صفحه HTML خطا برگرداند، برنامه کرش نکند.
       */

      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("SERVER RESPONSE:", responseText);

        throw new Error(
          "پاسخ نامعتبر از سرور دریافت شد. لطفاً دوباره تلاش کنید."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error || "ثبت سفارش انجام نشد."
        );
      }

      if (!data?.order) {
        throw new Error(
          "اطلاعات سفارش از سرور دریافت نشد."
        );
      }

      /*
       * اطلاعات سفارش را قبل از رفتن به صفحه موفقیت
       * داخل sessionStorage ذخیره می‌کنیم.
       */

      sessionStorage.setItem(
        "completedOrder",
        JSON.stringify(data.order)
      );

      /*
       * سپس به صفحه موفقیت می‌رویم.
       */

      router.push("/order-success");

    } catch (err) {
      console.error("ORDER ERROR:", err);

      setError(
        err?.message ||
          "خطایی هنگام ثبت سفارش رخ داد."
      );

    } finally {
      setLoading(false);
    }
  };

  /*
   * سبد خالی
   */

  if (cart.length === 0) {
    return (
      <div
        dir="rtl"
        className="empty-checkout"
      >
        <h1>
          سبد خرید خالی است
        </h1>

        <button
          onClick={() => router.push("/shop")}
          className="primary-button"
        >
          بازگشت به فروشگاه
        </button>

        <style jsx>{`

          .empty-checkout {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 80px 20px;
            text-align: center;
            font-family: Vazirmatn, sans-serif;
            box-sizing: border-box;
          }

          .empty-checkout h1 {
            font-size: 22px;
            font-weight: 800;
            margin-bottom: 20px;
          }

          .primary-button {
            width: 100%;
            background: #22e5c9;
            color: #061014;
            border: none;
            border-radius: 12px;
            padding: 14px;
            font-family: Vazirmatn, sans-serif;
            font-weight: 800;
            cursor: pointer;
          }

        `}</style>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="checkout-page"
    >

      <h1 className="checkout-title">
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
          className="checkout-form"
        >

          {/* اطلاعات مشتری */}

          <div className="checkout-card">

            <h2 className="section-title">
              مشخصات گیرنده
            </h2>

            <label className="label">
              نام و نام خانوادگی
            </label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="مثلاً علی رضایی"
              className="input"
              autoComplete="name"
            />

            <label className="label">
              شماره موبایل
            </label>

            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="09123456789"
              inputMode="tel"
              className="input"
              autoComplete="tel"
              dir="ltr"
            />

            <label className="label">
              آدرس کامل
            </label>

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="استان، شهر، خیابان، کوچه، پلاک..."
              rows={5}
              className="input textarea"
            />

            {error && (
              <ErrorBox>
                {error}
              </ErrorBox>
            )}

          </div>

          {/* خلاصه سفارش */}

          <div className="checkout-card summary-card">

            <h2 className="section-title">
              خلاصه سفارش
            </h2>

            <OrderSummary
              cart={cart}
              total={total}
            />

            <button
              type="submit"
              className="primary-button"
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
          className="payment-form"
        >

          {/* کارت پرداخت */}

          <div className="checkout-card">

            <h2 className="section-title">
              پرداخت سفارش
            </h2>

            <p className="description">
              لطفاً مبلغ سفارش را به شماره کارت زیر
              واریز کنید و سپس کد پیگیری تراکنش را
              وارد کنید.
            </p>

            {/* مبلغ */}

            <div className="payment-total">

              <span>
                مبلغ قابل پرداخت
              </span>

              <strong>
                {money(total)}
              </strong>

            </div>

            {/* شماره کارت */}

            <button
              type="button"
              onClick={copyCardNumber}
              className="card-number-button"
            >

              <span className="card-number">
                {cardNumber}
              </span>

              {copied ? (
                <span className="copied">
                  کپی شد ✓
                </span>
              ) : (
                <Copy size={17} />
              )}

            </button>

            <div className="copy-hint">
              برای کپی شماره کارت روی آن کلیک کنید
            </div>

          </div>

          {/* اطلاعات پرداخت */}

          <div className="checkout-card">

            <h2 className="section-title">
              ثبت اطلاعات پرداخت
            </h2>

            <label className="label">
              کد پیگیری تراکنش
            </label>

            <input
              value={trackingCode}
              onChange={(e) =>
                setTrackingCode(e.target.value)
              }
              placeholder="کد پیگیری واریز را وارد کنید"
              inputMode="numeric"
              className="input"
              dir="ltr"
            />

            <label className="label">
              ساعت تراکنش

              <span className="optional">
                (اختیاری)
              </span>
            </label>

            <input
              type="text"
              value={transactionTime}
              onChange={(e) =>
                setTransactionTime(e.target.value)
              }
              placeholder="مثلاً 14:35"
              className="input"
              dir="ltr"
            />

            {error && (
              <ErrorBox>
                {error}
              </ErrorBox>
            )}

            <button
              type="submit"
              disabled={loading}
              className="primary-button submit-button"
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
              className="back-button"
            >
              بازگشت به اطلاعات سفارش
            </button>

          </div>

        </form>
      )}

      <style jsx>{`

        .checkout-page {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px 80px;
          box-sizing: border-box;
          font-family: Vazirmatn, sans-serif;
        }

        .checkout-title {
          margin: 0 0 30px;
          font-size: 26px;
          font-weight: 800;
          color: var(--text-hi);
        }

        /*
         * دسکتاپ
         */

        .checkout-form {
          width: 100%;
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(280px, 380px);
          gap: 20px;
          align-items: start;
        }

        .payment-form {
          width: 100%;
          max-width: 650px;
          margin: 0 auto;
        }

        .checkout-card {
          width: 100%;
          min-width: 0;
          background: var(--surface);
          border-radius: 18px;
          padding: 22px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .summary-card {
          height: fit-content;
        }

        .section-title {
          margin: 0 0 20px;
          font-size: 18px;
          font-weight: 800;
          color: var(--text-hi);
        }

        .label {
          display: block;
          margin-bottom: 7px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-hi);
        }

        .optional {
          margin-right: 6px;
          color: var(--text-mut);
          font-size: 11px;
          font-weight: 400;
        }

        .input {
          display: block;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          margin-bottom: 16px;
          padding: 12px 13px;
          background: var(--bg);
          border: 1px solid var(--surface2);
          color: var(--text-hi);
          border-radius: 10px;
          outline: none;
          font-family: Vazirmatn, sans-serif;
          font-size: 13px;
        }

        .input:focus {
          border-color: #22e5c9;
        }

        .textarea {
          resize: vertical;
          min-height: 130px;
          line-height: 1.8;
        }

        .description {
          margin: -5px 0 20px;
          color: var(--text-mut);
          font-size: 13px;
          line-height: 1.9;
        }

        .payment-total {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 16px;
          margin-bottom: 15px;
          background: var(--bg);
          border-radius: 14px;
          box-sizing: border-box;
          color: var(--text-mut);
          font-size: 13px;
        }

        .payment-total strong {
          color: var(--text-hi);
          font-size: 18px;
          white-space: nowrap;
        }

        .card-number-button {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 17px 12px;
          box-sizing: border-box;
          border: 1px solid var(--surface2);
          background: var(--bg);
          color: var(--text-hi);
          border-radius: 14px;
          cursor: pointer;
          font-family: Arial, sans-serif;
        }

        .card-number {
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: clamp(16px, 3vw, 21px);
          font-weight: 900;
          letter-spacing: 1.5px;
          direction: ltr;
          white-space: nowrap;
        }

        .copied {
          color: #22e5c9;
          font-family: Vazirmatn, sans-serif;
          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
        }

        .copy-hint {
          margin-top: 9px;
          text-align: center;
          color: var(--text-mut);
          font-size: 12px;
        }

        .primary-button {
          display: block;
          width: 100%;
          border: none;
          background: #22e5c9;
          color: #061014;
          border-radius: 12px;
          padding: 14px 0;
          font-family: Vazirmatn, sans-serif;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
        }

        .primary-button:hover {
          opacity: 0.9;
        }

        .submit-button {
          margin-top: 5px;
        }

        .primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .back-button {
          display: block;
          width: 100%;
          margin-top: 10px;
          padding: 12px 0;
          background: transparent;
          border: 1px solid var(--surface2);
          color: var(--text-hi);
          border-radius: 12px;
          font-family: Vazirmatn, sans-serif;
          font-weight: 700;
          cursor: pointer;
        }

        .back-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /*
         * تبلت
         */

        @media (max-width: 760px) {

          .checkout-page {
            max-width: 100%;
            padding: 30px 16px 70px;
          }

          .checkout-form {
            grid-template-columns: 1fr !important;
            gap: 15px;
          }

          .checkout-card {
            width: 100%;
            padding: 20px;
          }

          .summary-card {
            order: 2;
          }

        }

        /*
         * موبایل
         */

        @media (max-width: 600px) {

          .checkout-page {
            width: 100%;
            padding: 22px 12px 60px;
            margin: 0;
          }

          .checkout-title {
            font-size: 22px;
            margin-bottom: 18px;
          }

          .checkout-form {
            display: flex;
            flex-direction: column;
            width: 100%;
            gap: 12px;
          }

          .payment-form {
            width: 100%;
            max-width: 100%;
          }

          .checkout-card {
            width: 100%;
            padding: 17px;
            border-radius: 16px;
          }

          .section-title {
            font-size: 17px;
            margin-bottom: 18px;
          }

          .input {
            padding: 13px 12px;
            font-size: 14px;
          }

          .card-number-button {
            padding: 16px 8px;
          }

          .card-number {
            font-size: 15px;
            letter-spacing: 0.5px;
          }

          .payment-total {
            padding: 14px;
          }

          .payment-total strong {
            font-size: 16px;
          }

        }

        /*
         * موبایل خیلی کوچک
         */

        @media (max-width: 380px) {

          .checkout-page {
            padding-left: 8px;
            padding-right: 8px;
          }

          .checkout-card {
            padding: 14px;
          }

          .card-number {
            font-size: 13px;
            letter-spacing: 0;
          }

          .payment-total {
            flex-direction: column;
            align-items: flex-start;
            gap: 7px;
          }

        }

      `}</style>

    </div>
  );
}


/* ========================================
   خلاصه سفارش
======================================== */

function OrderSummary({ cart, total }) {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 20,
        }}
      >

        {cart.map((item) => (
          <div
            key={item.product.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 13,
              fontFamily: "Vazirmatn",
            }}
          >

            <span>
              {item.product.name} × {item.qty}
            </span>

            <span
              style={{
                whiteSpace: "nowrap",
              }}
            >
              {money(
                discountedPrice(item.product) *
                  item.qty
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
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          fontWeight: 800,
          fontSize: 17,
          marginBottom: 20,
          fontFamily: "Vazirmatn",
        }}
      >

        <span>
          مبلغ نهایی
        </span>

        <span style={{ whiteSpace: "nowrap" }}>
          {money(total)}
        </span>

      </div>
    </>
  );
}


/* ========================================
   خطا
======================================== */

function ErrorBox({ children }) {
  return (
    <div
      style={{
        marginTop: 15,
        marginBottom: 15,
        padding: 12,
        borderRadius: 10,
        background: "#ff3b3b18",
        color: "#ff6b6b",
        fontSize: 13,
        fontFamily: "Vazirmatn",
        lineHeight: 1.8,
      }}
    >
      {children}
    </div>
  );
}
