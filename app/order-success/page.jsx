"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Copy, ArrowRight } from "lucide-react";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("id");

  const [copied, setCopied] = useState(false);

  // شماره کارت خودت را اینجا وارد کن
  const cardNumber = "6037991234567890";

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

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "70vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          background: "var(--surface)",
          border: "1px solid var(--surface2)",
          borderRadius: 22,
          padding: 30,
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        {/* موفقیت */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <CheckCircle
            size={64}
            color="#22E5C9"
            strokeWidth={1.8}
          />
        </div>

        <h1
          style={{
            fontFamily: "Vazirmatn",
            fontSize: 25,
            fontWeight: 900,
            marginBottom: 10,
            color: "var(--text-hi)",
          }}
        >
          سفارش با موفقیت ثبت شد
        </h1>

        <p
          style={{
            color: "var(--text-mut)",
            fontFamily: "Vazirmatn",
            fontSize: 14,
            lineHeight: 1.9,
            marginBottom: 25,
          }}
        >
          ممنون از خرید شما.
          <br />
          اطلاعات پرداخت شما ثبت شد و سفارش در حال بررسی است.
        </p>

        {/* شماره سفارش */}
        {orderId && (
          <div
            style={{
              background: "var(--bg)",
              borderRadius: 14,
              padding: "12px 16px",
              marginBottom: 18,
              fontFamily: "Vazirmatn",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--text-mut)",
                marginBottom: 5,
              }}
            >
              شماره سفارش
            </div>

            <div
              style={{
                fontWeight: 900,
                fontSize: 18,
                color: "var(--text-hi)",
              }}
            >
              #{orderId}
            </div>
          </div>
        )}

        {/* پرداخت کارت به کارت */}
        <div
          style={{
            background: "var(--bg)",
            borderRadius: 16,
            padding: 20,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              fontSize: 16,
              marginBottom: 10,
              color: "var(--text-hi)",
            }}
          >
            اطلاعات پرداخت
          </div>

          <div
            style={{
              fontSize: 13,
              color: "var(--text-mut)",
              marginBottom: 15,
              lineHeight: 1.8,
            }}
          >
            مبلغ سفارش را به شماره کارت زیر واریز کنید.
            <br />
            برای کپی کردن شماره کارت روی آن کلیک کنید.
          </div>

          {/* شماره کارت */}
          <button
            type="button"
            onClick={copyCardNumber}
            style={{
              width: "100%",
              border: "1px solid var(--surface2)",
              background: "var(--surface)",
              borderRadius: 14,
              padding: "15px 12px",
              cursor: "pointer",
              color: "var(--text-hi)",
              fontFamily: "Vazirmatn",
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: 1.5,
              direction: "ltr",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span>
              {cardNumber}
            </span>

            {copied ? (
              <span
                style={{
                  color: "#22E5C9",
                  fontSize: 12,
                  fontWeight: 900,
                  direction: "ltr",
                }}
              >
                Copied ✓
              </span>
            ) : (
              <Copy size={17} />
            )}
          </button>

          <div
            style={{
              marginTop: 12,
              fontFamily: "Vazirmatn",
              fontSize: 12,
              color: "var(--text-mut)",
            }}
          >
            به نام صاحب حساب
          </div>
        </div>

        {/* وضعیت سفارش */}
        <div
          style={{
            background: "#22E5C912",
            border: "1px solid #22E5C933",
            borderRadius: 14,
            padding: 14,
            marginBottom: 22,
            fontFamily: "Vazirmatn",
            fontSize: 13,
            lineHeight: 1.9,
            color: "var(--text-hi)",
          }}
        >
          <strong>سفارش شما ثبت شد.</strong>
          <br />
          پس از بررسی پرداخت، سفارش شما تأیید و پردازش خواهد شد.
        </div>

        {/* برگشت */}
        <button
          type="button"
          onClick={() => router.push("/")}
          style={{
            width: "100%",
            border: "none",
            background: "var(--text-hi)",
            color: "var(--bg)",
            borderRadius: 12,
            padding: "13px 0",
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ArrowRight size={17} />
          بازگشت به فروشگاه
        </button>
      </div>
    </main>
  );
}
