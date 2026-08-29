"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Search, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { inputStyle } from "./ui";
import SiteImage from "./SiteImage";
import { useProducts } from "./ProductsProvider";

export default function ProductsManager() {
  const { products, loading, refresh } = useProducts();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [drafts, setDrafts] = useState({}); // { [id]: { name, badge, color, description } }
  const [savingId, setSavingId] = useState(null);
  const [doneId, setDoneId] = useState(null);
  const [errorId, setErrorId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const draftFor = (p) =>
    drafts[p.id] || {
      name: p.name || "",
      badge: p.badge || "",
      color: p.color || "#2F86FF",
      description: p.description || "",
    };

  const setDraftField = (id, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...draftFor(products.find((p) => p.id === id)), ...prev[id], [field]: value },
    }));
  };

  const toggleOpen = (id) => {
    setOpenId((cur) => (cur === id ? null : id));
  };

  const save = async (product) => {
    const draft = draftFor(product);
    setSavingId(product.id);
    setErrorId(null);
    setDoneId(null);

    const { error } = await supabase
      .from("products")
      .update({
        name: draft.name.trim(),
        badge: draft.badge.trim(),
        color: draft.color,
        description: draft.description.trim(),
      })
      .eq("id", product.id);

    setSavingId(null);

    if (error) {
      setErrorId(product.id);
      console.error("Product update error:", error);
      return;
    }

    setDoneId(product.id);
    setTimeout(() => setDoneId(null), 2000);
    refresh();
  };

  if (loading && products.length === 0) {
    return (
      <p style={{ color: "var(--text-mut)" }}>در حال بارگذاری محصولات...</p>
    );
  }

  return (
    <div>
      <p
        style={{
          color: "var(--text-mut)",
          fontSize: 13,
          lineHeight: 1.9,
          background: "var(--surface)",
          border: "1px solid var(--surface2)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 20,
        }}
      >
        روی هر محصول بزن، اسم، برچسب (مثل «پرفروش» یا «تخفیف»)، رنگ و توضیحاتش رو تغییر بده و
        ذخیره کن. برای تغییر عکس محصول از تب «تصاویر سایت» استفاده کن.
      </p>

      <div style={{ position: "relative", marginBottom: 18 }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-mut)",
          }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجوی محصول..."
          style={{ ...inputStyle, paddingRight: 38, width: "100%", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((product) => {
          const isOpen = openId === product.id;
          const draft = draftFor(product);
          const busy = savingId === product.id;
          const done = doneId === product.id;
          const failed = errorId === product.id;

          return (
            <div
              key={product.id}
              style={{
                background: "var(--surface)",
                border: `1px solid ${failed ? "#E53935" : "var(--surface2)"}`,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => toggleOpen(product.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "right",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "var(--bg)",
                  }}
                >
                  <SiteImage
                    src={product.images?.[0]}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: "var(--text-hi)",
                      fontWeight: 700,
                      fontSize: 13.5,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {product.name}
                  </div>
                  <div style={{ color: "var(--text-mut)", fontSize: 11.5 }}>
                    {product.badge || "بدون برچسب"}
                  </div>
                </div>

                {done && <Check size={18} color="#22E5C9" />}

                <ChevronDown
                  size={18}
                  color="var(--text-mut)"
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "none",
                    transition: "transform .15s",
                    flexShrink: 0,
                  }}
                />
              </button>

              {isOpen && (
                <div
                  style={{
                    padding: "0 14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <label style={fieldLabelStyle}>
                    اسم محصول
                    <input
                      value={draft.name}
                      onChange={(e) => setDraftField(product.id, "name", e.target.value)}
                      style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                    />
                  </label>

                  <label style={fieldLabelStyle}>
                    برچسب (تگ) — مثلا پرفروش، جدید، تخفیف ویژه
                    <input
                      value={draft.badge}
                      onChange={(e) => setDraftField(product.id, "badge", e.target.value)}
                      placeholder="خالی بذار تا برچسبی نمایش داده نشه"
                      style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                    />
                  </label>

                  <label style={fieldLabelStyle}>
                    رنگ محصول
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="color"
                        value={draft.color}
                        onChange={(e) => setDraftField(product.id, "color", e.target.value)}
                        style={{
                          width: 42,
                          height: 42,
                          padding: 0,
                          border: "1px solid var(--surface2)",
                          borderRadius: 10,
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      />
                      <input
                        value={draft.color}
                        onChange={(e) => setDraftField(product.id, "color", e.target.value)}
                        dir="ltr"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                    </div>
                  </label>

                  <label style={fieldLabelStyle}>
                    توضیحات
                    <textarea
                      value={draft.description}
                      onChange={(e) => setDraftField(product.id, "description", e.target.value)}
                      rows={3}
                      style={{
                        ...inputStyle,
                        width: "100%",
                        boxSizing: "border-box",
                        resize: "vertical",
                        fontFamily: "Vazirmatn",
                      }}
                    />
                  </label>

                  {failed && (
                    <div style={{ color: "#E53935", fontSize: 12 }}>
                      ذخیره ناموفق بود، دوباره امتحان کن
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => save(product)}
                    disabled={busy}
                    style={{
                      alignSelf: "flex-start",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#2F86FF",
                      color: "var(--ink)",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 20px",
                      fontFamily: "Vazirmatn",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    {busy && <Loader2 size={15} className="spin" />}
                    {busy ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p style={{ color: "var(--text-mut)", fontSize: 13 }}>محصولی پیدا نشد.</p>
        )}
      </div>

      <style jsx>{`
        .spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

const fieldLabelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  color: "var(--text-mut)",
  fontSize: 12,
  fontWeight: 700,
};
