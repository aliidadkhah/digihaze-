```jsx
"use client";

import Link from "next/link";
import { ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import { money, discountedPrice } from "@/lib/data";
import { useCart } from "./Providers";
import { qtyBtnStyle } from "./ui";

export default function CartContent() {
  const { cart, updateQty, removeItem } = useCart();

  const total = cart.reduce((sum, item) => {
    return sum + discountedPrice(item.product) * item.qty;
  }, 0);

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
          size={40}
          color="var(--border-soft)"
          style={{ marginBottom: 20 }}
        />

        <h2
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            marginBottom: 20,
          }}
        >
          سبد خرید خالی است
        </h2>

        <Link
          href="/shop"
          style={{
            display: "inline-block",
            background: "#22E5C9",
            color: "#000",
            padding: "12px 30px",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: 800,
            fontFamily: "Vazirmatn",
          }}
        >
          رفتن به فروشگاه
        </Link>
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
          marginBottom: 25,
        }}
      >
        سبد خرید
      </h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {cart.map((item) => {
          const product = item.product;

          return (
            <div
              key={product.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "var(--surface)",
                border: "1px solid var(--surface2)",
                padding: 12,
                borderRadius: 16,
              }}
            >
              <Link
                href={"/product/" + product.id}
                style={{
                  flexShrink: 0,
                  textDecoration: "none",
                }}
              >
                <img
                  src={product.images[0]}
                  alt={product.name}
                  style={{
                    width: 75,
                    height: 75,
                    borderRadius: 12,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Link>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {product.name}
                </div>

                <div
                  style={{
                    color: "var(--text-mut)",
                    marginTop: 5,
                    fontSize: 13,
                  }}
                >
                  {money(discountedPrice(product))}
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
                  type="button"
                  onClick={() =>
                    updateQty(product.id, item.qty + 1)
                  }
                  style={qtyBtnStyle}
                >
                  <Plus size={14} />
                </button>

                <span
                  style={{
                    width: 30,
                    textAlign: "center",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  {item.qty}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    updateQty(product.id, item.qty - 1)
                  }
                  style={qtyBtnStyle}
                >
                  <Minus size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => removeItem(product.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 6,
                }}
              >
                <Trash2
                  size={18}
                  color="#2F86FF"
                />
              </button>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 30,
          background: "var(--surface)",
          border: "1px solid var(--surface2)",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <span
            style={{
              color: "var(--text-mut)",
              fontSize: 14,
            }}
          >
            مبلغ نهایی
          </span>

          <strong
            style={{
              fontSize: 17,
            }}
          >
            {money(total)}
          </strong>
        </div>

        <Link
          href="/checkout"
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            textAlign: "center",
            padding: 14,
            borderRadius: 12,
            background: "#22E5C9",
            color: "#000",
            fontWeight: 800,
            textDecoration: "none",
            fontFamily: "Vazirmatn",
            fontSize: 14,
          }}
        >
          ادامه فرآیند خرید
        </Link>
      </div>
    </div>
  );
}
```
