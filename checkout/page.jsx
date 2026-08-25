```jsx
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

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const total = cart.reduce(
    (sum, item) =>
      sum + discountedPrice(item.product) * item.qty,
    0
  );

  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function submitOrder() {
    setError("");

    if (
      !payment.trackingCode.trim() ||
      !payment.transactionTime.trim()
    ) {
      setError("کد پیگیری و ساعت تراکنش را وارد کنید.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
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
            trackingCode: payment.trackingCode.trim(),
            transactionTime: payment.transactionTime.trim(),
          },

          items: cart.map((item) => ({
            productId: item.product.id,
            qty: item.qty,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "خطا در ثبت سفارش"
        );
      }

      router.push(
        "/order-success?id=" + data.order.id
      );
    } catch (e) {
      setError(
        e.message || "خطایی در ثبت سفارش رخ داد."
      );
    } finally {
      setLoading(false);
    }
  }

  if (cart.length === 0) {
    return (
      <>
        <div className="checkout-empty">
          <h2>سبد خرید خالی است</h2>

          <button
            onClick={() => router.push("/shop")}
            className="shop-button"
          >
            بازگشت به فروشگاه
          </button>
        </div>

        <style jsx>{`
          .checkout-empty {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 80px 20px;
            box-sizing: border-box;
            text-align: center;
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
      </>
    );
  }

  return (
    <>
      <main className="checkout-page">

        <h1 className="checkout-title">
          تکمیل سفارش
        </h1>

        {/* STEP 1 */}
        {step === 1 && (
          <section className="checkout-card">

            <h2 className="section-title">
              اطلاعات گیرنده
            </h2>

            <div className="form-group">
              <label>
                نام و نام خانوادگی
              </label>

              <input
                className="checkout-input"
                name="name"
                type="text"
                placeholder="مثلاً علی رضایی"
                value={form.name}
                onChange={change}
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label>
                شماره موبایل
              </label>

              <input
                className="checkout-input"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="09123456789"
                value={form.phone}
                onChange={change}
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
                placeholder="استان، شهر، خیابان، کوچه، پلاک..."
                value={form.address}
                onChange={change}
                rows={5}
              />
            </div>

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
              className="main-button"
              onClick={() => {
                if (
                  !form.name.trim() ||
                  !form.phone.trim() ||
                  !form.address.trim()
                ) {
                  setError(
                    "لطفاً همه اطلاعات را وارد کنید."
                  );
                  return;
                }

                setError("");
                setStep(2);
              }}
            >
              ادامه فرآیند پرداخت
            </button>

          </section>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <section className="checkout-card">

            <h2 className="section-title">
              پرداخت کارت به کارت
            </h2>

            <p className="payment-description">
              مبلغ سفارش را به شماره کارت زیر واریز کنید
              و سپس اطلاعات تراکنش را وارد کنید.
            </p>

            <div className="bank-card">

              <div className="bank-label">
                شماره کارت
              </div>

              <div className="card-number">
                5022&nbsp;2913&nbsp;1671&nbsp;9168
              </div>

              <div className="bank-label">
                به نام
              </div>

              <div className="card-owner">
                علی دادخواه
              </div>

            </div>

            <div className="payment-total">
              <span>
                مبلغ قابل پرداخت
              </span>

              <strong>
                {money(total)}
              </strong>
            </div>

            <div className="form-group">
              <label>
                کد پیگیری تراکنش
              </label>

              <input
                className="checkout-input"
                type="text"
                inputMode="numeric"
                placeholder="کد پیگیری را وارد کنید"
                value={payment.trackingCode}
                onChange={(e) =>
                  setPayment({
                    ...payment,
                    trackingCode: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>
                ساعت تراکنش
              </label>

              <input
                className="checkout-input"
                type="text"
                inputMode="numeric"
                placeholder="مثلاً 14:35"
                value={payment.transactionTime}
                onChange={(e) =>
                  setPayment({
                    ...payment,
                    transactionTime: e.target.value,
                  })
                }
                dir="ltr"
              />
            </div>

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <button
              className="main-button"
              disabled={loading}
              onClick={submitOrder}
            >
              {loading
                ? "در حال ثبت سفارش..."
                : "ثبت نهایی سفارش"}
            </button>

            <button
              className="back-button"
              disabled={loading}
              onClick={() => {
                setError("");
                setStep(1);
              }}
            >
              بازگشت
            </button>

          </section>
        )}

      </main>

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .checkout-page {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
          padding: 35px 20px 100px;
          box-sizing: border-box;
          direction: rtl;
        }

        .checkout-title {
          margin: 0 0 25px;
          font-family: Vazirmatn, sans-serif;
          font-size: 28px;
          font-weight: 800;
          line-height: 1.5;
        }

        .checkout-card {
          width: 100%;
          max-width: 100%;
          background: var(--surface);
          border: 1px solid var(--surface2);
          border-radius: 20px;
          padding: 25px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .section-title {
          margin: 0 0 25px;
          font-family: Vazirmatn, sans-serif;
          font-size: 20px;
          font-weight: 800;
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
          max-width: 100%;
          min-width: 0;
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
          box-sizing: border-box;
          border-radius: 13px;
          background: var(--bg);
          font-family: Vazirmatn, sans-serif;
        }

        .total-box strong {
          font-size: 17px;
          white-space: nowrap;
        }

        .payment-description {
          margin: -10px 0 20px;
          color: var(--text-mut);
          font-size: 13px;
          line-height: 2;
        }

        .bank-card {
          width: 100%;
          max-width: 100%;
          padding: 22px;
          box-sizing: border-box;
          border-radius: 18px;
          background: #111;
          color: white;
          text-align: center;
          overflow: hidden;
        }

        .bank-label {
          font-size: 12px;
          opacity: 0.7;
          margin-bottom: 8px;
        }

        .card-number {
          width: 100%;
          max-width: 100%;
          margin: 5px auto 20px;
          font-family: Arial, sans-serif;
          font-size: clamp(17px, 4vw, 27px);
          font-weight: 700;
          letter-spacing: 1px;
          direction: ltr;
          white-space: nowrap;
        }

        .card-owner {
          font-size: 16px;
          font-weight: 800;
        }

        .payment-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin: 20px 0;
          padding: 16px;
          border-radius: 13px;
          background: var(--bg);
          font-family: Vazirmatn, sans-serif;
        }

        .payment-total strong {
          font-size: 17px;
          white-space: nowrap;
        }

        .error-box {
          width: 100%;
          margin-top: 15px;
          padding: 12px;
          box-sizing: border-box;
          border-radius: 10px;
          background: #ff3b3b18;
          color: #ff5f5f;
          font-family: Vazirmatn, sans-serif;
          font-size: 13px;
          line-height: 1.8;
        }

        .main-button {
          display: block;
          width: 100%;
          max-width: 100%;
          margin-top: 20px;
          padding: 15px;
          box-sizing: border-box;
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
          box-sizing: border-box;
          border: 1px solid var(--surface2);
          border-radius: 14px;
          background: transparent;
          color: var(--text-hi);
          font-family: Vazirmatn, sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .back-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {

          .checkout-page {
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 20px 12px 70px;
          }

          .checkout-title {
            font-size: 22px;
            margin-bottom: 18px;
          }

          .checkout-card {
            width: 100%;
            padding: 17px;
            border-radius: 16px;
          }

          .section-title {
            font-size: 18px;
            margin-bottom: 20px;
          }

          .checkout-input {
            padding: 13px 12px;
            font-size: 14px;
          }

          .bank-card {
            padding: 18px 10px;
            border-radius: 15px;
          }

          .card-number {
            font-size: 16px;
            letter-spacing: 0;
            margin-bottom: 18px;
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
    </>
  );
}
```
