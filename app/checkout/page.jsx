"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/Providers";
import { money, discountedPrice } from "@/lib/data";

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = cart.reduce(
    (sum, item) =>
      sum + discountedPrice(item.product) * item.qty,
    0
  );

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handlePaymentChange(e) {
    setPayment({
      ...payment,
      [e.target.name]: e.target.value,
    });
  }

  function goToPayment() {
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
  }

  async function submitOrder(e) {
    e.preventDefault();

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
      setError("سبد خرید خالی است.");
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
            trackingCode:
              payment.trackingCode.trim(),

            transactionTime:
              payment.transactionTime.trim(),
          },

          items: cart.map((item) => ({
            productId: item.product.id,
            qty: item.qty,
          })),
        }),
      });

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "پاسخ سرور نامعتبر است. لطفاً دوباره تلاش کنید."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "ثبت سفارش انجام نشد."
        );
      }

      if (!data.order?.id) {
        throw new Error(
          "شماره سفارش دریافت نشد."
        );
      }

      router.push(
        `/order-success?id=${data.order.id}`
      );
    } catch (err) {
      console.error("CHECKOUT ERROR:", err);

      setError(
        err.message ||
          "خطایی در ثبت سفارش رخ داد."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * سبد خرید خالی
   */

  if (cart.length === 0) {
    return (
      <main className="checkout-empty">
        <h1>سبد خرید خالی است</h1>

        <button
          onClick={() => router.push("/shop")}
          className="shop-button"
        >
          بازگشت به فروشگاه
        </button>

        <style jsx>{`
          .checkout-empty {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 80px 20px;
            text-align: center;
            direction: rtl;
          }

          .checkout-empty h1 {
            font-family: Vazirmatn, sans-serif;
            font-size: 24px;
            font-weight: 800;
            color: var(--text-hi);
          }

          .shop-button {
            margin-top: 20px;
            padding: 13px 28px;
            border: 0;
            border-radius: 12px;
            background: #22e5c9;
            color: #061014;
            font-family: Vazirmatn, sans-serif;
            font-weight: 800;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="checkout-page">

      <h1 className="checkout-title">
        تکمیل سفارش
      </h1>

      {/* =========================
          STEP 1
      ========================== */}

      {step === 1 && (
        <section className="checkout-card">

          <div className="step-number">
            مرحله ۱ از ۲
          </div>

          <h2 className="section-title">
            اطلاعات گیرنده
          </h2>

          <p className="description">
            لطفاً مشخصات گیرنده سفارش را وارد کنید.
          </p>

          <div className="form-group">

            <label>
              نام و نام خانوادگی
            </label>

            <input
              className="checkout-input"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="مثلاً علی رضایی"
              autoComplete="name"
            />

          </div>


          <div className="form-group">

            <label>
              شماره موبایل
            </label>

            <input
              className="checkout-input"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="09123456789"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
            />

          </div>


          <div className="form-group">

            <label>
              آدرس کامل
            </label>

            <textarea
              className="checkout-input address-input"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="استان، شهر، خیابان، کوچه، پلاک..."
              rows={5}
            />

          </div>


          {/* مبلغ */}

          <div className="total-box">

            <span>
              مبلغ سفارش
            </span>

            <strong>
              {money(total)}
            </strong>

          </div>


          {error && (
            <div className="error-box">
              {error}
            </div>
          )}


          <button
            type="button"
            className="main-button"
            onClick={goToPayment}
          >
            ادامه و پرداخت
          </button>

        </section>
      )}


      {/* =========================
          STEP 2
      ========================== */}

      {step === 2 && (
        <section className="checkout-card">

          <div className="step-number">
            مرحله ۲ از ۲
          </div>

          <h2 className="section-title">
            پرداخت کارت به کارت
          </h2>

          <p className="description">
            ابتدا مبلغ سفارش را به شماره کارت زیر
            واریز کنید. سپس کد پیگیری و ساعت تراکنش
            را وارد کنید.
          </p>


          {/* =========================
              BANK CARD
          ========================== */}

          <div className="bank-card">

            <div className="bank-title">
              شماره کارت
            </div>

            <div className="card-number">
              5022 2913 1671 9168
            </div>

            <div className="bank-title owner-label">
              به نام
            </div>

            <div className="card-owner">
              علی دادخواه
            </div>

          </div>


          {/* مبلغ */}

          <div className="payment-total">

            <span>
              مبلغ قابل پرداخت
            </span>

            <strong>
              {money(total)}
            </strong>

          </div>


          {/* کد پیگیری */}

          <div className="form-group">

            <label>
              کد پیگیری تراکنش
            </label>

            <input
              className="checkout-input"
              type="text"
              name="trackingCode"
              value={payment.trackingCode}
              onChange={handlePaymentChange}
              placeholder="کد پیگیری تراکنش را وارد کنید"
              inputMode="numeric"
              dir="ltr"
            />

          </div>


          {/* ساعت تراکنش */}

          <div className="form-group">

            <label>
              ساعت تراکنش
            </label>

            <input
              className="checkout-input"
              type="text"
              name="transactionTime"
              value={payment.transactionTime}
              onChange={handlePaymentChange}
              placeholder="مثلاً 14:35"
              inputMode="numeric"
              dir="ltr"
            />

          </div>


          {error && (
            <div className="error-box">
              {error}
            </div>
          )}


          {/* ثبت سفارش */}

          <button
            type="button"
            className="main-button"
            disabled={loading}
            onClick={submitOrder}
          >
            {loading
              ? "در حال ثبت سفارش..."
              : "تأیید پرداخت و ثبت سفارش"}
          </button>


          {/* بازگشت */}

          <button
            type="button"
            className="back-button"
            disabled={loading}
            onClick={() => {
              setError("");
              setStep(1);
            }}
          >
            بازگشت به اطلاعات گیرنده
          </button>

        </section>
      )}


      <style jsx>{`

        * {
          box-sizing: border-box;
        }


        .checkout-page {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
          padding: 40px 20px 100px;
          direction: rtl;
        }


        .checkout-title {
          margin: 0 0 25px;
          font-family: Vazirmatn, sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: var(--text-hi);
        }


        .checkout-card {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--surface2);
          border-radius: 20px;
          padding: 26px;
          overflow: hidden;
        }


        .step-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 11px;
          margin-bottom: 12px;
          border-radius: 999px;
          background: #22e5c918;
          color: #22e5c9;
          font-family: Vazirmatn, sans-serif;
          font-size: 11px;
          font-weight: 800;
        }


        .section-title {
          margin: 0 0 8px;
          font-family: Vazirmatn, sans-serif;
          font-size: 21px;
          font-weight: 800;
          color: var(--text-hi);
        }


        .description {
          margin: 0 0 24px;
          color: var(--text-mut);
          font-family: Vazirmatn, sans-serif;
          font-size: 13px;
          line-height: 2;
        }


        .form-group {
          width: 100%;
          margin-bottom: 17px;
        }


        .form-group label {
          display: block;
          margin-bottom: 7px;
          font-family: Vazirmatn, sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-hi);
        }


        .checkout-input {
          display: block;
          width: 100%;
          min-width: 0;
          padding: 14px;
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


        .address-input {
          min-height: 130px;
          resize: vertical;
        }


        .total-box {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-top: 25px;
          padding: 17px;
          border-radius: 13px;
          background: var(--bg);
          color: var(--text-hi);
          font-family: Vazirmatn, sans-serif;
        }


        .total-box strong {
          font-size: 17px;
          white-space: nowrap;
        }


        .bank-card {
          width: 100%;
          padding: 25px 20px;
          border-radius: 20px;
          background: #111;
          color: white;
          text-align: center;
          box-shadow:
            0 15px 35px rgba(0, 0, 0, 0.25);
        }


        .bank-title {
          font-family: Vazirmatn, sans-serif;
          font-size: 12px;
          opacity: 0.65;
          margin-bottom: 9px;
        }


        .card-number {
          width: 100%;
          direction: ltr;
          font-family: Arial, sans-serif;
          font-size: clamp(18px, 4vw, 28px);
          font-weight: 800;
          letter-spacing: 1px;
          white-space: nowrap;
          margin-bottom: 22px;
        }


        .owner-label {
          margin-bottom: 6px;
        }


        .card-owner {
          font-family: Vazirmatn, sans-serif;
          font-size: 16px;
          font-weight: 800;
        }


        .payment-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
          padding: 17px;
          border-radius: 13px;
          background: var(--bg);
          color: var(--text-hi);
          font-family: Vazirmatn, sans-serif;
        }


        .payment-total strong {
          font-size: 17px;
          white-space: nowrap;
        }


        .error-box {
          width: 100%;
          margin-top: 15px;
          padding: 12px 14px;
          border-radius: 10px;
          background: #ff3b3b18;
          color: #ff6b6b;
          font-family: Vazirmatn, sans-serif;
          font-size: 13px;
          line-height: 1.8;
        }


        .main-button {
          display: block;
          width: 100%;
          margin-top: 20px;
          padding: 15px;
          border: 0;
          border-radius: 14px;
          background: #22e5c9;
          color: #061014;
          font-family: Vazirmatn, sans-serif;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }


        .main-button:hover {
          opacity: 0.9;
        }


        .main-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }


        .back-button {
          display: block;
          width: 100%;
          margin-top: 10px;
          padding: 14px;
          border: 1px solid var(--surface2);
          border-radius: 14px;
          background: transparent;
          color: var(--text-hi);
          font-family: Vazirmatn, sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }


        .back-button:hover {
          background: var(--surface2);
        }


        .back-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }


        @media (max-width: 600px) {

          .checkout-page {
            padding: 25px 12px 70px;
          }


          .checkout-title {
            font-size: 23px;
            margin-bottom: 18px;
          }


          .checkout-card {
            padding: 18px;
            border-radius: 17px;
          }


          .section-title {
            font-size: 18px;
          }


          .checkout-input {
            padding: 13px 12px;
            font-size: 14px;
          }


          .bank-card {
            padding: 20px 10px;
            border-radius: 16px;
          }


          .card-number {
            font-size: 16px;
            letter-spacing: 0;
          }


          .card-owner {
            font-size: 14px;
          }


          .total-box,
          .payment-total {
            padding: 14px;
            font-size: 13px;
          }


          .total-box strong,
          .payment-total strong {
            font-size: 15px;
          }


          .main-button {
            padding: 14px;
            font-size: 14px;
          }

        }


        @media (max-width: 380px) {

          .checkout-page {
            padding-left: 8px;
            padding-right: 8px;
          }


          .checkout-card {
            padding: 14px;
          }


          .card-number {
            font-size: 14px;
          }


          .total-box,
          .payment-total {
            flex-direction: column;
            align-items: flex-start;
            gap: 7px;
          }

        }

      `}</style>

    </main>
  );
}
