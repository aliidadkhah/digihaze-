"use client";

import { useState } from "react";
import Link from "next/link";
import SiteImage from "./SiteImage";
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

  // اگر available مشخص نشده باشد، محصول را موجود در نظر می‌گیریم
  const isAvailable = product.available !== false;

  const hasColors = product.colors?.length > 0;

  // رنگ/مدل انتخاب‌شده روی همین کارت (پیش‌فرض: اولین رنگ)
  const [selectedColor, setSelectedColor] = useState(
    hasColors ? product.colors[0] : null
  );

  // پیدا کردن محصول (با همین رنگ انتخاب‌شده) در سبد خرید
  const cartItem = cart.find(
    (item) =>
      item.product.id === product.id &&
      (item.product.selectedColor?.id || null) ===
        (selectedColor?.id || null)
  );

  const qty = cartItem ? cartItem.qty : 0;

  const handleAdd = () => {
    addToCart(
      hasColors ? { ...product, selectedColor } : product,
      1
    );
  };

  return (
    <div
      className={isAvailable ? "glow-box" : ""}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 18,
        willChange: "transform",
        transition: "box-shadow 0.3s ease",
        boxShadow:
          hover && isAvailable
            ? `0 20px 44px -10px ${product.color}88, 0 0 0 1px ${product.color}22, 0 0 32px -4px ${product.color}66`
            : "none",
        "--glow": "#4F7FFF",
        "--glow-2": product.color || "#9B5CFF",
      }}
    >
      <div
        className={isAvailable ? "glow-box-body" : ""}
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 18,
          overflow: "hidden",
          position: "relative",
          ...(isAvailable
            ? {}
            : {
                background: "var(--surface)",
                border: "1px solid var(--surface2)",
              }),
        }}
      >
        {/* PRODUCT LINK */}
        <Link
          href={`/product/${product.category}/${product.slug || product.id}`}
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
              background: "var(--bg)",
            }}
          >
            <SiteImage
              src={product.images[0]}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",

                /*
                 * اگر ناموجود باشد عکس کمی تاریک می‌شود
                 */
                filter: isAvailable
                  ? "none"
                  : "grayscale(70%) brightness(0.55)",

                transform:
                  hover && isAvailable
                    ? "scale(1.08)"
                    : "scale(1)",

                transition:
                  "transform 0.5s ease, filter 0.3s ease",
              }}
            />

            {/* BADGE */}
            {product.badge && isAvailable && (
              <div
                style={{
                  position: "absolute",
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
            {product.discount > 0 && isAvailable && (
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                }}
              >
                <span
                  style={{
                    background: "var(--ink)",
                    color: "#FFB020",
                    fontSize: 12,
                    fontWeight: 800,
                    borderRadius: 999,
                    padding: "4px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Percent size={11} />
                  {product.discount}٪
                </span>
              </div>
            )}

            {/* ناموجود */}
            {!isAvailable && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    background: "rgba(0,0,0,0.78)",
                    color: "#fff",
                    padding: "9px 22px",
                    borderRadius: 999,
                    fontFamily: "var(--font-primary)",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "1px solid rgba(255,255,255,0.2)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  ناموجود
                </div>
              </div>
            )}
          </div>

          {/* PRODUCT INFO */}
          <div
            style={{
              padding: "14px 14px 4px",
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            {/* BRAND */}
            <div
              style={{
                color: "var(--text-mut)",
                fontSize: 11,
                marginBottom: 4,
              }}
            >
              {product.brand}
            </div>

            {/* NAME */}
            <div
              style={{
                fontWeight: 700,
                fontSize: 14.5,
                marginBottom: 6,
                minHeight: 38,
                lineHeight: 1.35,
                color: "var(--text-hi)",
              }}
            >
              {product.name}
            </div>

            {/* STARS */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <Stars rating={product.rating} />

              <span
                style={{
                  color: "var(--text-mut)",
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
                alignItems: "baseline",
                gap: 8,
                marginTop: "auto",
              }}
            >
              {isAvailable ? (
                <>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: "var(--text-hi)",
                    }}
                  >
                    {money(discountedPrice(product))}
                  </span>

                  {product.discount > 0 && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-faint)",
                        textDecoration: "line-through",
                      }}
                    >
                      {money(product.price)}
                    </span>
                  )}
                </>
              ) : (
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 14,
                    color: "var(--text-mut)",
                  }}
                >
                  فعلاً موجود نیست
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* CART CONTROLS */}
        <div
          style={{
            padding: "10px 14px 16px",
          }}
        >
          {/* انتخاب رنگ/مدل - قبل از افزودن به سبد باید مشخص باشه کدوم اضافه می‌شه */}
          {isAvailable && hasColors && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 8,
              }}
            >
              {product.colors.map((c) => {
                const isSelected = selectedColor?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedColor(c);
                    }}
                    title={c.name}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: c.hex,
                      border: isSelected
                        ? "2px solid var(--text-hi)"
                        : "2px solid var(--surface2)",
                      boxShadow: isSelected
                        ? "0 0 0 2px var(--surface)"
                        : "none",
                      cursor: "pointer",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  />
                );
              })}

              {selectedColor?.name && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-mut)",
                    fontFamily: "var(--font-primary)",
                  }}
                >
                  {selectedColor.name}
                </span>
              )}
            </div>
          )}

          {!isAvailable ? (
            /* ناموجود */
            <button
              disabled
              style={{
                width: "100%",
                background: "var(--surface2)",
                color: "var(--text-mut)",
                border: "none",
                borderRadius: 12,
                padding: "10px 0",
                fontFamily: "var(--font-primary)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "not-allowed",
              }}
            >
              ناموجود
            </button>
          ) : qty === 0 ? (
            /* ADD TO CART */
            <button
              onClick={(e) => {
                e.preventDefault();
                handleAdd();
              }}
              className="brand-gradient-btn"
              style={{
                width: "100%",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "10px 0",
                fontFamily: "var(--font-primary)",
                fontWeight: 700,
                fontSize: 11.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <ShoppingCart size={14} color="#fff" />
              افزودن به سبد خرید
            </button>
          ) : (
            /* QUANTITY CONTROLS */
            <div
              style={{
                width: "100%",
                height: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--surface2)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {/* DELETE */}
              <button
                onClick={() =>
                  removeItem(product.id, selectedColor?.id || null)
                }
                aria-label="حذف از سبد خرید"
                style={{
                  width: 42,
                  height: 42,
                  border: "none",
                  background: "transparent",
                  color: "#ff5c5c",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
                    qty - 1,
                    selectedColor?.id || null
                  )
                }
                aria-label="کاهش تعداد"
                style={{
                  width: 38,
                  height: 38,
                  border: "none",
                  background: "transparent",
                  color: "var(--text-hi)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Minus size={17} />
              </button>

              {/* QUANTITY */}
              <div
                style={{
                  minWidth: 30,
                  textAlign: "center",
                  color: "var(--text-hi)",
                  fontFamily: "var(--font-primary)",
                  fontWeight: 800,
                  fontSize: 14,
                  userSelect: "none",
                }}
              >
                {qty}
              </div>

              {/* PLUS */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleAdd();
                }}
                aria-label="افزایش تعداد"
                style={{
                  width: 38,
                  height: 38,
                  border: "none",
                  background: "transparent",
                  color: "var(--text-hi)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
