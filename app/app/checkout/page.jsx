"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  useCart,
  useUser,
  isProfileComplete,
} from "@/components/Providers";

import {
  money,
  discountedPrice,
} from "@/lib/data";

import {
  Copy,
  Truck,
  CreditCard,
  Landmark,
} from "lucide-react";

const SHIPPING_METHODS = [
  {
    id: "tipax",
    label: "ارسال با تیپاکس (پس‌کرایه)",
    desc: "۲ الی ۳ روز کاری — هزینه در مقصد از گیرنده دریافت می‌شود",
    cost: 0,
  },
  {
    id: "post",
    label: "ارسال با پست",
    desc: "۳ الی ۵ روز کاری",
    cost: 179000,
  },
  {
    id: "chapar",
    label: "ارسال با چاپار (پس‌کرایه)",
    desc: "۲ الی ۳ روز کاری — هزینه در مقصد از گیرنده دریافت می‌شود",
    cost: 0,
  },
];

export default function CheckoutPage() {
  const router = useRouter();

  const { cart, clearCart } = useCart();
  const { user } = useUser();

  const [step, setStep] = useState("review");

  const [shippingMethod, setShippingMethod] =
    useState("tipax");

  const [paymentMethod, setPaymentMethod] =
    useState("card_to_card");

  const [trackingCode, setTrackingCode] =
    useState("");

  const [transactionTime, setTransactionTime] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const cardNumber =
    "6037991234567890";

  /* ========================= */
  /* ورود اجباری */
  /* ========================= */

  useEffect(() => {
    if (
      !user ||
      !isProfileComplete(user)
    ) {
      router.replace(
        "/auth?redirect=/checkout"
      );
    }
  }, [user, router]);

  /* ========================= */
  /* محاسبه مبلغ */
  /* ========================= */

  const itemsTotal = cart.reduce(
    (sum, item) =>
      sum +
      discountedPrice(item.product) *
        item.qty,
    0
  );

  const shippingCost =
    SHIPPING_METHODS.find(
      (m) => m.id === shippingMethod
    )?.cost || 0;

  const total =
    itemsTotal + shippingCost;

  /* ========================= */
  /* کپی شماره کارت */
  /* ========================= */

  const copyCardNumber = async () => {
    try {
      await navigator.clipboard.writeText(
        cardNumber
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(
        "COPY ERROR:",
        err
      );
    }
  };

  /* ========================= */
  /* ثبت سفارش */
  /* ========================= */

  const createOrder = async (
    paymentPayload,
    status
  ) => {
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
            name: user.name,
            phone: user.contact,
            address: user.address,
            province: user.province,
            city: user.city,
            postalCode:
              user.postalCode,
          },

          shipping: {
            method: shippingMethod,
            cost: shippingCost,
          },

          payment: {
            method: paymentMethod,
            status,
            ...paymentPayload,
          },

          items: cart.map((item) => ({
            productId:
              item.product.id,
            qty: item.qty,
          })),
        }),
      }
    );

    const responseText =
      await response.text();

    let data;

    try {
      data = JSON.parse(
        responseText
      );
    } catch {
      console.error(
        "SERVER RESPONSE:",
        responseText
      );

      throw new Error(
        "پاسخ نامعتبر از سرور دریافت شد. لطفاً دوباره تلاش کنید."
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "ثبت سفارش انجام نشد."
      );
    }

    if (!data?.order) {
      throw new Error(
        "اطلاعات سفارش از سرور دریافت نشد."
      );
    }

    sessionStorage.setItem(
      "completedOrder",
      JSON.stringify(data.order)
    );

    clearCart();

    router.push(
      "/order-success"
    );
  };

  /* ========================= */
  /* رفتن به پرداخت */
  /* ========================= */

  const goToPayment = (e) => {
    e.preventDefault();

    setError("");

    if (cart.length === 0) {
      setError(
        "سبد خرید خالی است."
      );

      return;
    }

    if (
      paymentMethod ===
      "card_to_card"
    ) {
      setStep("card");
    } else {
      setStep("gateway");
    }
  };

  /* ========================= */
  /* کارت به کارت */
  /* ========================= */

  const submitCardPayment =
    async (e) => {
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
        await createOrder(
          {
            trackingCode:
              trackingCode.trim(),

            transactionTime:
              transactionTime.trim(),
          },
          "pending"
        );
      } catch (err) {
        console.error(
          "ORDER ERROR:",
          err
        );

        setError(
          err?.message ||
            "خطایی هنگام ثبت سفارش رخ داد."
        );
      } finally {
        setLoading(false);
      }
    };

  /* ========================= */
  /* درگاه نمایشی */
  /* ========================= */

  const simulateGatewayPayment =
    async () => {
      setError("");
      setLoading(true);

      try {
        await createOrder(
          {},
          "paid"
        );
      } catch (err) {
        console.error(
          "ORDER ERROR:",
          err
        );

        setError(
          err?.message ||
            "خطایی هنگام ثبت سفارش رخ داد."
        );
      } finally {
        setLoading(false);
      }
    };

  /* ========================= */
  /* بررسی کاربر */
  /* ========================= */

  if (
    !user ||
    !isProfileComplete(user)
  ) {
    return null;
  }

  /* ========================= */
  /* سبد خالی */
  /* ========================= */

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
          onClick={() =>
            router.push("/shop")
          }
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
            color: var(--text-hi);
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

      {/* ========================= */}
      {/* عنوان */}
      {/* ========================= */}

      <h1 className="checkout-title">
        {step === "review"
          ? "اطلاعات و فاکتور سفارش"
          : "پرداخت سفارش"}
      </h1>

      {/* ========================= */}
      {/* مرحله اول */}
      {/* ========================= */}

      {step === "review" && (
        <form
          onSubmit={goToPayment}
          className="checkout-form"
        >

          {/* ستون اصلی */}

          <div className="col-main">

            {/* مشخصات گیرنده */}

            <div className="checkout-card">

              <div className="section-head">

                <h2 className="section-title">
                  مشخصات گیرنده
                </h2>

                <button
                  type="button"
                  className="edit-link"
                  onClick={() =>
                    router.push(
                      "/auth?redirect=/checkout"
                    )
                  }
                >
                  ویرایش
                </button>

              </div>

              <div className="receiver-row">
                <span>
                  نام گیرنده
                </span>

                <strong>
                  {user.name}
                </strong>
              </div>

              <div className="receiver-row">
                <span>
                  شماره موبایل
                </span>

                <strong dir="ltr">
                  {user.contact}
                </strong>
              </div>

              <div className="receiver-row">
                <span>
                  استان و شهر
                </span>

                <strong>
                  {user.province} -{" "}
                  {user.city}
                </strong>
              </div>

              <div className="receiver-row">
                <span>
                  کد پستی
                </span>

                <strong dir="ltr">
                  {user.postalCode}
                </strong>
              </div>

              <div className="receiver-address">
                <span>
                  آدرس
                </span>

                <p>
                  {user.address}
                </p>
              </div>

            </div>

            {/* ========================= */}
            {/* روش ارسال */}
            {/* ========================= */}

            <div className="checkout-card">

              <h2 className="section-title">
                <Truck
                  size={17}
                  style={{
                    verticalAlign:
                      "-3px",
                    marginLeft: 6,
                  }}
                />

                روش ارسال
              </h2>

              <div className="option-list">

                {SHIPPING_METHODS.map(
                  (m) => (
                    <label
                      key={m.id}
                      className={`option-item ${
                        shippingMethod ===
                        m.id
                          ? "selected"
                          : ""
                      }`}
                    >

                      <input
                        type="radio"
                        name="shipping"
                        checked={
                          shippingMethod ===
                          m.id
                        }
                        onChange={() =>
                          setShippingMethod(
                            m.id
                          )
                        }
                      />

                      <div className="option-text">

                        <div className="option-title">

                          <span>
                            {m.label}
                          </span>

                          <span className="option-price">
                            {m.cost > 0
                              ? money(
                                  m.cost
                                )
                              : "پس‌کرایه"}
                          </span>

                        </div>

                        <div className="option-desc">
                          {m.desc}
                        </div>

                      </div>

                    </label>
                  )
                )}

              </div>

            </div>

            {/* ========================= */}
            {/* روش پرداخت */}
            {/* ========================= */}

            <div className="checkout-card">

              <h2 className="section-title">

                <CreditCard
                  size={17}
                  style={{
                    verticalAlign:
                      "-3px",
                    marginLeft: 6,
                  }}
                />

                روش پرداخت

              </h2>

              <div className="option-list">

                {/* کارت به کارت */}

                <label
                  className={`option-item ${
                    paymentMethod ===
                    "card_to_card"
                      ? "selected"
                      : ""
                  }`}
                >

                  <input
                    type="radio"
                    name="payment"
                    checked={
                      paymentMethod ===
                      "card_to_card"
                    }
                    onChange={() =>
                      setPaymentMethod(
                        "card_to_card"
                      )
                    }
                  />

                  <div className="option-text">

                    <div className="option-title">
                      کارت به کارت
                    </div>

                    <div className="option-desc">
                      واریز مستقیم و ثبت کد
                      پیگیری — بعد از تایید
                      ادمین سفارش نهایی می‌شود
                    </div>

                  </div>

                </label>

                {/* درگاه */}

                <label
                  className={`option-item ${
                    paymentMethod ===
                    "gateway"
                      ? "selected"
                      : ""
                  }`}
                >

                  <input
                    type="radio"
                    name="payment"
                    checked={
                      paymentMethod ===
                      "gateway"
                    }
                    onChange={() =>
                      setPaymentMethod(
                        "gateway"
                      )
                    }
                  />

                  <div className="option-text">

                    <div className="option-title">

                      <span>
                        <Landmark
                          size={14}
                          style={{
                            verticalAlign:
                              "-2px",
                            marginLeft: 4,
                          }}
                        />

                        پرداخت با درگاه
                        شاپرک
                      </span>

                    </div>

                    <div className="option-desc">
                      پرداخت آنلاین و امن —
                      تایید فوری سفارش
                    </div>

                  </div>

                </label>

              </div>

            </div>

            {error && (
              <ErrorBox>
                {error}
              </ErrorBox>
            )}

          </div>

          {/* ========================= */}
          {/* فاکتور */}
          {/* ========================= */}

          <div className="checkout-card summary-card">

            <h2 className="section-title">
              فاکتور خرید
            </h2>

            <OrderSummary
              cart={cart}
              itemsTotal={itemsTotal}
              shippingCost={
                shippingCost
              }
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
      {/* کارت به کارت */}
      {/* ========================= */}

      {step === "card" && (
        <form
          onSubmit={
            submitCardPayment
          }
          className="payment-form"
        >

          <div className="checkout-card">

            <h2 className="section-title">
              پرداخت سفارش
            </h2>

            <p className="description">
              لطفاً مبلغ سفارش را به
              شماره کارت زیر واریز کنید
              و سپس کد پیگیری تراکنش را
              وارد کنید.
            </p>

            <div className="payment-total">

              <span>
                مبلغ قابل پرداخت
              </span>

              <strong>
                {money(total)}
              </strong>

            </div>

            <button
              type="button"
              onClick={
                copyCardNumber
              }
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
              برای کپی شماره کارت روی
              آن کلیک کنید
            </div>

          </div>

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
                setTrackingCode(
                  e.target.value
                )
              }
              placeholder="کد پیگیری واریز را وارد کنید"
              inputMode="numeric"
              className="input"
              dir="ltr"
              type="text"
            />

            <label className="label">
              ساعت تراکنش

              <span className="optional">
                اختیاری
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
                setStep("review");
              }}
              className="back-button"
            >
              بازگشت به اطلاعات سفارش
            </button>

          </div>

        </form>
      )}

      {/* ========================= */}
      {/* درگاه نمایشی */}
      {/* ========================= */}

      {step === "gateway" && (
        <div className="payment-form">

          <div className="checkout-card gateway-card">

            <Landmark
              size={40}
              color="#22E5C9"
              style={{
                margin:
                  "0 auto 16px",
                display: "block",
              }}
            />

            <h2
              className="section-title"
              style={{
                textAlign: "center",
              }}
            >
              درگاه پرداخت شاپرک
            </h2>

            <p
              className="description"
              style={{
                textAlign: "center",
              }}
            >
              نسخه‌ی نمایشی — درگاه
              واقعی هنوز متصل نشده.
              مبلغ{" "}
              {money(total)}{" "}
              برای پرداخت نمایش داده
              می‌شود.
            </p>

            {error && (
              <ErrorBox>
                {error}
              </ErrorBox>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={
                simulateGatewayPayment
              }
              className="primary-button submit-button"
            >
              {loading
                ? "در حال اتصال به درگاه..."
                : "پرداخت (نمایشی)"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setError("");
                setStep("review");
              }}
              className="back-button"
            >
              بازگشت به اطلاعات سفارش
            </button>

          </div>

        </div>
      )}

      {/* ========================= */}
      {/* CSS */}
      {/* ========================= */}

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .checkout-page {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          padding: 40px 20px 80px;
          font-family: Vazirmatn, sans-serif;
        }

        .checkout-title {
          margin: 0 0 30px;
          font-size: 26px;
          font-weight: 800;
          color: var(--text-hi);
        }

        .checkout-form {
          width: 100%;
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(280px, 380px);
          gap: 20px;
          align-items: start;
        }

        .col-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
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
          overflow: hidden;
        }

        .summary-card {
          height: fit-content;
        }

        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 10px;
        }

        .section-title {
          margin: 0 0 20px;
          font-size: 18px;
          font-weight: 800;
          color: var(--text-hi);
        }

        .section-head .section-title {
          margin: 0;
        }

        .edit-link {
          background: none;
          border: none;
          color: #22E5C9;
          font-family: Vazirmatn, sans-serif;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
        }

        .receiver-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 13px;
          padding: 9px 0;
          border-bottom: 1px solid var(--surface2);
          color: var(--text-mut);
        }

        .receiver-row strong {
          color: var(--text-hi);
          font-weight: 700;
          text-align: left;
        }

        .receiver-address {
          padding-top: 12px;
          font-size: 13px;
          color: var(--text-mut);
        }

        .receiver-address p {
          color: var(--text-hi);
          line-height: 1.8;
          margin: 6px 0 0;
        }

        /* ================================= */
        /* رادیوها - FIX اصلی */
        /* ================================= */

        .option-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        .option-item {
          display: flex !important;
          flex-direction: row !important;
          align-items: flex-start !important;

          width: 100% !important;
          min-width: 0 !important;

          padding: 14px !important;

          border: 1px solid var(--surface2) !important;
          border-radius: 14px !important;

          cursor: pointer;

          background: var(--bg);

          overflow: hidden;

          box-sizing: border-box !important;
        }

        .option-item.selected {
          border-color: #22E5C9 !important;
          background: #22E5C910 !important;
        }

        /* مهم‌ترین قسمت */

        .option-item input[type="radio"] {
          appearance: auto !important;
          -webkit-appearance: radio !important;

          width: 18px !important;
          height: 18px !important;

          min-width: 18px !important;
          max-width: 18px !important;

          min-height: 18px !important;
          max-height: 18px !important;

          flex: 0 0 18px !important;

          margin: 3px 0 0 0 !important;
          padding: 0 !important;

          display: block !important;

          box-sizing: border-box !important;
        }

        .option-text {
          flex: 1 1 auto !important;
          width: auto !important;
          min-width: 0 !important;
          max-width: 100% !important;

          box-sizing: border-box !important;
        }

        .option-title {
          display: flex;
          justify-content: space-between;
          align-items: center;

          font-weight: 700;
          font-size: 13.5px;

          color: var(--text-hi);

          gap: 8px;

          min-width: 0;
        }

        .option-title > span:first-child {
          min-width: 0;
        }

        .option-price {
          font-size: 12px;
          color: #22E5C9;
          font-weight: 800;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .option-desc {
          margin-top: 4px;
          font-size: 12px;
          color: var(--text-mut);
          line-height: 1.8;
        }

        /* ================================= */
        /* ورودی‌های معمولی */
        /* ================================= */

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
          display: block !important;

          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;

          box-sizing: border-box !important;

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
          border-color: #22E5C9;
        }

        /* ================================= */
        /* توضیحات */
        /* ================================= */

        .description {
          margin: -5px 0 20px;
          color: var(--text-mut);
          font-size: 13px;
          line-height: 1.9;
        }

        /* ================================= */
        /* مبلغ */
        /* ================================= */

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

        /* ================================= */
        /* شماره کارت */
        /* ================================= */

        .card-number-button {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;

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

          font-size: clamp(
            16px,
            3vw,
            21px
          );

          font-weight: 900;

          letter-spacing: 1.5px;

          direction: ltr;

          white-space: nowrap;
        }

        .copied {
          color: #22E5C9;
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

        /* ================================= */
        /* دکمه‌ها */
        /* ================================= */

        .primary-button {
          display: block;

          width: 100% !important;

          border: none;

          background: #22E5C9;

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

          width: 100% !important;

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

        .gateway-card {
          max-width: 480px;
          margin: 0 auto;
        }

        /* ================================= */
        /* موبایل */
        /* ================================= */

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

          .option-item {
            padding: 13px !important;
          }

          .option-title {
            font-size: 13px;
          }

          .option-desc {
            font-size: 11.5px;
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

/* ================================================= */
/* خلاصه سفارش */
/* ================================================= */

function OrderSummary({
  cart,
  itemsTotal,
  shippingCost,
  total,
}) {
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
              justifyContent:
                "space-between",
              alignItems:
                "flex-start",
              gap: 10,
              fontSize: 13,
              fontFamily:
                "Vazirmatn, sans-serif",
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
          paddingTop: 12,
          display: "flex",
          justifyContent:
            "space-between",
          gap: 10,
          fontSize: 13,
          color: "var(--text-mut)",
          marginBottom: 8,
          fontFamily:
            "Vazirmatn, sans-serif",
        }}
      >
        <span>
          جمع کالاها
        </span>

        <span>
          {money(itemsTotal)}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: 10,
          fontSize: 13,
          color: "var(--text-mut)",
          marginBottom: 15,
          fontFamily:
            "Vazirmatn, sans-serif",
        }}
      >
        <span>
          هزینه ارسال
        </span>

        <span>
          {shippingCost > 0
            ? money(
                shippingCost
              )
            : "پس‌کرایه"}
        </span>
      </div>

      <div
        style={{
          borderTop:
            "1px solid var(--surface2)",
          paddingTop: 15,
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: 10,
          fontWeight: 800,
          fontSize: 17,
          marginBottom: 20,
          fontFamily:
            "Vazirmatn, sans-serif",
        }}
      >
        <span>
          مبلغ نهایی
        </span>

        <span
          style={{
            whiteSpace:
              "nowrap",
          }}
        >
          {money(total)}
        </span>
      </div>
    </>
  );
}

/* ================================================= */
/* خطا */
/* ================================================= */

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
          "Vazirmatn, sans-serif",
        lineHeight: 1.8,
      }}
    >
      {children}
    </div>
  );
}
