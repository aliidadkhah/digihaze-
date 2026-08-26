"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { Reveal } from "./ui";
import ProductCard from "./ProductCard";
import {
  CATEGORIES,
  PRODUCTS,
  discountedPrice,
} from "@/lib/data";

export default function ShopContent({
  initialCategory,
  initialSearch,
}) {
  const [active, setActive] = useState(
    initialCategory || "all"
  );

  const [sort, setSort] = useState("default");

  const [search, setSearch] = useState(
    initialSearch || ""
  );

  useEffect(() => {
    setActive(initialCategory || "all");
  }, [initialCategory]);

  useEffect(() => {
    setSearch(initialSearch || "");
  }, [initialSearch]);

  const chips = [
    {
      id: "all",
      label: "همه",
      color: "var(--text-hi)",
    },
    ...CATEGORIES,
  ];

  // -----------------------------
  // نرمال‌سازی متن فارسی
  // -----------------------------

  function normalizeText(value) {
    if (!value) return "";

    return String(value)
      .toLowerCase()
      .trim()
      .replace(/ي/g, "ی")
      .replace(/ى/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/ة/g, "ه")
      .replace(/ۀ/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/إ/g, "ا")
      .replace(/أ/g, "ا")
      .replace(/آ/g, "ا")
      .replace(/‌/g, " ")
      .replace(/\s+/g, " ");
  }

  // -----------------------------
  // جستجو
  // -----------------------------

  const list = useMemo(() => {
    let arr =
      active === "all"
        ? [...PRODUCTS]
        : PRODUCTS.filter(
            (p) => p.category === active
          );

    const q = normalizeText(search);

    if (q) {
      /*
       * فقط فیلدهایی که واقعاً برای جستجو
       * مناسب هستند بررسی می‌شوند.
       *
       * name
       * brand
       * category
       * description
       * tags
       */

      const searchWords = q
        .split(" ")
        .filter(Boolean);

      arr = arr.filter((p) => {
        const searchableText = normalizeText(
          [
            p.name,
            p.brand,
            p.category,
            p.description,
            p.shortDescription,
            ...(Array.isArray(p.tags)
              ? p.tags
              : []),
          ]
            .filter(Boolean)
            .join(" ")
        );

        /*
         * تمام کلمات جستجو باید داخل
         * اطلاعات محصول وجود داشته باشند.
         *
         * مثلاً:
         *
         * "شکلات پسته"
         *
         * باید هم "شکلات"
         * و هم "پسته"
         * در محصول وجود داشته باشد.
         */

        return searchWords.every((word) =>
          searchableText.includes(word)
        );
      });
    }

    // -----------------------------
    // مرتب‌سازی
    // -----------------------------

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

    if (sort === "rating") {
      arr.sort(
        (a, b) =>
          (b.rating || 0) -
          (a.rating || 0)
      );
    }

    return arr;
  }, [active, sort, search]);

  return (
    <div
      dir="rtl"
      style={{
        width: "100%",
        maxWidth: 1180,
        margin: "0 auto",
        padding: "40px 20px 70px",
        boxSizing: "border-box",
      }}
    >
      {/* عنوان */}

      <h1
        style={{
          fontFamily: "Vazirmatn",
          fontWeight: 800,
          fontSize: 28,
          marginBottom: 6,
        }}
      >
        فروشگاه
      </h1>

      {/* تعداد نتایج */}

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

      {/* فیلتر و مرتب‌سازی */}

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
        {/* دسته‌بندی‌ها */}

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
                onClick={() =>
                  setActive(c.id)
                }
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
                  padding:
                    "8px 18px",
                  fontFamily:
                    "Vazirmatn",
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

        {/* مرتب‌سازی */}

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

          <select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value)
            }
            style={{
              background:
                "var(--surface)",
              color:
                "var(--text-hi)",
              border:
                "1px solid var(--surface2)",
              borderRadius: 10,
              padding:
                "8px 12px",
              fontFamily:
                "Vazirmatn",
              fontSize: 13,
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
        </div>
      </div>

      {/* نتایج */}

      {list.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
          }}
        >
          <p
            style={{
              color:
                "var(--text-mut)",
              fontSize: 14,
              fontFamily:
                "Vazirmatn",
              margin: 0,
            }}
          >
            محصولی با این مشخصات
            پیدا نشد.
          </p>
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
              delay={
                0.05 * (i % 4)
              }
            >
              <ProductCard
                product={p}
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
