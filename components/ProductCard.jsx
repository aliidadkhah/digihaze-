"use client";
import { useState } from "react";
import Link from "next/link";
import { Percent } from "lucide-react";
import { Badge, Stars } from "./ui";
import { money, discountedPrice } from "@/lib/data";
import { useCart } from "./Providers";

export default function ProductCard({ product }) {
  const [hover, setHover] = useState(false);
  const { addToCart } = useCart();

  return (
    // لایه‌ی بیرونی: فقط مسئول transform و box-shadow است (بدون overflow/radius روی همین لایه)
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 18,
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        transform: hover ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hover ? `0 16px 32px -12px ${product.color}55` : "none",
        willChange: "transform",
      }}
    >
      {/* لایه‌ی داخلی: مسئول overflow:hidden و border-radius (کلیپ محتوا) */}
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
        <Link
          href={`/product/${product.id}`}
          style={{ display: "flex", flexDirection: "column", flex: 1, textDecoration: "none", color: "inherit" }}
        >
          <div style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden" }}>
            <img
              src={product.images[0]}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: hover ? "scale(1.08)" : "scale(1)",
                transition: "transform 0.5s ease",
              }}
            />
            {product.badge && (
              <div style={{ position: "absolute", top: 10, right: 10 }}>
                <Badge bg={product.color}>{product.badge}</Badge>
              </div>
            )}
            {product.discount > 0 && (
              <div style={{ position: "absolute", top: 10, left: 10 }}>
                <span
                  style={{
                    background: "var(--ink)",
                    color: "#C6FF3D",
                    fontSize: 12,
                    fontWeight: 800,
                    borderRadius: 999,
                    padding: "4px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Percent size={11} /> {product.discount}٪
                </span>
              </div>
            )}
          </div>

          {/* بخش متنی: flex:1 تا فضای باقی‌مانده رو پر کنه و همه کارت‌ها هم‌ارتفاع بشن */}
          <div style={{ padding: "14px 14px 4px", display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ color: "var(--text-mut)", fontSize: 11, marginBottom: 4 }}>{product.brand}</div>
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
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Stars rating={product.rating} />
              <span style={{ color: "var(--text-mut)", fontSize: 11 }}>({product.reviewsCount})</span>
            </div>
            {/* mt:auto این ردیف رو همیشه ته بخش متنی نگه می‌داره، حتی اگه اسم محصول یک یا دوخطی باشه */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: "auto" }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text-hi)" }}>
                {money(discountedPrice(product))}
              </span>
              {product.discount > 0 && (
                <span style={{ fontSize: 12, color: "var(--text-faint)", textDecoration: "line-through" }}>
                  {money(product.price)}
                </span>
              )}
            </div>
          </div>
        </Link>

        <div style={{ padding: "10px 14px 16px" }}>
          <button
            onClick={() => addToCart(product, 1)}
            style={{
              width: "100%",
              background: "var(--text-hi)",
              color: "var(--bg)",
              border: "none",
              borderRadius: 12,
              padding: "9px 0",
              fontFamily: "Vazirmatn",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            افزودن به سبد خرید
          </button>
        </div>
      </div>
    </div>
  );
}
