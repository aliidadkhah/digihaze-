"use client";

import { useEffect, useState } from "react";
import { ListTree, Loader2, Check, Plus, X, UploadCloud } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { IMAGES_BUCKET } from "@/lib/images";
import { CATEGORIES, applySubcategoryOverrides } from "@/lib/data";
import SiteImage from "./SiteImage";

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
  const [logoBusyKey, setLogoBusyKey] = useState(null); // "catId:subId"
  const [logoBump, setLogoBump] = useState(0);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  };

  // لوگوی برند رو توی همون باکت عکس‌های سایت آپلود می‌کنه و آدرسش رو
  // روی همون زیردسته ذخیره می‌کنه (بعد از «ذخیره دسته‌بندی‌ها» ثابت می‌مونه)
  const uploadLogo = async (catId, subId, file) => {
    if (!file) return;
    const key = `${catId}:${subId}`;
    setLogoBusyKey(key);
    setError("");

    const filename = `brand-logos/${catId}-${subId}`;
    const { error: uploadError } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(filename, file, {
        upsert: true,
        cacheControl: "60",
        contentType: file.type || "image/png",
      });

    setLogoBusyKey(null);
    if (uploadError) {
      setError("آپلود لوگو ناموفق بود");
      console.error("Logo upload error:", uploadError);
      return;
    }

    const { data } = supabase.storage
      .from(IMAGES_BUCKET)
      .getPublicUrl(filename);

    // برای اینکه کش مرورگر عکس قدیمی رو نشون نده
    const logoUrl = `${data.publicUrl}?v=${Date.now()}`;

    setCategories((prev) =>
      prev.map((c) =>
        c.id !== catId
          ? c
          : {
              ...c,
              subcategories: c.subcategories.map((s) =>
                s.id === subId ? { ...s, logo: logoUrl } : s
              ),
            }
      )
    );
    setLogoBump((b) => b + 1);
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
          subcategories: [
            ...c.subcategories,
            { id, label, nameFa: "", logo: null },
          ],
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

  const renameSubFa = (catId, subId, nameFa) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id !== catId
          ? c
          : {
              ...c,
              subcategories: c.subcategories.map((s) =>
                s.id === subId ? { ...s, nameFa } : s
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
          nameFa: (s.nameFa || "").trim(),
          logo: s.logo || null,
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
        <ListTree size={18} color="#4F7FFF" />
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
        فیلد «نام برند (لاتین)» باید دقیقاً با مقدار «برند» که موقع افزودن
        محصول ثبت می‌کنی یکی باشه (فرقی نمی‌کنه بزرگ یا کوچیک باشه)، وگرنه
        فیلترش محصولی رو نشون نمی‌ده. «نام فارسی» و لوگو فقط برای نمایش به
        مشتری هستن و روی فیلتر تاثیری ندارن.
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

            {cat.subcategories.map((s) => {
              const logoKey = `${cat.id}:${s.id}`;
              const logoInputId = `logo-upload-${logoKey}`;
              const logoBusy = logoBusyKey === logoKey;

              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {/* لوگو */}
                  <label
                    htmlFor={logoInputId}
                    title="آپلود لوگو"
                    style={{
                      position: "relative",
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      overflow: "hidden",
                      background: "var(--bg)",
                      border: "1px solid var(--surface2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    {s.logo ? (
                      <SiteImage
                        key={s.logo + logoBump}
                        src={s.logo}
                        alt={s.label}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <UploadCloud
                        size={14}
                        color="var(--text-mut)"
                      />
                    )}

                    {logoBusy && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(0,0,0,0.5)",
                        }}
                      >
                        <Loader2
                          size={14}
                          color="#fff"
                          className="spin"
                        />
                      </div>
                    )}

                    <input
                      id={logoInputId}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) =>
                        uploadLogo(
                          cat.id,
                          s.id,
                          e.target.files?.[0]
                        )
                      }
                    />
                  </label>

                  {/* نام فارسی */}
                  <input
                    style={inputStyle}
                    placeholder="نام فارسی (مثلا: نستی)"
                    value={s.nameFa || ""}
                    onChange={(e) =>
                      renameSubFa(cat.id, s.id, e.target.value)
                    }
                  />

                  {/* نام لاتین / برند */}
                  <input
                    style={inputStyle}
                    placeholder="نام برند لاتین (مثلا: Nasty)"
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
              );
            })}
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
                background: "#4F7FFF18",
                border: "none",
                borderRadius: 10,
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#4F7FFF",
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
          background: saved ? "#9B5CFF" : "#4F7FFF",
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
