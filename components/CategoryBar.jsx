"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/data";

/* =========================================
   نوار دسته‌بندی زیر ناوبری اصلی
   (مشابه ردیف دسته‌بندی سایت‌های مرجع)
========================================= */

export default function CategoryBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory =
    pathname === "/shop"
      ? searchParams.get("category") || "all"
      : null;

  const items = [
    { href: "/shop", label: "همه محصولات", id: "all" },
    ...CATEGORIES.map((c) => ({
      href: `/shop?category=${c.id}`,
      label: c.label,
      id: c.id,
      color: c.color,
    })),
  ];

  return (
    <div
      className="category-bar"
      style={{
        borderTop: "1px solid var(--surface2)",
        borderBottom: "1px solid var(--surface2)",
        background: "var(--surface)",
      }}
    >
      <div
        className="category-bar-inner"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          gap: 26,
          overflowX: "auto",
        }}
      >
        {items.map((it) => {
          const active = activeCategory === it.id;

          return (
            <Link
              key={it.href}
              href={it.href}
              className="category-bar-link"
              style={{
                position: "relative",
                flexShrink: 0,
                whiteSpace: "nowrap",
                fontFamily: "Vazirmatn, sans-serif",
                fontSize: 13.5,
                fontWeight: active ? 800 : 600,
                color: active ? "#22E5C9" : "var(--text-lo)",
                textDecoration: "none",
                padding: "13px 2px",
              }}
            >
              {it.label}

              {active && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    left: 0,
                    height: 2,
                    background: "#22E5C9",
                    borderRadius: 2,
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .category-bar-inner {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .category-bar-inner::-webkit-scrollbar {
          display: none;
        }

        .category-bar-link:hover {
          color: var(--text-hi);
        }

        @media (max-width: 760px) {
          .category-bar-inner {
            gap: 20px;
            padding: 0 14px;
          }

          .category-bar-link {
            font-size: 13px !important;
            padding: 11px 2px !important;
          }
        }

        @media (max-width: 380px) {
          .category-bar-inner {
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
