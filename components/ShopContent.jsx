"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { Reveal } from "./ui";
import ProductCard from "./ProductCard";
import SiteImage from "./SiteImage";
import {
  CATEGORIES,
  discountedPrice,
  resolveCategoryId,
} from "@/lib/data";

/* =========================================
   نرمال‌سازی متن فارسی
========================================= */

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ى/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ۀ/g, "ه")
    .replace(/ة/g, "ه")
    .replace(/\u200c/g, " ")
    .replace(/\u200f/g, "")
    .replace(/\u200e/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================
   ساخت متن قابل جستجو برای محصول
========================================= */

function getSearchText(product) {
  const category = CATEGORIES.find(
    (c) => c.id === resolveCategoryId(product.category)
  );

  const categoryLabel = category?.label || "";

  const specs = Array.isArray(product.specs)
    ? product.specs
        .map((spec) => `${spec.k} ${spec.v}`)
        .join(" ")
    : "";

  return normalizeText(
    [
      product.name,
      product.brand,
      categoryLabel,
      product.description,
      specs,
    ].join(" ")
  );
}

/* =========================================
   جستجو
========================================= */

function matchesSearch(product, query) {
  const q = normalizeText(query);

  if (!q) return true;

  const productText = getSearchText(product);

  if (productText.includes(q)) {
    return true;
  }

  const words = q
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length > 1) {
    return words.every((word) =>
      productText.includes(word)
    );
  }

  return false;
}

