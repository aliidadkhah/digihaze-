"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  CreditCard,
  Copy,
  Check,
  Loader2,
} from "lucide-react";

import { qtyBtnStyle } from "./ui";
import { money, discountedPrice } from "@/lib/data";
import { useCart, useUser } from "./Providers";

const CARD_NUMBER = "6037-XXXX-XXXX-XXXX";

export default function CartContent() {
  const { cart, updateQty, removeItem } = useCart();
  const { user } = useUser();

  const [step, setStep] = useState("cart");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    postalCode: "",
  });

  const [payment, setPayment] = useState({
    trackingCode: "",
    paymentTime: "",
  });

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const total = cart.reduce(
    (s, i) => s + discountedPrice(i.product) * i.qty,
    0
  );

  const copyCard = async () => {
    try {
      await navigator.clipboard.writeText(CARD_NUMBER);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePaymentChange = (e) => {
    setPayment((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const createOrder = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.fullName.trim()) {
      setError("لطفاً نام و نام خانوادگی را وارد کنید.");
      return;
    }

    if (!form.phone.trim()) {
      setError("لطفاً شماره موبایل را وارد کنید.");
      return;
    }

    if (!form.address.trim()) {
      setError("لطفاً آدرس را وارد کنید.");
      return;
    }

    if (!form.postalCode.trim()) {
      setError("لطفاً کد پستی را وارد کنید.");
      return;
    }

    if (!user) {
      setError("برای ثبت سفارش ابتدا باید وارد حساب کاربری شوید.");
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData } =
        await window.supabase?.auth?.getSession?.();

      const token =
        sessionData?.session?.access_token ||
        localStorage.getItem("supabase_access_token");

      if (!token) {
        setError("جلسه ورود شما پیدا نشد. لطفاً دوباره وارد حساب شوید.");
        setLoading(false);
        return;
      }

      const items = cart.map((item) => ({
        productId: item.product.id,
        qty: item.qty,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          customer: form,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ثبت سفارش انجام نشد.");
      }

      setOrder(data.order);
      setStep("payment");
    } catch (err) {
      setError(err.message || "خطایی رخ داد.");
    } finally {
      setLoading(false);
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();

    setError("");

    if (!payment.trackingCode.trim()) {
      setError("لطفاً کد پیگیری تراکنش را وارد کنید.");
      return;
    }

    if (!payment.paymentTime.trim()) {
      setError("لطفاً ساعت تراکنش را وارد کنید.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/orders/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          trackingCode: payment.trackingCode,
          paymentTime: payment.paymentTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ثبت پرداخت انجام نشد.");
      }

      setStep("success");
    } catch (err) {
      setError(err.message || "خطایی رخ داد.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && step === "cart") {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: "80px 20px",
          textAlign: "center",
        }}
      >
        <ShoppingBag
          size={40}
          color="var(--border-soft)"
          style={{ margin: "0 auto 18px" }}
        />

        <h2
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 20,
            marginBottom: 10,
          }}
        >
          سبد خریدت خالیه
        </h2>

        <p
          style={{
            color: "var(--text-mut)",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          یه سر به فروشگاه بزن، پر از طعم‌های جدیده.
        </p>

        <Link
          href="/shop"
          style={{
            background: "#2F86FF",
            color: "var(--ink)",
            borderRadius: 12,
            padding: "12px 28px",
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          رفتن به فروشگاه
        </Link>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: "80px 20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: "#22E5C922",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Check size={35} color="#22E5C9" />
        </div>

        <h1
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 25,
            marginBottom: 12,
          }}
        >
          پرداخت ثبت شد
        </h1>

        <p
          style={{
            color: "var(--text-lo)",
            lineHeight: 2,
            fontSize: 14,
          }}
        >
          اطلاعات پرداخت شما با موفقیت ثبت شد.
          <br />
          پس از بررسی تراکنش، سفارش شما پردازش خواهد شد.
        </p>

        {order?.id && (
          <div
            style={{
              marginTop: 25,
              background: "var(--surface)",
              borderRadius: 14,
              padding: 16,
              fontSize: 13,
            }}
          >
            شماره سفارش:
            <strong style={{ marginRight: 8 }}>{order.id}</strong>
          </div>
        )}
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div
        style={{
          maxWidth: 650,
          margin: "0 auto",
          padding: "40px 20px 80px",
        }}
      >
        <button
          onClick={() => setStep("customer")}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-mut)",
            cursor: "pointer",
            fontFamily: "Vazirmatn",
            marginBottom: 20,
          }}
        >
          ← بازگشت
        </button>

        <h1
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 26,
            marginBottom: 25,
          }}
        >
          پرداخت کارت‌به‌کارت
        </h1>

        <div
          style={{
            background:
              "linear-gradient(135deg, #17203a, #101827)",
            border: "1px solid #2F86FF55",
            borderRadius: 20,
            padding: 25,
            marginBottom: 20,
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
            <CreditCard size={22} color="#2F86FF" />

            <span
              style={{
                fontFamily: "Vazirmatn",
                fontWeight: 800,
              }}
            >
              مبلغ قابل پرداخت
            </span>
          </div>

          <div
            style={{
              fontSize: 25,
              fontWeight: 900,
              marginBottom: 25,
            }}
          >
            {money(order?.total || total)}
          </div>

          <div
            style={{
              color: "var(--text-mut)",
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            شماره کارت:
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              dir="ltr"
              style={{
                flex: 1,
                background: "var(--surface)",
                borderRadius: 12,
                padding: "14px 12px",
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: 1,
                textAlign: "center",
              }}
            >
              {CARD_NUMBER}
            </div>

            <button
              onClick={copyCard}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                border: "none",
                background: "#2F86FF",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {copied ? <Check size={19} /> : <Copy size={19} />}
            </button>
          </div>
        </div>

        <div
          style={{
            background: "#FF8A3D15",
            border: "1px solid #FF8A3D44",
            borderRadius: 14,
            padding: 15,
            marginBottom: 25,
            color: "var(--text-lo)",
            fontSize: 13,
            lineHeight: 2,
          }}
        >
          ابتدا مبلغ بالا را به شماره کارت اعلام‌شده واریز کنید،
          سپس کد پیگیری و ساعت تراکنش را در فرم زیر وارد کنید.
        </div>

        <form onSubmit={submitPayment}>
          <input
            name="trackingCode"
            value={payment.trackingCode}
            onChange={handlePaymentChange}
            placeholder="کد پیگیری تراکنش"
            style={inputStyle}
          />

          <input
            name="paymentTime"
            value={payment.paymentTime}
            onChange={handlePaymentChange}
            placeholder="ساعت تراکنش، مثلاً 14:35"
            style={inputStyle}
            dir="ltr"
          />

          {error && <ErrorBox>{error}</ErrorBox>}

          <button
            type="submit"
            disabled={loading}
            style={mainButtonStyle}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                در حال ثبت...
              </>
            ) : (
              <>
                ثبت پرداخت
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  if (step === "customer") {
    return (
      <div
        style={{
          maxWidth: 650,
          margin: "0 auto",
          padding: "40px 20px 80px",
        }}
      >
        <button
          onClick={() => setStep("cart")}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-mut)",
            cursor: "pointer",
            fontFamily: "Vazirmatn",
            marginBottom: 20,
          }}
        >
          ← بازگشت به سبد خرید
        </button>

        <h1
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 26,
            marginBottom: 25,
          }}
        >
          اطلاعات گیرنده
        </h1>

        <form onSubmit={createOrder}>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleFormChange}
            placeholder="نام و نام خانوادگی"
            style={inputStyle}
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleFormChange}
            placeholder="شماره موبایل"
            inputMode="tel"
            style={inputStyle}
            dir="ltr"
          />

          <textarea
            name="address"
            value={form.address}
            onChange={handleFormChange}
            placeholder="آدرس کامل"
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />

          <input
            name="postalCode"
            value={form.postalCode}
            onChange={handleFormChange}
            placeholder="کد پستی"
            inputMode="numeric"
            style={inputStyle}
            dir="ltr"
          />

          <div
            style={{
              background: "var(--surface)",
              borderRadius: 14,
              padding: 16,
              marginBottom: 18,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>مبلغ سفارش</span>
            <strong>{money(total)}</strong>
          </div>

          {error && <ErrorBox>{error}</ErrorBox>}

          <button
            type="submit"
            disabled={loading}
            style={mainButtonStyle}
          >
            {loading ? (
              <>
                <Loader2 size={18} />
                در حال ثبت سفارش...
              </>
            ) : (
              <>
                تأیید و ادامه پرداخت
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "40px 20px 80px",
      }}
    >
      <h1
        style={{
          fontFamily: "Vazirmatn",
          fontWeight: 800,
          fontSize: 26,
          marginBottom: 26,
        }}
      >
        سبد خرید
      </h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginBottom: 26,
        }}
      >
        {cart.map((item) => (
          <div
            key={item.product.id}
            style={{
              display: "flex",
              gap: 14,
              background: "var(--surface)",
              borderRadius: 14,
              padding: 12,
              alignItems: "center",
            }}
          >
            <img
              src={item.product.images[0]}
              alt=""
              style={{
                width: 70,
                height: 70,
                borderRadius: 10,
                objectFit: "cover",
              }}
            />

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                {item.product.name}
              </div>

              <div
                style={{
                  color: "var(--text-mut)",
                  fontSize: 12,
                }}
              >
                {money(discountedPrice(item.product))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid var(--surface2)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() =>
                  updateQty(item.product.id, item.qty + 1)
                }
                style={qtyBtnStyle}
              >
                <Plus size={13} />
              </button>

              <span
                style={{
                  width: 30,
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {item.qty}
              </span>

              <button
                onClick={() =>
                  updateQty(item.product.id, item.qty - 1)
                }
                style={qtyBtnStyle}
              >
                <Minus size={13} />
              </button>
            </div>

            <button
              onClick={() => removeItem(item.product.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Trash2 size={17} color="#2F86FF" />
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 14,
            color: "var(--text-lo)",
            marginBottom: 10,
          }}
        >
          <span>جمع سبد خرید</span>
          <span>{money(total)}</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 14,
            color: "var(--text-lo)",
            marginBottom: 16,
          }}
        >
          <span>هزینه ارسال</span>
          <span>رایگان</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 800,
            fontSize: 17,
            borderTop: "1px solid var(--surface2)",
            paddingTop: 14,
            marginBottom: 20,
          }}
        >
          <span>مبلغ نهایی</span>
          <span>{money(total)}</span>
        </div>

        <button
          onClick={() => {
            setError("");

            if (!user) {
              setError("برای ادامه خرید ابتدا وارد حساب کاربری شوید.");
              return;
            }

            setStep("customer");
          }}
          style={mainButtonStyle}
        >
          ادامه فرآیند خرید
          <ArrowRight size={18} />
        </button>

        {error && <ErrorBox>{error}</ErrorBox>}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "var(--surface)",
  border: "1px solid var(--surface2)",
  borderRadius: 12,
  padding: "13px 14px",
  marginBottom: 14,
  color: "var(--text-hi)",
  fontFamily: "Vazirmatn",
  fontSize: 14,
  outline: "none",
};

const mainButtonStyle = {
  width: "100%",
  background: "#22E5C9",
  color: "#071014",
  border: "none",
  borderRadius: 12,
  padding: "14px 20px",
  fontFamily: "Vazirmatn",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

function ErrorBox({ children }) {
  return (
    <div
      style={{
        background: "#ff4d4d15",
        border: "1px solid #ff4d4d44",
        color: "#ff7070",
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
        fontSize: 13,
        lineHeight: 1.8,
      }}
    >
      {children}
    </div>
  );
}
