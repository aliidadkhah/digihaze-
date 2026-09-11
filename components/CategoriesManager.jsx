"use client";

import { useEffect, useState } from "react";
import { ListTree, Loader2, Check, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES, applySubcategoryOverrides } from "@/lib/data";

function slugify(label, existingIds) {
  let base = String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!base) base = "sub";

  let id = base;
  let i = 2;
  while (existingIds.includes(id)) {
    id = `${base}-${i}`;
    i += 1;
  }
  return id;
}

const inputStyle = {
  flex: 1,
  background: "var(--bg)",
  border: "1px solid var(--surface2)",
  borderRadius: 10,
  padding: "9px 12px",
  fontFamily: "Vazirmatn",
  fontSize: 13,
  color: "var(--text-hi)",
  outline: "none",
  boxSizing: "border-box",
};

export default function CategoriesManager() {
  const [categories, setCategories] = useState(
    CATEGORIES.map((c) => ({ ...c }))
  );
  const [drafts, setDrafts] = useState({}); // { [catId]: "متن ورودی جدید" }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        const merged = applySubcategoryOverrides(
          data.categories_subcategories
        );
        setCategories(merged.map((c) => ({ ...c })));
      })
      .catch(() => setError("خطا در دریافت دسته‌بندی‌ها"))
      .finally(() => setLoading(false));
  }, []);

  const addSub = (catId) => {
    const label = (drafts[catId] || "").trim();
    if (!label) return;

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== catId) return c;
        const existingIds = c.subcategories.map((s) => s.id);
        const id = slugify(label, existingIds);
        return {
          ...c,
          subcategories: [...c.subcategories, { id, label }],
        };
      })
    );
    setDrafts((prev) => ({ ...prev, [catId]: "" }));
  };

  const removeSub = (catId, subId) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id !== catId
          ? c
          : {
              ...c,
              subcategories: c.subcategories.filter(
                (s) => s.id !== subId
              ),
            }
      )
    );
  };

  const renameSub = (catId, subId, label) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id !== catId
          ? c
          : {
              ...c,
              subcategories: c.subcategories.map((s) =>
                s.id === subId ? { ...s, label } : s
              ),
            }
      )
    );
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const token = await getToken();
      const payload = {};
      categories.forEach((c) => {
        payload[c.id] = c.subcategories.map((s) => ({
          id: s.id,
          label: s.label.trim(),
        }));
      });

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categories_subcategories: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ذخیره ناموفق بود");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message || "خطایی رخ داد");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p
        style={{
          color: "var(--text-mut)",
          fontSize: 13.5,
          fontFamily: "Vazirmatn",
        }}
      >
        در حال بارگذاری دسته‌بندی‌ها...
      </p>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 640,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <ListTree size={18} color="#2F86FF" />
        <span
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          زیردسته‌ها (فیلتر بر اساس برند)
        </span>
      </div>

      <p
        style={{
          color: "var(--text-mut)",
          fontSize: 12.5,
          fontFamily: "Vazirmatn",
          margin: 0,
        }}
      >
        هر زیردسته باید دقیقاً با مقدار «برند» که موقع افزودن محصول ثبت
        می‌کنی یکی باشه (فرقی نمی‌کنه بزرگ یا کوچیک باشه)، وگرنه فیلترش
        محصولی رو نشون نمی‌ده.
      </p>

      {categories.map((cat) => (
        <div
          key={cat.id}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--surface2)",
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: cat.color,
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontFamily: "Vazirmatn",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {cat.label}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {cat.subcategories.length === 0 && (
              <p
                style={{
                  color: "var(--text-faint)",
                  fontSize: 12.5,
                  fontFamily: "Vazirmatn",
                  margin: 0,
                }}
              >
                هنوز زیردسته‌ای اضافه نشده.
              </p>
            )}

            {cat.subcategories.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <input
                  style={inputStyle}
                  value={s.label}
                  onChange={(e) =>
                    renameSub(cat.id, s.id, e.target.value)
                  }
                />
                <button
                  type="button"
                  onClick={() => removeSub(cat.id, s.id)}
                  style={{
                    background: "var(--surface2)",
                    border: "none",
                    borderRadius: 10,
                    width: 34,
                    height: 34,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#ff6b6b",
                    flexShrink: 0,
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              style={inputStyle}
              placeholder="مثلا: Vaporesso"
              value={drafts[cat.id] || ""}
              onChange={(e) =>
                setDrafts((prev) => ({
                  ...prev,
                  [cat.id]: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSub(cat.id);
                }
              }}
            />
            <button
              type="button"
              onClick={() => addSub(cat.id)}
              style={{
                background: "#2F86FF18",
                border: "none",
                borderRadius: 10,
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#2F86FF",
                flexShrink: 0,
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      ))}

      {error && (
        <div
          style={{
            background: "#ff3b3b18",
            color: "#ff6b6b",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            fontFamily: "Vazirmatn",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        style={{
          alignSelf: "flex-start",
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: saved ? "#22E5C9" : "#2F86FF",
          border: "none",
          borderRadius: 10,
          padding: "10px 20px",
          fontFamily: "Vazirmatn",
          fontWeight: 700,
          fontSize: 13,
          color: "var(--ink)",
          cursor: saving ? "default" : "pointer",
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? (
          <Loader2 size={14} className="spin" />
        ) : saved ? (
          <Check size={14} />
        ) : null}
        {saved ? "ذخیره شد" : "ذخیره دسته‌بندی‌ها"}
      </button>

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