export default function ShopContent({
  products = [],
  initialCategory,
  initialSearch,
  initialSub,
  initialDiscountOnly,
}) {
  const [active, setActive] = useState(
    initialCategory || "all"
  );

  const [activeSub, setActiveSub] = useState(
    initialSub || ""
  );

  const [sort, setSort] = useState("default");

  const [search, setSearch] = useState(
    initialSearch || ""
  );

  const [discountOnly, setDiscountOnly] = useState(
    Boolean(initialDiscountOnly)
  );

  useEffect(() => {
    setActive(initialCategory || "all");
  }, [initialCategory]);

  useEffect(() => {
    setActiveSub(initialSub || "");
  }, [initialSub]);

  useEffect(() => {
    setSearch(initialSearch || "");
  }, [initialSearch]);

  useEffect(() => {
    setDiscountOnly(Boolean(initialDiscountOnly));
  }, [initialDiscountOnly]);

  const chips = [
    {
      id: "all",
      label: "همه",
      color: "var(--text-hi)",
    },
    ...CATEGORIES,
  ];

  // دسته‌بندی فعال (برای نمایش بنر عریض مخصوص همون دسته)
  const activeCategoryData = CATEGORIES.find(
    (c) => c.id === active
  );

  const list = useMemo(() => {
    let arr =
      active === "all"
        ? products
        : products.filter(
            (p) => resolveCategoryId(p.category) === active
          );

    /*
     * فیلتر زیردسته
     */
    if (activeSub) {
      const cat = CATEGORIES.find(
        (c) => c.id === active
      );

      const subLabel =
        cat?.subcategories?.find(
          (s) => s.id === activeSub
        )?.label;

      if (subLabel) {
        arr = arr.filter(
          (p) =>
            normalizeText(p.brand) ===
            normalizeText(subLabel)
        );
      }
    }

    /*
     * جستجو
     */
    if (search.trim()) {
      arr = arr.filter((product) =>
        matchesSearch(product, search)
      );
    }

    /*
     * فقط محصولات تخفیف‌دار
     */
    if (discountOnly) {
      arr = arr.filter(
        (p) => Number(p.discount || 0) > 0
      );
    }

    /*
     * کپی آرایه
     */
    arr = [...arr];

    /*
     * مرتب‌سازی قیمت
     */
    if (sort === "price-asc") {
      arr.sort(
        (a, b) =>
          discountedPrice(a) -
          discountedPrice(b)
      );
    }

    if (sort === "price-desc") {
      arr.sort(
        (a, b) =>
          discountedPrice(b) -
          discountedPrice(a)
      );
    }

    /*
     * مرتب‌سازی امتیاز
     */
    if (sort === "rating") {
      arr.sort(
        (a, b) =>
          Number(b.rating || 0) -
          Number(a.rating || 0)
      );
    }

    /*
     * محصولات ناموجود انتهای لیست
     */
    arr.sort((a, b) => {
      const aOut =
        a.available === false ? 1 : 0;

      const bOut =
        b.available === false ? 1 : 0;

      return aOut - bOut;
    });

    return arr;
  }, [
    products,
    active,
    activeSub,
    sort,
    search,
    discountOnly,
  ]);

  return (
    <>
      {/* بنر عریض مخصوص دسته‌بندی فعال (مثل بنر صفحه اصلی، با همون نسبت ابعاد) */}
      {activeCategoryData?.banner && (
        <div
          className="category-hero-banner"
          style={{
            width: "100%",
            overflow: "hidden",
            aspectRatio: "21 / 3",
            boxSizing: "border-box",
          }}
        >
          <SiteImage
            src={activeCategoryData.banner}
            alt={activeCategoryData.label}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      )}

      <div
        dir="rtl"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "20px 20px 70px",
        }}
      >
        <p
          style={{
            color: "var(--text-lo)",
            fontSize: 14,
            marginBottom: 26,
            fontFamily: "Vazirmatn",
          }}
        >
          {search
            ? `نتایج جستجو برای «${search}» — `
            : ""}
          {list.length} محصول
        </p>

      {/* فیلترها */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 26,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {chips.map((c) => {
            const selected =
              active === c.id;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActive(c.id);
                  setActiveSub("");
                }}
                style={{
                  border: `1.5px solid ${
                    selected
                      ? c.color
                      : "var(--surface2)"
                  }`,
                  background: selected
                    ? `${c.color}22`
                    : "transparent",
                  color: selected
                    ? c.color
                    : "var(--text-lo)",
                  borderRadius: 999,
                  padding: "8px 18px",
                  fontFamily: "Vazirmatn",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Filter
            size={15}
            color="var(--text-lo)"
          />

          <div style={{ position: "relative", display: "inline-flex" }}>
            <select
              value={sort}
              onChange={(e) =>
                setSort(e.target.value)
              }
              aria-label="مرتب‌سازی محصولات"
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                background: "var(--surface)",
                color: "var(--text-hi)",
                border:
                  "1px solid var(--surface2)",
                borderRadius: 10,
                padding: "8px 30px 8px 28px",
                fontFamily: "Vazirmatn",
                fontSize: 13,
                outline: "none",
                width: "auto",
              }}
            >
              <option value="default">
                مرتب‌سازی
              </option>

              <option value="price-asc">
                ارزان‌ترین
              </option>

              <option value="price-desc">
                گران‌ترین
              </option>

              <option value="rating">
                محبوب‌ترین
              </option>
            </select>

            <ChevronDown
              size={14}
              color="var(--text-lo)"
              style={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* محصولات */}

      {list.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "var(--text-mut)",
            fontFamily: "Vazirmatn",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            محصولی پیدا نشد
          </div>

          <div
            style={{
              fontSize: 13,
            }}
          >
            عبارت جستجو را تغییر دهید
            یا دسته‌بندی دیگری را
            امتحان کنید.
          </div>
        </div>
      ) : (
        <div
          className="product-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill,minmax(190px,1fr))",
            gap: 18,
          }}
        >
          {list.map((p, i) => (
            <Reveal
              key={p.id}
              delay={0.05 * (i % 4)}
            >
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 600px) {
          .product-grid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            ) !important;

            gap: 10px !important;
          }
        }

        @media (max-width: 380px) {
          .product-grid {
            gap: 8px !important;
          }
        }

        @media (max-width: 768px) {
          .category-hero-banner {
            aspect-ratio: 16 / 5 !important;
          }
        }

        @media (max-width: 480px) {
          .category-hero-banner {
            aspect-ratio: 16 / 6 !important;
          }
        }
      `}</style>
      </div>
    </>
  );
}
