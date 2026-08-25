"use client";

import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ShoppingBag,
} from "lucide-react";

export default function OrderSuccessClient({
  orderId,
}) {
  const router = useRouter();

  return (
    <main
      dir="rtl"
      style={{
        minHeight:
          "70vh",

        display: "flex",

        justifyContent:
          "center",

        alignItems:
          "center",

        padding:
          "50px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,

          background:
            "var(--surface)",

          border:
            "1px solid var(--surface2)",

          borderRadius: 22,

          padding: 32,

          textAlign: "center",

          boxSizing:
            "border-box",
        }}
      >
        {/* آیکون */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "center",

            marginBottom: 20,
          }}
        >
          <CheckCircle
            size={68}
            color="#22E5C9"
            strokeWidth={1.7}
          />
        </div>

        {/* عنوان */}

        <h1
          style={{
            fontFamily:
              "Vazirmatn",

            fontSize: 26,

            fontWeight: 900,

            color:
              "var(--text-hi)",

            margin:
              "0 0 12px",
          }}
        >
          سفارش شما با موفقیت ثبت شد
        </h1>

        {/* توضیح */}

        <p
          style={{
            fontFamily:
              "Vazirmatn",

            color:
              "var(--text-mut)",

            fontSize: 14,

            lineHeight: 2,

            marginBottom: 25,
          }}
        >
          اطلاعات سفارش شما با موفقیت
          ثبت شد و برای بررسی ارسال گردید.
        </p>

        {/* شماره سفارش */}

        {orderId && (
          <div
            style={{
              background:
                "var(--bg)",

              borderRadius: 14,

              padding: 18,

              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontFamily:
                  "Vazirmatn",

                color:
                  "var(--text-mut)",

                fontSize: 12,

                marginBottom: 6,
              }}
            >
              شماره سفارش
            </div>

            <div
              style={{
                fontFamily:
                  "Vazirmatn",

                color:
                  "var(--text-hi)",

                fontSize: 20,

                fontWeight: 900,
              }}
            >
              #{orderId}
            </div>
          </div>
        )}

        {/* وضعیت */}

        <div
          style={{
            background:
              "#22E5C912",

            border:
              "1px solid #22E5C933",

            borderRadius: 14,

            padding: 15,

            marginBottom: 25,

            fontFamily:
              "Vazirmatn",

            fontSize: 13,

            lineHeight: 2,

            color:
              "var(--text-hi)",
          }}
        >
          <strong>
            پرداخت شما ثبت شد ✓
          </strong>

          <br />

          سفارش شما پس از بررسی پرداخت
          آماده پردازش خواهد شد.
        </div>

        {/* بازگشت */}

        <button
          type="button"
          onClick={() =>
            router.push("/")
          }
          style={{
            width: "100%",

            border: "none",

            background:
              "var(--text-hi)",

            color:
              "var(--bg)",

            borderRadius: 12,

            padding:
              "14px 0",

            fontFamily:
              "Vazirmatn",

            fontWeight: 800,

            fontSize: 14,

            cursor: "pointer",

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            gap: 8,
          }}
        >
          <ShoppingBag
            size={18}
          />

          بازگشت به فروشگاه
        </button>
      </div>
    </main>
  );
}
