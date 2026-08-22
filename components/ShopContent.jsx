"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { Reveal } from "./ui";
import ProductCard from "./ProductCard";
import { CATEGORIES, PRODUCTS, discountedPrice } from "@/lib/data";

export default function ShopContent({ initialCategory, initialSearch }) {
  const [active, setActive] = useState(initialCategory || "all");
  const [sort, setSort] = useState("default");
  const [search, setSearch] = useState(initialSearch || "");

  useEffect(() => setActive(initialCategory || "all"), [initialCategory]);
  useEffect(() => setSearch(initialSearch || ""), [initialSearch]);

  const chips = [{ id: "all", label: "همه", color: "var(--text-hi)" }, ...CATEGORIES];

  const list = useMemo(() => {
    let arr = active === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === active);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    arr = [...arr];
    if (sort === "price-asc") arr.sort((a, b) => discountedPrice(a) - discountedPrice(b));
    if (sort === "price-desc") arr.sort((a, b) => discountedPrice(b) - discountedPrice(a));
    if (sort === "rating") arr.sort((a, b) => b.rating - a.rating);
    return arr;
  }, [active, sort, search]);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 20px 70px" }}>
      <h1 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 28, marginBottom: 6 }}>فروشگاه</h1>
      <p style={{ color: "var(--text-lo)", fontSize: 14, marginBottom: 26 }}>
        {search ? `نتایج جستجو برای «${search}» — ` : ""}
        {list.length} محصول
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 26 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {chips.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              style={{
                border: `1.5px solid ${active === c.id ? c.color : "var(--surface2)"}`,
                background: active === c.id ? `${c.color}22` : "transparent",
                color: active === c.id ? c.color : "var(--text-lo)",
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
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Filter size={15} color="var(--text-lo)" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ background: "var(--surface)", color: "var(--text-hi)", border: "1px solid var(--surface2)", borderRadius: 10, padding: "8px 12px", fontFamily: "Vazirmatn", fontSize: 13 }}
          >
            <option value="default">مرتب‌سازی</option>
            <option value="price-asc">ارزان‌ترین</option>
            <option value="price-desc">گران‌ترین</option>
            <option value="rating">محبوب‌ترین</option>
          </select>
        </div>
      </div>

      {list.length === 0 ? (
        <p style={{ color: "var(--text-mut)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
          محصولی با این مشخصات پیدا نشد.
        </p>
      ) : (
        <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 18 }}>
          {list.map((p, i) => (
            <Reveal key={p.id} delay={0.05 * (i % 4)}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
