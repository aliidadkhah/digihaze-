"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/Providers";
import { money, discountedPrice } from "@/lib/data";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const submitOrder = async (e) => {
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
      setError("لطفاً آدرس را وارد کنید.");
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

          items: cart.map((item) => ({
            productId: item.product.id,
            qty: item.qty,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "ثبت سفارش انجام نشد."
        );
      }

      router.push(`/order-success?id=${data.order.id}`);
    } catch (err) {
      setError(err.message || "خطایی رخ داد.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div
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
          onClick={() => router.push("/shop")}
          style={{
            background: "#22E5C9",
            border: "none",
            borderRadius: 12,
            padding: "12px 28px",
            fontFamily: "Vazirmatn",
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
          marginBottom: 30,
        }}
      >
        اطلاعات سفارش
      </h1>

      <form
        onSubmit={submitOrder}
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
            background: "var(--surface)",
            borderRadius: 18,
            padding: 22,
          }}
        >
          <h2
            style={{
              fontFamily: "Vazirmatn",
              fontSize: 18,
              marginBottom: 20,
            }}
          >
            مشخصات گیرنده
          </h2>

          <label
            style={{
              display: "block",
              fontSize: 13,
              marginBottom: 7,
            }}
          >
            نام و نام خانوادگی
          </label>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="مثلاً علی رضایی"
            style={inputStyle}
          />

          <label
            style={{
              display: "block",
              fontSize: 13,
              marginBottom: 7,
            }}
          >
            شماره موبایل
          </label>

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="09123456789"
            inputMode="tel"
            style={inputStyle}
          />

          <label
            style={{
              display: "block",
              fontSize: 13,
              marginBottom: 7,
            }}
          >
            آدرس کامل
          </label>

          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="استان، شهر، خیابان، کوچه، پلاک..."
            rows={5}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />

          {error && (
            <div
              style={{
                marginTop: 15,
                padding: 12,
                borderRadius: 10,
                background: "#ff3b3b18",
                color: "#ff6b6b",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* خلاصه سفارش */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 18,
            padding: 22,
            height: "fit-content",
          }}
        >
          <h2
            style={{
              fontFamily: "Vazirmatn",
              fontSize: 18,
              marginBottom: 18,
            }}
          >
            خلاصه سفارش
          </h2>

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
                  gap: 10,
                  fontSize: 13,
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
              borderTop: "1px solid var(--surface2)",
              paddingTop: 15,
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 800,
              fontSize: 17,
              marginBottom: 20,
            }}
          >
            <span>مبلغ نهایی</span>
            <span>{money(total)}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading
                ? "var(--surface2)"
                : "#22E5C9",
              color: "#061014",
              border: "none",
              borderRadius: 12,
              padding: "14px 0",
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              fontSize: 14,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "در حال ثبت سفارش..."
              : "تأیید و ثبت سفارش"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "var(--bg)",
  border: "1px solid var(--surface2)",
  color: "var(--text-hi)",
  borderRadius: 10,
  padding: "12px 13px",
  outline: "none",
  fontFamily: "Vazirmatn",
  fontSize: 13,
  marginBottom: 16,
};
