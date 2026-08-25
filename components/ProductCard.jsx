"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Percent,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";

import { Badge, Stars } from "./ui";
import { money, discountedPrice } from "@/lib/data";
import { useCart } from "./Providers";

export default function ProductCard({ product }) {
  const [hover, setHover] = useState(false);

  const {
    cart,
    addToCart,
    updateQty,
    removeItem,
  } = useCart();

  const cartItem = cart.find(
    (item) => item.product.id === product.id
  );

  const qty = cartItem ? cartItem.qty : 0;

  // اگر stock برابر صفر باشد، محصول ناموجود است
  const isOutOfStock =
    product.stock !== undefined && product.stock <= 0;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 18,
        transition:
          "transform 0.25s ease, box-shadow 0.25s ease",
        transform: hover
          ? "translateY(-6px)"
          : "translateY(0)",
        boxShadow: hover
          ? `0 16px 32px -12px ${product.color}55`
          : "none",
        willChange: "transform",
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface)",
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid var(--surface2)",
        }}
      >
        {/* PRODUCT LINK */}

        <Link
          href={`/product/${product.id}`}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          {/* IMAGE */}

          <div
            style={{
              position: "relative",
              aspectRatio: "4/5",
              overflow: "hidden",
              background: "var(--surface2)",
            }}
          >
            <img
              src={product.images[0]}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",

                transform:
                  hover && !isOutOfStock
                    ? "scale(1.08)"
                    : "scale(1)",

                transition:
                  "transform 0.5s ease",

                filter: isOutOfStock
                  ? "grayscale(100%) brightness(0.55)"
                  : "none",
              }}
            />

            {/* OUT OF STOCK */}

            {isOutOfStock && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "rgba(0,0,0,0.28)",
                  zIndex: 5,
                }}
              >
                <div
                  style={{
                    padding:
                      "9px 20px",
                    borderRadius: 999,
                    background:
                      "rgba(0,0,0,0.82)",
                    color: "#fff",
                    fontFamily:
                      "Vazirmatn",
                    fontSize: 14,
                    fontWeight: 800,
                    border:
                      "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  ناموجود
                </div>
              </div>
            )}

            {/* BADGE */}

            {!isOutOfStock &&
              product.badge && (
                <div
                  style={{
                    position:
                      "absolute",
                    top: 10,
                    right: 10,
                  }}
                >
                  <Badge bg={product.color}>
                    {product.badge}
                  </Badge>
                </div>
              )}

            {/* DISCOUNT */}

            {product.discount > 0 && (
              <div
                style={{
                  position:
                    "absolute",
                  top: 10,
                  left: 10,
                }}
              >
                <span
                  style={{
                    background:
                      "var(--ink)",
                    color: "#C6FF3D",
                    fontSize: 12,
                    fontWeight: 800,
                    borderRadius: 999,
                    padding: "4px 10px",
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 4,
                  }}
                >
                  <Percent size={11} />

                  {product.discount}٪
                </span>
              </div>
            )}
          </div>

          {/* PRODUCT INFO */}

          <div
            style={{
              padding:
                "14px 14px 4px",
              display: "flex",
              flexDirection:
                "column",
              flex: 1,
            }}
          >
            <div
              style={{
                color:
                  "var(--text-mut)",
                fontSize: 11,
                marginBottom: 4,
              }}
            >
              {product.brand}
            </div>

            <div
              style={{
                fontWeight: 700,
                fontSize: 14.5,
                marginBottom: 6,
                minHeight: 38,
                lineHeight: 1.35,
                color:
                  "var(--text-hi)",
              }}
            >
              {product.name}
            </div>

            {/* STARS */}

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <Stars
                rating={
                  product.rating
                }
              />

              <span
                style={{
                  color:
                    "var(--text-mut)",
                  fontSize: 11,
                }}
              >
                ({product.reviewsCount})
              </span>
            </div>

            {/* PRICE */}

            <div
              style={{
                display: "flex",
                alignItems:
                  "baseline",
                gap: 8,
                marginTop: "auto",
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  color:
                    "var(--text-hi)",
                }}
              >
                {money(
                  discountedPrice(
                    product
                  )
                )}
              </span>

              {product.discount >
                0 && (
                <span
                  style={{
                    fontSize: 12,
                    color:
                      "var(--text-faint)",
                    textDecoration:
                      "line-through",
                  }}
                >
                  {money(
                    product.price
                  )}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* CART CONTROLS */}

        <div
          style={{
            padding:
              "10px 14px 16px",
          }}
        >
          {isOutOfStock ? (
            /* OUT OF STOCK BUTTON */

            <button
              disabled
              style={{
                width: "100%",
                background:
                  "var(--surface2)",
                color:
                  "var(--text-mut)",
                border: "none",
                borderRadius: 12,
                padding: "10px 0",
                fontFamily:
                  "Vazirmatn",
                fontWeight: 700,
                fontSize: 13,
                cursor:
                  "not-allowed",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                gap: 8,
                opacity: 0.8,
              }}
            >
              ناموجود
            </button>
          ) : qty === 0 ? (
            /* ADD TO CART */

            <button
              onClick={() =>
                addToCart(
                  product,
                  1
                )
              }
              style={{
                width: "100%",
                background:
                  "var(--text-hi)",
                color:
                  "var(--bg)",
                border: "none",
                borderRadius: 12,
                padding: "10px 0",
                fontFamily:
                  "Vazirmatn",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                gap: 8,
              }}
            >
              <ShoppingCart
                size={17}
              />

              افزودن به سبد خرید
            </button>
          ) : (
            /* QUANTITY CONTROLS */

            <div
              style={{
                width: "100%",
                height: 42,
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                background:
                  "var(--surface2)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {/* DELETE */}

              <button
                onClick={() =>
                  removeItem(
                    product.id
                  )
                }
                aria-label="حذف از سبد خرید"
                style={{
                  width: 42,
                  height: 42,
                  border: "none",
                  background:
                    "transparent",
                  color: "#ff5c5c",
                  cursor: "pointer",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  flexShrink: 0,
                }}
              >
                <Trash2 size={17} />
              </button>

              {/* MINUS */}

              <button
                onClick={() =>
                  updateQty(
                    product.id,
                    qty - 1
                  )
                }
                aria-label="کاهش تعداد"
                style={{
                  width: 38,
                  height: 38,
                  border: "none",
                  background:
                    "transparent",
                  color:
                    "var(--text-hi)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <Minus size={17} />
              </button>

              {/* QUANTITY */}

              <div
                style={{
                  minWidth: 30,
                  textAlign: "center",
                  color:
                    "var(--text-hi)",
                  fontFamily:
                    "Vazirmatn",
                  fontWeight: 800,
                  fontSize: 14,
                  userSelect:
                    "none",
                }}
              >
                {qty}
              </div>

              {/* PLUS */}

              <button
                onClick={() =>
                  addToCart(
                    product,
                    1
                  )
                }
                aria-label="افزایش تعداد"
                style={{
                  width: 38,
                  height: 38,
                  border: "none",
                  background:
                    "transparent",
                  color:
                    "var(--text-hi)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <Plus size={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
