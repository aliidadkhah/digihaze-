"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/data";

export default function OrderSuccessPage() {
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedOrder = sessionStorage.getItem("completedOrder");

      if (savedOrder) {
        setOrder(JSON.parse(savedOrder));

        // بعد از خواندن اطلاعات، پاکش می‌کنیم
        sessionStorage.removeItem("completedOrder");
      }
    } catch (error) {
      console.error("Order success error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: "80px 20px",
          textAlign: "center",
          fontFamily: "Vazirmatn",
        }}
      >
        در حال بارگذاری...
      </div>
    );
  }

  if (!order) {
    return (
      <div
        style={{
          maxWidth: 650,
          margin: "0 auto",
          padding: "80px 20px",
          textAlign: "center",
          fontFamily: "Vazirmatn",
        }}
      >
        <h1
          style={{
            fontWeight: 900,
            marginBottom: 15,
          }}
        >
          اطلاعات سفارش پیدا نشد
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
        maxWidth: 700,
        margin: "0 auto",
        padding: "50px 20px 100px",
        fontFamily: "Vazirmatn",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 22,
          padding: 30,
        }}
      >
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
              fontSize: 25,
              fontWeight: 900,
              color: "var(--text-hi)",
              marginBottom: 10,
            }}
          >
            سفارش شما با موفقیت ثبت شد
          </h1>

          <p
            style={{
              color: "var(--text-mut)",
              fontSize: 14,
              margin: 0,
            }}
          >
            اطلاعات سفارش شما با موفقیت دریافت شد.
          </p>
        </div>

        {/* ORDER NUMBER */}
        <div style={boxStyle}>
          <div style={rowStyle}>
            <span>شماره سفارش</span>

            <strong>
              #{order.id}
            </strong>
          </div>
        </div>

        {/* CUSTOMER INFO */}
        <div style={boxStyle}>
          <h2 style={titleStyle}>
            اطلاعات گیرنده
          </h2>

          <div style={rowStyle}>
            <span>نام و نام خانوادگی</span>

            <strong>
              {order.customer_name}
            </strong>
          </div>

          <div style={rowStyle}>
            <span>شماره موبایل</span>

            <strong dir="ltr">
              {order.customer_phone}
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
                lineHeight: 1.8,
              }}
            >
              {order.customer_address}
            </strong>
          </div>
        </div>

        {/* PAYMENT INFO */}
        <div style={boxStyle}>
          <h2 style={titleStyle}>
            اطلاعات پرداخت
          </h2>

          <div style={rowStyle}>
            <span>مبلغ سفارش</span>

            <strong>
              {money(Number(order.total))}
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

            <strong>
              {order.payment_tracking_code || "ثبت نشده"}
            </strong>
          </div>

          {order.payment_transaction_time && (
            <div style={rowStyle}>
              <span>زمان تراکنش</span>

              <strong>
                {order.payment_transaction_time}
              </strong>
            </div>
          )}
        </div>

        {/* STATUS */}
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
            marginBottom: 20,
          }}
        >
          سفارش شما در انتظار بررسی و تأیید پرداخت است.
        </div>

        <button
          onClick={() => router.push("/shop")}
          style={{
            width: "100%",
            background: "#22E5C9",
            color: "#061014",
            border: "none",
            borderRadius: 12,
            padding: "14px",
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          بازگشت به فروشگاه
        </button>
      </div>
    </div>
  );
}

const boxStyle = {
  background: "var(--bg)",
  borderRadius: 14,
  padding: 18,
  marginBottom: 15,
};

const titleStyle = {
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
