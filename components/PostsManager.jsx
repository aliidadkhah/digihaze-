"use client";

import { useEffect, useState } from "react";
import {
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ImageOff,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { uploadProductImage } from "@/lib/productImages";
import RichTextEditor from "./RichTextEditor";

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const EMPTY_FORM = {
  id: null,
  type: "blog", // "blog" | "guide"
  title: "",
  slug: "",
  slugTouched: false,
  excerpt: "",
  content: "",
  coverImage: "",
  category: "",
  tags: "", // رشته‌ی جدا شده با کاما
  author: "دیجی هیز",
  published: true,
  seoTitle: "",
  seoDescription: "",
};

function mapRowToForm(row) {
  return {
    id: row.id,
    type: row.type === "guide" ? "guide" : "blog",
    title: row.title || "",
    slug: row.slug || "",
    slugTouched: true,
    excerpt: row.excerpt || "",
    content: row.content || "",
    coverImage: row.cover_image || "",
    category: row.category || "",
    tags: Array.isArray(row.tags) ? row.tags.join("، ") : "",
    author: row.author || "دیجی هیز",
    published: row.published !== false,
    seoTitle: row.seo_title || "",
    seoDescription: row.seo_description || "",
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

function Field({ label, children, full }) {
  return (
    <div style={full ? { gridColumn: "1 / -1" } : undefined}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const TYPE_LABELS = { blog: "بلاگ", guide: "راهنمای خرید" };

export default function PostsManager() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all" | "blog" | "guide"
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  };

  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/posts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در دریافت پست‌ها");
      setPosts(data.posts || []);
    } catch (e) {
      setError(e.message || "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      type: filterType === "guide" ? "guide" : "blog",
    });
    setSaveError("");
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setForm(mapRowToForm(row));
    setSaveError("");
    setFormOpen(true);
  };

  const closeForm = () => setFormOpen(false);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // عنوان -> اگر کاربر خودش اسلاگ رو دستی تغییر نداده، خودکار از روی عنوان بساز
  const updateTitle = (value) =>
    setForm((f) => ({
      ...f,
      title: value,
      slug: f.slugTouched ? f.slug : slugify(value),
    }));

  const updateSlug = (value) =>
    setForm((f) => ({ ...f, slug: slugify(value), slugTouched: true }));

  const setCoverFile = async (file) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadProductImage(file);
      if (url) update("coverImage", url);
    } catch {
      setSaveError("آپلود عکس کاور ناموفق بود، دوباره امتحان کن");
    } finally {
      setUploadingCover(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setSaveError("عنوان پست الزامی است");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const token = await getToken();

      const payload = {
        ...form,
        slug: slugify(form.slug || form.title),
        tags: form.tags
          .split(/[،,]/)
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const res = await fetch("/api/admin/posts", {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ذخیره ناموفق بود");
      setFormOpen(false);
      fetchPosts();
    } catch (e) {
      setSaveError(e.message || "خطایی رخ داد");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("این پست برای همیشه حذف بشه؟")) return;
    setDeletingId(id);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/posts?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حذف ناموفق بود");
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e.message || "خطایی رخ داد");
    } finally {
      setDeletingId(null);
    }
  };

  const visiblePosts =
    filterType === "all" ? posts : posts.filter((p) => p.type === filterType);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { id: "all", label: "همه" },
            { id: "blog", label: "بلاگ" },
            { id: "guide", label: "راهنمای خرید" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              style={{
                background: filterType === t.id ? "#2F86FF" : "var(--surface2)",
                color: filterType === t.id ? "#fff" : "var(--text-hi)",
                border: "none",
                borderRadius: 10,
                padding: "8px 14px",
                fontFamily: "Vazirmatn",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

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
          <Plus size={15} /> افزودن پست
        </button>
      </div>

      {loading && (
        <p style={{ color: "var(--text-mut)", fontSize: 13.5, fontFamily: "Vazirmatn" }}>
          در حال بارگذاری پست‌ها...
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

      {!loading && !error && visiblePosts.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-mut)" }}>
          <Newspaper size={36} color="var(--text-faint)" style={{ margin: "0 auto 14px" }} />
          <p style={{ fontSize: 14, fontFamily: "Vazirmatn" }}>هنوز هیچ پستی اضافه نشده.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visiblePosts.map((p) => (
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
              {p.cover_image ? (
                <img
                  src={p.cover_image}
                  alt={p.title}
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
                {p.title}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "Vazirmatn",
                    fontWeight: 700,
                    color: p.type === "guide" ? "#FF8A3D" : "#2F86FF",
                  }}
                >
                  {TYPE_LABELS[p.type] || "بلاگ"}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--text-mut)", fontFamily: "Vazirmatn" }}>
                  /{p.slug}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "Vazirmatn",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    color: p.published ? "#22E5C9" : "var(--text-faint)",
                  }}
                >
                  {p.published ? <Eye size={12} /> : <EyeOff size={12} />}
                  {p.published ? "منتشرشده" : "پیش‌نویس"}
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
              {deletingId === p.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
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
              maxWidth: 680,
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
                {form.id ? "ویرایش پست" : "افزودن پست جدید"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-mut)" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* نوع پست */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "blog", label: "بلاگ" },
                { id: "guide", label: "راهنمای خرید" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update("type", t.id)}
                  style={{
                    flex: 1,
                    background: form.type === t.id ? "#2F86FF" : "var(--bg)",
                    color: form.type === t.id ? "#fff" : "var(--text-hi)",
                    border: "1px solid var(--surface2)",
                    borderRadius: 10,
                    padding: "10px 0",
                    fontFamily: "Vazirmatn",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="عنوان *" full>
                <input
                  style={inputStyle}
                  value={form.title}
                  onChange={(e) => updateTitle(e.target.value)}
                />
              </Field>

              <Field label="اسلاگ (نشانی صفحه، انگلیسی)" full>
                <input
                  style={inputStyle}
                  value={form.slug}
                  placeholder="مثلاً: بهترین-پاد-برای-شروع"
                  onChange={(e) => updateSlug(e.target.value)}
                  dir="ltr"
                />
              </Field>

              <Field label="دسته‌بندی">
                <input
                  style={inputStyle}
                  value={form.category}
                  placeholder="مثلاً: آموزش"
                  onChange={(e) => update("category", e.target.value)}
                />
              </Field>

              <Field label="نویسنده">
                <input
                  style={inputStyle}
                  value={form.author}
                  onChange={(e) => update("author", e.target.value)}
                />
              </Field>

              <Field label="برچسب‌ها (با کاما جدا کن)" full>
                <input
                  style={inputStyle}
                  value={form.tags}
                  placeholder="پاد، سالت نیکوتین، راهنما"
                  onChange={(e) => update("tags", e.target.value)}
                />
              </Field>

              <Field label="خلاصه (زیر عنوان و در کارت‌ها نمایش داده می‌شود)" full>
                <textarea
                  style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                  value={form.excerpt}
                  onChange={(e) => update("excerpt", e.target.value)}
                />
              </Field>

              <Field label="عکس کاور" full>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {form.coverImage ? (
                    <img
                      src={form.coverImage}
                      alt=""
                      style={{ width: 70, height: 70, borderRadius: 10, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 10,
                        background: "var(--bg)",
                        border: "1px solid var(--surface2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ImageOff size={18} color="var(--text-faint)" />
                    </div>
                  )}
                  <label
                    style={{
                      background: "var(--surface2)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontFamily: "Vazirmatn",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      color: "var(--text-hi)",
                    }}
                  >
                    {uploadingCover ? "در حال آپلود..." : "انتخاب عکس"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => setCoverFile(e.target.files?.[0])}
                    />
                  </label>
                </div>
              </Field>

              <Field label="محتوای پست" full>
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => update("content", html)}
                  placeholder="متن کامل پست رو اینجا بنویس..."
                />
              </Field>

              <Field label="عنوان سئو (اختیاری)">
                <input
                  style={inputStyle}
                  value={form.seoTitle}
                  onChange={(e) => update("seoTitle", e.target.value)}
                />
              </Field>

              <Field label="توضیحات متا برای سئو (اختیاری)">
                <input
                  style={inputStyle}
                  value={form.seoDescription}
                  onChange={(e) => update("seoDescription", e.target.value)}
                />
              </Field>

              <Field label="وضعیت انتشار" full>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontFamily: "Vazirmatn",
                    fontSize: 13,
                    color: "var(--text-hi)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => update("published", e.target.checked)}
                  />
                  منتشر شود (خاموش = پیش‌نویس، فقط توی پنل ادمین دیده می‌شه)
                </label>
              </Field>
            </div>

            {saveError && (
              <div
                style={{
                  background: "#ff3b3b18",
                  color: "#ff6b6b",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 12.5,
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
                {form.id ? "ذخیره تغییرات" : "افزودن پست"}
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
