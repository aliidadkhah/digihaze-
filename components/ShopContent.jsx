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
    (c) => c.id === product.category
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
   تطبیق هوشمند سرچ
========================================= */

function matchesSearch(product, query) {
  const q = normalizeText(query);

  if (!q) return true;

  const productText = getSearchText(product);

  /*
   اگر عبارت کامل داخل اطلاعات محصول باشد
   نتیجه معتبر است.
  */
  if (productText.includes(q)) {
    return true;
  }

  /*
   اگر کاربر چند کلمه وارد کرد،
   همه کلمات باید در محصول وجود داشته باشند.
   
   مثال:
   "پاد کالیبرن"
   
   فقط محصولی که هر دو عبارت را داشته باشد
   نمایش داده می‌شود.
  */
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

  /* =========================================
     فیلتر محصولات
  ========================================= */

  const list = useMemo(() => {
    let arr =
      active === "all"
        ? PRODUCTS
        : PRODUCTS.filter(
            (p) => p.category === active
          );

    /*
     * سرچ دقیق
     */
    if (search.trim()) {
      arr = arr.filter((product) =>
        matchesSearch(product, search)
      );
    }

    /*
     * جلوگیری از تغییر مستقیم PRODUCTS
     */
    arr = [...arr];

    /* مرتب‌سازی */

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
        (a, b) => b.rating - a.rating
      );
    }

    return arr;
  }, [active, sort, search]);

  return (
    <div
      dir="rtl"
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "40px 20px 70px",
      }}
    >
      {/* =====================================
          عنوان
      ===================================== */}

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

      {/* =====================================
          فیلترها
      ===================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
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
              outline: "none",
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

      {/* =====================================
          نتیجه جستجو
      ===================================== */}

      {list.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color:
              "var(--text-mut)",
            fontFamily:
              "Vazirmatn",
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
