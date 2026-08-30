"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  X,
  UploadCloud,
  Loader2,
  ImageOff,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { uploadProductImage } from "@/lib/productImages";
import { money } from "@/lib/data";

const DEFAULT_SPEC_LABELS = [
  "نوع دستگاه",
  "برند",
  "ابعاد",
  "توان خروجی",
  "باتری",
  "نمایشگر",
  "ظرفیت تانک",
  "روش شارژ",
  "کویل",
  "نوع کارتریج",
  "ضدآب",
  "ضدضربه",
  "رنگ",
];

const EMPTY_FORM = {
  id: null,
  name: "",
  category: "",
  brand: "",
  price: "",
  discount: "",
  rating: "",
  reviewsCount: "",
  color: "",
  badge: "",
  available: true,
  description: "",
  images: [],
  colors: [], // [{ name, hex }]
  specs: DEFAULT_SPEC_LABELS.map((label) => ({ label, value: "" })),
  brandDescription: "",
  brandImage: "",
  qa: [], // [{ question, answer }]
};

function mapRowToForm(row) {
  const existingSpecs = (row.specs || []).map((s) => ({
    label: s.label || s.k || "",
    value: s.value || s.v || "",
  }));
  const existingLabels = existingSpecs.map((s) => s.label);
  const missingPresets = DEFAULT_SPEC_LABELS.filter(
    (label) => !existingLabels.includes(label)
  ).map((label) => ({ label, value: "" }));

  return {
    id: row.id,
    name: row.name || "",
    category: row.category || "",
    brand: row.brand || "",
    price: row.price ?? "",
    discount: row.discount ?? "",
    rating: row.rating ?? "",
    reviewsCount: row.reviews_count ?? row.reviewsCount ?? "",
    color: row.color || "",
    badge: row.badge || "",
    available: row.available !== false,
    description: row.description || "",
    images: row.images || [],
    colors: row.colors || [],
    specs: [...existingSpecs, ...missingPresets],
    brandDescription: row.brand_description || row.brandDescription || "",
    brandImage: row.brand_image || row.brandImage || "",
    qa: row.qa || [],
  };
}

const inputStyle = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--surface2)",
  borderRadius: 10,
  padding: "10px 12px",
  fontFamily: "Vazirmatn",
  fontSize: 13.5,
  color: "var(--text-hi)",
  outline: "none",
};

