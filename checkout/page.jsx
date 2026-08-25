"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Phone, User, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCart, useUser } from "@/components/Providers";
import { money, discountedPrice } from "@/lib/data";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();
  const { user } = useUser();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = cart.reduce(
    (sum, item) => sum + discountedPrice(item.product) * item.qty,
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

    if (!user) {
      router.push("/auth");
      return;
    }

    if (cart.length === 0) {
      setError("سبد خرید شما خالی است.");
      return;
    }

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

    try {
      setLoading(true);

      // فعلاً توکن Supabase را از session می‌گیریم
      const { createClient } = await import("@supabase/supabase-js");

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push("/auth");
        return;
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            qty: item.qty,
          })),

          customer: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ثبت سفارش انجام نشد.");
      }

      // بعداً اینجا صفحه پرداخت کارت‌به‌کارت را قرار می‌دهیم
      router.push(`/payment/${data.order.id}`);
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
        <ShoppingBag
          size={44}
          color="var(--border-soft)"
          style={{ margin: "0 auto 18px" }}
        />

        <h1
          style={{
            fontFamily: "Vazirmatn",
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 10,
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

        <Link
          href="/shop"
          style={{
            display: "inline-block",
            background: "#22E5C9",
            color: "#000",
            borderRadius: 12,
            padding: "12px 28px",
            textDecoration: "none",
            fontFamily: "Vazirmatn",
            fontWeight: 800,
          }}
        >
          رفتن به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "40px 20px 80px",
      }}
    >
      <button
        onClick={() => router.back()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: "none",
          border: "none",
          color: "var(--text-mut)",
          cursor: "pointer",
          fontFamily: "Vazirmatn",
          marginBottom: 24,
        }}
      >
        <ArrowRight size={17} />
        بازگشت
      </button>

      <h1
        style={{
          fontFamily: "Vazirmatn",
          fontSize: 28,
          fontWeight: 800,
          marginBottom: 8,
        }}
      >
        تکمیل سفارش
      </h1>

      <p
        style={{
          color: "var(--text-mut)",
          fontSize: 14,
          marginBottom: 30,
        }}
      >
        اطلاعات دریافت سفارش را وارد کنید.
      </p>

      {error && (
        <div
          style={{
            background: "#ff3b3b18",
            border: "1px solid #ff3b3b55",
            color: "#ff6b6b",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 20,
            fontFamily: "Vazirmatn",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(280px, .7fr)",
          gap: 20,
        }}
      >
        {/* اطلاعات مشتری */}

        <form
          onSubmit={submitOrder}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--surface2)",
            borderRadius: 18,
            padding: 22,
          }}
        >
          <h2
            style={{
              fontFamily: "Vazirmatn",
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 22,
            }}
          >
            اطلاعات گیرنده
          </h2>

          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              <User size={16} />
              نام و نام خانوادگی
            </label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="مثلاً علی رضایی"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              <Phone size={16} />
              شماره موبایل
            </label>

            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="09xxxxxxxxx"
              inputMode="tel"
              dir="ltr"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              <MapPin size={16} />
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
                lineHeight: 1.8,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#22E5C988" : "#22E5C9",
              color: "#000",
              border: "none",
              borderRadius: 13,
              padding: "14px 0",
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              fontSize: 14,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "در حال ثبت سفارش..." : "ثبت اطلاعات و ادامه پرداخت"}
          </button>
        </form>

        {/* خلاصه سفارش */}

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--surface2)",
            borderRadius: 18,
            padding: 22,
            height: "fit-content",
          }}
        >
          <h2
            style={{
              fontFamily: "Vazirmatn",
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 18,
            }}
          >
            خلاصه سفارش
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              marginBottom: 20,
            }}
          >
            {cart.map((item) => (
              <div
                key={item.product.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <img
                  src={item.product.images[0]}
                  alt=""
                  style={{
                    width: 54,
                    height: 54,
                    objectFit: "cover",
                    borderRadius: 10,
                  }}
                />

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.product.name}
                  </div>

                  <div
                    style={{
                      color: "var(--text-mut)",
                      fontSize: 11,
                      marginTop: 3,
                    }}
                  >
                    تعداد: {item.qty}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {money(discountedPrice(item.product) * item.qty)}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: "1px solid var(--surface2)",
              paddingTop: 16,
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            <span>مبلغ نهایی</span>
            <span>{money(total)}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 700px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
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
