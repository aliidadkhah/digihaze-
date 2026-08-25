```jsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
} from "lucide-react";

import { qtyBtnStyle } from "./ui";
import { money, discountedPrice } from "@/lib/data";
import { useCart } from "./Providers";

export default function CartContent() {
  const router = useRouter();

  const {
    cart,
    updateQty,
    removeItem,
  } = useCart();

  const total = cart.reduce(
    (sum, item) =>
      sum + discountedPrice(item.product) * item.qty,
    0
  );

  /*
   * ============================
   * سبد خرید خالی
   * ============================
   */

  if (cart.length === 0) {
    return (
      <main
        dir="rtl"
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: "80px 20px",
          textAlign: "center",
        }}
      >
        <ShoppingBag
          size={46}
          color="var(--border-soft)"
          style={{
            margin: "0 auto 18px",
          }}
        />

        <h1
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 21,
            marginBottom: 10,
          }}
        >
          سبد خریدت خالیه
        </h1>

        <p
          style={{
            color: "var(--text-mut)",
            fontSize: 14,
            marginBottom: 25,
          }}
        >
          یه سر به فروشگاه بزن و محصول مورد علاقه‌ات رو انتخاب کن.
        </p>

        <Link
          href="/shop"
          style={{
            background: "#2F86FF",
            color: "var(--ink)",
            border: "none",
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
      </main>
    );
  }

  /*
   * ============================
   * سبد خرید
   * ============================
   */

  return (
    <main
      dir="rtl"
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "40px 20px 80px",
      }}
    >
      {/* عنوان */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 26,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              fontSize: 26,
              margin: 0,
              marginBottom: 6,
            }}
          >
            سبد خرید
          </h1>

          <p
            style={{
              margin: 0,
              color: "var(--text-mut)",
              fontSize: 13,
            }}
          >
            {cart.reduce(
              (sum, item) => sum + item.qty,
              0
            )}{" "}
            عدد محصول
          </p>
        </div>
      </div>

      {/* محصولات */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginBottom: 26,
        }}
      >
        {cart.map((item) => {
          const product = item.product;

          const price = discountedPrice(product);

          return (
            <div
              key={product.id}
              style={{
                display: "flex",
                gap: 14,
                background: "var(--surface)",
                border: "1px solid var(--surface2)",
                borderRadius: 16,
                padding: 12,
                alignItems: "center",
              }}
            >
              {/* تصویر */}

              <Link
                href={`/product/${product.id}`}
                style={{
                  flexShrink: 0,
                  textDecoration: "none",
                }}
              >
                <img
                  src={product.images?.[0]}
                  alt={product.name}
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 12,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Link>

              {/* اطلاعات محصول */}

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Link
                  href={`/product/${product.id}`}
                  style={{
                    textDecoration: "none",
                    color: "var(--text-hi)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      marginBottom: 5,
                      lineHeight: 1.6,
                    }}
                  >
                    {product.name}
                  </div>
                </Link>

                <div
                  style={{
                    color: "var(--text-mut)",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  {product.brand}
                </div>

                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 13,
                    color: "var(--text-hi)",
                  }}
                >
                  {money(price)}
                </div>

                {product.discount > 0 && (
                  <div
                    style={{
                      color: "var(--text-faint)",
                      fontSize: 11,
                      textDecoration: "line-through",
                      marginTop: 2,
                    }}
                  >
                    {money(product.price)}
                  </div>
                )}
              </div>

              {/* کنترل تعداد */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid var(--surface2)",
                  borderRadius: 11,
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "var(--bg)",
                }}
              >
                <button
                  type="button"
                  aria-label="افزایش تعداد"
                  onClick={() =>
                    updateQty(
                      product.id,
                      item.qty + 1
                    )
                  }
                  style={{
                    ...qtyBtnStyle,
                    width: 34,
                    height: 34,
                  }}
                >
                  <Plus size={14} />
                </button>

                <span
                  style={{
                    width: 32,
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {item.qty}
                </span>

                <button
                  type="button"
                  aria-label="کاهش تعداد"
                  onClick={() =>
                    updateQty(
                      product.id,
                      item.qty - 1
                    )
                  }
                  style={{
                    ...qtyBtnStyle,
                    width: 34,
                    height: 34,
                  }}
                >
                  <Minus size={14} />
                </button>
              </div>

              {/* حذف */}

              <button
                type="button"
                aria-label="حذف محصول"
                onClick={() =>
                  removeItem(product.id)
                }
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: "none",
                  background: "#ff4d4d12",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Trash2
                  size={17}
                  color="#ff5c5c"
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* خلاصه سفارش */}

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--surface2)",
          borderRadius: 18,
          padding: 20,
        }}
      >
        <h2
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 17,
            marginTop: 0,
            marginBottom: 18,
          }}
        >
          خلاصه سفارش
        </h2>

        {/* جمع */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 14,
            color: "var(--text-lo)",
            marginBottom: 12,
          }}
        >
          <span>جمع محصولات</span>

          <span>
            {money(total)}
          </span>
        </div>

        {/* ارسال */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 14,
            color: "var(--text-lo)",
            marginBottom: 16,
          }}
        >
          <span>هزینه ارسال</span>

          <span
            style={{
              color: "#22E5C9",
              fontWeight: 700,
            }}
          >
            رایگان
          </span>
        </div>

        {/* مبلغ نهایی */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 900,
            fontSize: 18,
            borderTop: "1px solid var(--surface2)",
            paddingTop: 16,
            marginBottom: 18,
          }}
        >
          <span>مبلغ نهایی</span>

          <span>
            {money(total)}
          </span>
        </div>

        {/* ادامه خرید */}

        <button
          type="button"
          onClick={() => router.push("/checkout")}
          style={{
            width: "100%",
            background: "#22E5C9",
            color: "#000",
            border: "none",
            borderRadius: 13,
            padding: "15px 18px",
            fontFamily: "Vazirmatn",
            fontWeight: 900,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          ادامه فرآیند خرید

          <ArrowLeft size={18} />
        </button>

        {/* بازگشت به فروشگاه */}

        <button
          type="button"
          onClick={() => router.push("/shop")}
          style={{
            width: "100%",
            marginTop: 10,
            background: "transparent",
            color: "var(--text-mut)",
            border: "1px solid var(--surface2)",
            borderRadius: 13,
            padding: "12px 18px",
            fontFamily: "Vazirmatn",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          ادامه خرید از فروشگاه
        </button>
      </section>
    </main>
  );
}
```