const labelStyle = {
  display: "block",
  fontFamily: "Vazirmatn",
  fontSize: 12.5,
  fontWeight: 700,
  color: "var(--text-mut)",
  marginBottom: 6,
};

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function ProductsManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در دریافت محصولات");
      setProducts(data.products || []);
    } catch (e) {
      setError(e.message || "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSaveError("");
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setForm(mapRowToForm(row));
    setSaveError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
  };

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // ---------- تصاویر ----------
  const addImageFile = async (file) => {
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await uploadProductImage(file);
      if (url) update("images", [...form.images, url]);
    } catch {
      setSaveError("آپلود عکس ناموفق بود، دوباره امتحان کن");
    } finally {
      setUploadingImg(false);
    }
  };

  const removeImage = (idx) =>
    update(
      "images",
      form.images.filter((_, i) => i !== idx)
    );

  // ---------- رنگ‌ها ----------
  const addColor = () =>
    update("colors", [...form.colors, { name: "", hex: "#000000" }]);

  const updateColor = (idx, key, value) =>
    update(
      "colors",
      form.colors.map((c, i) => (i === idx ? { ...c, [key]: value } : c))
    );

  const removeColor = (idx) =>
    update(
      "colors",
      form.colors.filter((_, i) => i !== idx)
    );

  // ---------- مشخصات فنی ----------
  const addSpec = () =>
    update("specs", [...form.specs, { label: "", value: "" }]);

  const updateSpec = (idx, key, value) =>
    update(
      "specs",
      form.specs.map((s, i) => (i === idx ? { ...s, [key]: value } : s))
    );

  const removeSpec = (idx) =>
    update(
      "specs",
      form.specs.filter((_, i) => i !== idx)
    );

  // ---------- عکس برند ----------
  const [uploadingBrandImg, setUploadingBrandImg] = useState(false);

  const setBrandImageFile = async (file) => {
    if (!file) return;
    setUploadingBrandImg(true);
    try {
      const url = await uploadProductImage(file);
      if (url) update("brandImage", url);
    } catch {
      setSaveError("آپلود عکس برند ناموفق بود، دوباره امتحان کن");
    } finally {
      setUploadingBrandImg(false);
    }
  };

  // ---------- سوال و جواب ----------
  const addQa = () =>
    update("qa", [...form.qa, { question: "", answer: "" }]);

  const updateQa = (idx, key, value) =>
    update(
      "qa",
      form.qa.map((q, i) => (i === idx ? { ...q, [key]: value } : q))
    );

  const removeQa = (idx) =>
    update(
      "qa",
      form.qa.filter((_, i) => i !== idx)
    );

  // ---------- ذخیره ----------
  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setSaveError("نام محصول الزامی است");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/products", {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ذخیره ناموفق بود");
      setFormOpen(false);
      fetchProducts();
    } catch (e) {
      setSaveError(e.message || "خطایی رخ داد");
    } finally {
      setSaving(false);
    }
  };

  // ---------- حذف ----------
  const remove = async (id) => {
    if (!confirm("این محصول برای همیشه حذف بشه؟")) return;
    setDeletingId(id);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حذف ناموفق بود");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e.message || "خطایی رخ داد");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <p style={{ color: "var(--text-mut)", fontSize: 13, fontFamily: "Vazirmatn" }}>
          {products.length} محصول
        </p>

        <button
          onClick={openCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#2F86FF",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            fontFamily: "Vazirmatn",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <Plus size={15} /> افزودن محصول
        </button>
      </div>

      {loading && (
        <p style={{ color: "var(--text-mut)", fontSize: 13.5, fontFamily: "Vazirmatn" }}>
          در حال بارگذاری محصولات...
        </p>
      )}

      {!loading && error && (
        <div
          style={{
            background: "#ff3b3b18",
            color: "#ff6b6b",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 13,
            marginBottom: 16,
            fontFamily: "Vazirmatn",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-mut)" }}>
          <Package size={36} color="var(--text-faint)" style={{ margin: "0 auto 14px" }} />
          <p style={{ fontSize: 14, fontFamily: "Vazirmatn" }}>هنوز هیچ محصولی اضافه نشده.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {products.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "var(--surface)",
              border: "1px solid var(--surface2)",
              borderRadius: 14,
              padding: 12,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 10,
                overflow: "hidden",
                flexShrink: 0,
                background: "var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {p.images?.[0] ? (
                <img
                  src={p.images[0]}
                  alt={p.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <ImageOff size={18} color="var(--text-faint)" />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "Vazirmatn",
                  fontWeight: 800,
                  fontSize: 13.5,
                  color: "var(--text-hi)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.name}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11.5, color: "var(--text-mut)", fontFamily: "Vazirmatn" }}>
                  {p.category || "بدون دسته"}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--text-mut)", fontFamily: "Vazirmatn" }}>
                  {money(p.price || 0)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "Vazirmatn",
                    fontWeight: 700,
                    color: p.available ? "#22E5C9" : "#ff6b6b",
                  }}
                >
                  {p.available ? "موجود" : "ناموجود"}
                </span>
              </div>
            </div>

            <button
              onClick={() => openEdit(p)}
              style={{
                background: "var(--surface2)",
                border: "none",
                borderRadius: 10,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-hi)",
              }}
              aria-label="ویرایش"
            >
              <Pencil size={15} />
            </button>

            <button
              onClick={() => remove(p.id)}
              disabled={deletingId === p.id}
              style={{
                background: "#ff3b3b18",
                border: "none",
                borderRadius: 10,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#ff6b6b",
                opacity: deletingId === p.id ? 0.5 : 1,
              }}
              aria-label="حذف"
            >
              {deletingId === p.id ? (
                <Loader2 size={15} className="spin" />
              ) : (
                <Trash2 size={15} />
              )}
            </button>
          </div>
        ))}
      </div>

      {formOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "40px 16px",
            overflowY: "auto",
            zIndex: 100,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <form
            onSubmit={save}
            style={{
              width: "100%",
              maxWidth: 640,
              background: "var(--surface)",
              border: "1px solid var(--surface2)",
              borderRadius: 18,
              padding: 22,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 17, color: "var(--text-hi)" }}>
                {form.id ? "ویرایش محصول" : "افزودن محصول جدید"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-mut)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="نام محصول *">
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </Field>
              <Field label="دسته‌بندی">
                <input
                  style={inputStyle}
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                />
              </Field>
              <Field label="برند">
                <input
                  style={inputStyle}
                  value={form.brand}
                  onChange={(e) => update("brand", e.target.value)}
                />
              </Field>
              <Field label="برچسب (مثلا: پرفروش)">
                <input
                  style={inputStyle}
                  value={form.badge}
                  onChange={(e) => update("badge", e.target.value)}
                />
              </Field>
              <Field label="قیمت (تومان)">
                <input
                  type="number"
                  style={inputStyle}
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                />
              </Field>
              <Field label="درصد تخفیف">
                <input
                  type="number"
                  style={inputStyle}
                  value={form.discount}
                  onChange={(e) => update("discount", e.target.value)}
                />
              </Field>
              <Field label="امتیاز (از ۵)">
                <input
                  type="number"
                  step="0.1"
                  style={inputStyle}
                  value={form.rating}
                  onChange={(e) => update("rating", e.target.value)}
                />
              </Field>
              <Field label="تعداد نظرات">
                <input
                  type="number"
                  style={inputStyle}
                  value={form.reviewsCount}
                  onChange={(e) => update("reviewsCount", e.target.value)}
                />
              </Field>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "Vazirmatn",
                fontSize: 13,
                color: "var(--text-hi)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => update("available", e.target.checked)}
              />
              موجود در انبار
            </label>

            <Field label="توضیحات محصول">
              <textarea
                style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </Field>

            {/* تصاویر */}
            <div>
              <label style={labelStyle}>تصاویر محصول</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {form.images.map((url, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: "relative",
                      width: 64,
                      height: 64,
                      borderRadius: 10,
                      overflow: "hidden",
                      border: "1px solid var(--surface2)",
                    }}
                  >
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      style={{
                        position: "absolute",
                        top: 2,
                        left: 2,
                        background: "rgba(0,0,0,0.6)",
                        border: "none",
                        borderRadius: 6,
                        width: 18,
                        height: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#fff",
                      }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}

                <label
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 10,
                    border: "1px dashed var(--surface2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--text-mut)",
                  }}
                >
                  {uploadingImg ? (
                    <Loader2 size={18} className="spin" />
                  ) : (
                    <UploadCloud size={18} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => addImageFile(e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            {/* رنگ‌ها */}
            <div>
              <label style={labelStyle}>رنگ‌های موجود</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {form.colors.map((c, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="نام رنگ"
                      value={c.name}
                      onChange={(e) => updateColor(idx, "name", e.target.value)}
                    />
                    <input
                      type="color"
                      value={c.hex || "#000000"}
                      onChange={(e) => updateColor(idx, "hex", e.target.value)}
                      style={{ width: 40, height: 38, border: "none", borderRadius: 8, background: "none", cursor: "pointer" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeColor(idx)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-mut)" }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addColor}
                  style={{
                    alignSelf: "flex-start",
                    background: "var(--surface2)",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontFamily: "Vazirmatn",
                    fontSize: 12,
                    color: "var(--text-hi)",
                    cursor: "pointer",
                  }}
                >
                  + افزودن رنگ
                </button>
              </div>
            </div>

            {/* مشخصات فنی */}
            <div>
              <label style={labelStyle}>مشخصات فنی</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {form.specs.map((s, idx) => {
                  const isPreset = DEFAULT_SPEC_LABELS.includes(s.label);
                  return (
                    <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {isPreset ? (
                        <div
                          style={{
                            ...inputStyle,
                            flex: 1,
                            background: "var(--surface2)",
                            color: "var(--text-mut)",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {s.label}
                        </div>
                      ) : (
                        <input
                          style={{ ...inputStyle, flex: 1 }}
                          placeholder="عنوان (مثلا: حجم مخزن)"
                          value={s.label}
                          onChange={(e) => updateSpec(idx, "label", e.target.value)}
                        />
                      )}
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="مقدار"
                        value={s.value}
                        onChange={(e) => updateSpec(idx, "value", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeSpec(idx)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-mut)" }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addSpec}
                  style={{
                    alignSelf: "flex-start",
                    background: "var(--surface2)",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontFamily: "Vazirmatn",
                    fontSize: 12,
                    color: "var(--text-hi)",
                    cursor: "pointer",
                  }}
                >
                  + افزودن مشخصه دلخواه
                </button>
              </div>
            </div>

            {/* درباره برند */}
            <div>
              <label style={labelStyle}>درباره برند</label>
              <textarea
                style={{ ...inputStyle, minHeight: 90, resize: "vertical", marginBottom: 10 }}
                placeholder="متنی درباره برند این محصول بنویس..."
                value={form.brandDescription}
                onChange={(e) => update("brandDescription", e.target.value)}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {form.brandImage ? (
                  <div
                    style={{
                      position: "relative",
                      width: 64,
                      height: 64,
                      borderRadius: 10,
                      overflow: "hidden",
                      border: "1px solid var(--surface2)",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={form.brandImage}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => update("brandImage", "")}
                      style={{
                        position: "absolute",
                        top: 2,
                        left: 2,
                        background: "rgba(0,0,0,0.6)",
                        border: "none",
                        borderRadius: 6,
                        width: 18,
                        height: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#fff",
                      }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 10,
                      border: "1px dashed var(--surface2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "var(--text-mut)",
                      flexShrink: 0,
                    }}
                  >
                    {uploadingBrandImg ? (
                      <Loader2 size={18} className="spin" />
                    ) : (
                      <UploadCloud size={18} />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => setBrandImageFile(e.target.files?.[0])}
                    />
                  </label>
                )}
                <span style={{ fontSize: 12, color: "var(--text-mut)", fontFamily: "Vazirmatn" }}>
                  عکسی که در تب «درباره برند» نمایش داده می‌شود
                </span>
              </div>
            </div>

            {/* سوال و جواب */}
            <div>
              <label style={labelStyle}>سوال و جواب</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {form.qa.map((q, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      background: "var(--bg)",
                      border: "1px solid var(--surface2)",
                      borderRadius: 10,
                      padding: 10,
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="سوال"
                        value={q.question}
                        onChange={(e) => updateQa(idx, "question", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeQa(idx)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-mut)" }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <textarea
                      style={{ ...inputStyle, minHeight: 56, resize: "vertical" }}
                      placeholder="پاسخ"
                      value={q.answer}
                      onChange={(e) => updateQa(idx, "answer", e.target.value)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addQa}
                  style={{
                    alignSelf: "flex-start",
                    background: "var(--surface2)",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontFamily: "Vazirmatn",
                    fontSize: 12,
                    color: "var(--text-hi)",
                    cursor: "pointer",
                  }}
                >
                  + افزودن سوال و جواب
                </button>
              </div>
            </div>

            {saveError && (
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
                {saveError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={closeForm}
                style={{
                  background: "var(--surface2)",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 20px",
                  fontFamily: "Vazirmatn",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--text-hi)",
                  cursor: "pointer",
                }}
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: "#2F86FF",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 24px",
                  fontFamily: "Vazirmatn",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#fff",
                  cursor: saving ? "default" : "pointer",
                  opacity: saving ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {saving && <Loader2 size={14} className="spin" />}
                {form.id ? "ذخیره تغییرات" : "افزودن محصول"}
              </button>
            </div>
          </form>
        </div>
      )}

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
