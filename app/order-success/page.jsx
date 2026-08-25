"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Copy, Check } from "lucide-react";
import { money } from "@/lib/data";

const CARD_NUMBER = "603799XXXXXXXXXX";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("id");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("شماره سفارش پیدا نشد.");
      return;
    }

    const loadOrder = async () => {
      try {
        const response = await fetch(
          `/api/orders/${orderId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "اطلاعات سفارش پیدا نشد."
          );
        }

        setOrder(data.order);
      } catch (err) {
        setError(
          err.message || "خطا در دریافت اطلاعات سفارش."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const copyCardNumber = async () => {
    try {
      await navigator.clipboard.writeText(CARD_NUMBER);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy error:", err);
    }
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <div
            style={{
              textAlign: "center",
              padding: 40,
              fontFamily: "Vazirmatn",
            }}
          >
            در حال دریافت اطلاعات سفارش...
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <div
            style={{
              textAlign: "center",
              padding: 40,
              fontFamily: "Vazirmatn",
            }}
          >
            <div
              style={{
                color: "#ff6b6b",
                marginBottom: 20,
              }}
            >
              {error}
            </div>

            <button
              onClick={() => router.push("/shop")}
              style={buttonStyle}
            >
              بازگشت به فروشگاه
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>

        {/* SUCCESS */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#22E5C920",
              color: "#22E5C9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
            }}
          >
            <CheckCircle size={42} />
          </div>

          <h1
            style={{
              fontFamily: "Vazirmatn",
              fontSize: 26,
              fontWeight: 900,
              margin: 0,
            }}
          >
            سفارش شما با موفقیت ثبت شد
          </h1>

          <p
            style={{
              color: "var(--text-mut)",
              fontFamily: "Vazirmatn",
              fontSize: 14,
              marginTop: 10,
            }}
          >
            سفارش شما دریافت شد و پس از بررسی پرداخت،
            پردازش خواهد شد.
          </p>
        </div>

        {/* CARD NUMBER */}
        <div
          style={{
            background: "var(--surface2)",
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontFamily: "Vazirmatn",
              fontSize: 13,
              color: "var(--text-mut)",
              marginBottom: 10,
            }}
          >
            شماره کارت جهت واریز
          </div>

          <button
            type="button"
            onClick={copyCardNumber}
            style={{
              width: "100%",
              border: "1px solid var(--surface2)",
              background: "var(--surface)",
              color: "var(--text-hi)",
              borderRadius: 12,
              padding: "14px 12px",
              cursor: "pointer",
              fontFamily: "Vazirmatn",
              fontSize: 17,
              fontWeight: 900,
              direction: "ltr",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span>{CARD_NUMBER}</span>

            {copied ? (
              <Check
                size={18}
                color="#22E5C9"
              />
            ) : (
              <Copy size={18} />
            )}
          </button>

          {copied && (
            <div
              style={{
                textAlign: "center",
                marginTop: 10,
                color: "#22E5C9",
                fontFamily: "Vazirmatn",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Copied ✓
            </div>
          )}
        </div>

        {/* ORDER INFO */}
        <div
          style={{
            background: "var(--surface2)",
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontFamily: "Vazirmatn",
              fontSize: 17,
              marginTop: 0,
              marginBottom: 18,
            }}
          >
            اطلاعات سفارش
          </h2>

          <InfoRow
            title="شماره سفارش"
            value={`#${order.id}`}
          />

          <InfoRow
            title="نام مشتری"
            value={order.customer_name}
          />

          <InfoRow
            title="شماره موبایل"
            value={order.customer_phone}
          />

          <InfoRow
            title="مبلغ سفارش"
            value={money(Number(order.total))}
          />
        </div>

        {/* ITEMS */}
        {order.items && order.items.length > 0 && (
          <div
            style={{
              background: "var(--surface2)",
              borderRadius: 16,
              padding: 20,
              marginBottom: 25,
            }}
          >
            <h2
              style={{
                fontFamily: "Vazirmatn",
                fontSize: 17,
                marginTop: 0,
                marginBottom: 15,
              }}
            >
              محصولات سفارش
            </h2>

            {order.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 15,
                  padding: "10px 0",
                  borderBottom:
                    index !== order.items.length - 1
                      ? "1px solid var(--surface)"
                      : "none",
                  fontFamily: "Vazirmatn",
                  fontSize: 13,
                }}
              >
                <span>
                  {item.product_id}
                  {" × "}
                  {item.qty}
                </span>

                <span>
                  {money(
                    Number(item.price) *
                      Number(item.qty)
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* BACK */}
        <Link
          href="/shop"
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            background: "#22E5C9",
            color: "#061014",
            textAlign: "center",
            textDecoration: "none",
            borderRadius: 12,
            padding: "13px 0",
            fontFamily: "Vazirmatn",
            fontWeight: 900,
            fontSize: 14,
          }}
        >
          بازگشت به فروشگاه
        </Link>
      </div>
    </main>
  );
}

function InfoRow({ title, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 15,
        padding: "9px 0",
        fontFamily: "Vazirmatn",
        fontSize: 13,
      }}
    >
      <span
        style={{
          color: "var(--text-mut)",
        }}
      >
        {title}
      </span>

      <span
        style={{
          fontWeight: 700,
          textAlign: "left",
        }}
      >
        {value || "-"}
      </span>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <main style={pageStyle}>
          <div style={cardStyle}>
            <div
              style={{
                textAlign: "center",
                padding: 40,
                fontFamily: "Vazirmatn",
              }}
            >
              در حال بارگذاری...
            </div>
          </div>
        </main>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: "50px 20px 80px",
  boxSizing: "border-box",
};

const cardStyle = {
  width: "100%",
  maxWidth: 650,
  margin: "0 auto",
  background: "var(--surface)",
  borderRadius: 20,
  padding: 25,
  boxSizing: "border-box",
};

const buttonStyle = {
  background: "#22E5C9",
  color: "#061014",
  border: "none",
  borderRadius: 12,
  padding: "12px 25px",
  fontFamily: "Vazirmatn",
  fontWeight: 800,
  cursor: "pointer",
};
