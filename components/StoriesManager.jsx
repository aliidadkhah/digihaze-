"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Pencil,
  Eye,
  EyeOff,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  PRODUCT_IMAGES_BUCKET,
  uploadProductImage,
  deleteProductImage,
} from "@/lib/productImages";

const MAX_VIDEO_MB = 40;
const WARN_VIDEO_MB = 8;

const card = {
  background: "var(--surface)",
  border: "1px solid var(--surface2)",
  borderRadius: 14,
  padding: 16,
};

const inputStyle = {
  background: "var(--surface2)",
  border: "1px solid var(--surface2)",
  borderRadius: 10,
  padding: "10px 12px",
  color: "var(--text-hi)",
  fontFamily: "var(--font-primary)",
  fontSize: 13.5,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const btn = (bg = "var(--surface2)", color = "var(--text-hi)") => ({
  background: bg,
  color,
  border: "none",
  borderRadius: 10,
  padding: "9px 14px",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
  fontFamily: "var(--font-primary)",
  fontWeight: 700,
  fontSize: 13,
});

const iconBtn = (disabled) => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  border: "none",
  background: "var(--surface2)",
  color: "var(--text-hi)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: disabled ? "default" : "pointer",
  opacity: disabled ? 0.35 : 1,
});

const emptyForm = { id: null, title: "", cover_url: "", items: [], active: true };

async function uploadVideo(file) {
  const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
  const filename = `stories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filename, file, {
      cacheControl: "31536000",
      contentType: file.type || "video/mp4",
    });

  if (error) throw error;

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filename);
  return data?.publicUrl || null;
}

export default function StoriesManager() {
  const [groups, setGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const [form, setForm] = useState(null); // null = بسته
  const [original, setOriginal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");

  const sessionUploads = useRef([]);
  const removedUrls = useRef([]);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  };

  const api = async (method, body, query = "") => {
    const token = await getToken();
    const res = await fetch(`/api/admin/stories${query}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "خطایی رخ داد");
    return json;
  };

  const fail = (e) => {
    const msg = e?.message || "خطایی رخ داد";
    setError(
      msg.includes("story_groups")
        ? "جدول استوری‌ها هنوز در Supabase ساخته نشده؛ SQL راهنما را در SQL Editor اجرا کن."
        : msg
    );
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const json = await api("GET");
      setGroups(json.groups || []);

      const token = await getToken();
      const res = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const pj = await res.json();
      if (res.ok) setProducts(pj.products || []);
    } catch (e) {
      fail(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (text) => {
    setNote(text);
    setTimeout(() => setNote(""), 2500);
  };

  // ---------------- فرم ----------------
  const openNew = () => {
    sessionUploads.current = [];
    removedUrls.current = [];
    setOriginal(null);
    setForm({ ...emptyForm });
    setError("");
  };

  const openEdit = (g) => {
    sessionUploads.current = [];
    removedUrls.current = [];
    const f = {
      id: g.id,
      title: g.title || "",
      cover_url: g.cover_url || "",
      items: (g.items || []).map((it) => ({ url: it.url, link: it.link || "" })),
      active: g.active !== false,
    };
    setOriginal(f);
    setForm(f);
    setError("");
  };

  const closeForm = async (discard) => {
    if (discard) {
      // فایل‌هایی که توی همین ویرایش آپلود شدن ولی ذخیره نشدن رو پاک کن
      await Promise.all(sessionUploads.current.map((u) => deleteProductImage(u)));
    }
    sessionUploads.current = [];
    removedUrls.current = [];
    setForm(null);
    setOriginal(null);
  };

  const setItem = (idx, patch) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));

  const moveItem = (idx, dir) =>
    setForm((f) => {
      const items = [...f.items];
      const j = idx + dir;
      if (j < 0 || j >= items.length) return f;
      [items[idx], items[j]] = [items[j], items[idx]];
      return { ...f, items };
    });

  const removeItem = (idx) => {
    const url = form.items[idx]?.url;
    if (url) removedUrls.current.push(url);
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const onCover = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("فایل کاور باید عکس باشد");

    setUploading("cover");
    setError("");
    try {
      const url = await uploadProductImage(file);
      sessionUploads.current.push(url);
      if (form.cover_url) removedUrls.current.push(form.cover_url);
      setForm((f) => ({ ...f, cover_url: url }));
    } catch (err) {
      fail(err);
    } finally {
      setUploading("");
    }
  };

  const onVideo = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    setError("");
    for (const file of files) {
      if (!file.type.startsWith("video/")) {
        setError("فقط فایل ویدیو (MP4) قابل آپلود است");
        continue;
      }
      const mb = file.size / 1024 / 1024;
      if (mb > MAX_VIDEO_MB) {
        setError(`حجم «${file.name}» ${mb.toFixed(1)} مگابایت است؛ حداکثر ${MAX_VIDEO_MB} مگابایت. اول فشرده‌اش کن.`);
        continue;
      }

      setUploading(file.name);
      try {
        const url = await uploadVideo(file);
        sessionUploads.current.push(url);
        setForm((f) => ({ ...f, items: [...f.items, { url, link: "" }] }));
        if (mb > WARN_VIDEO_MB) {
          flash(`حجم این ویدیو ${mb.toFixed(1)} مگابایت است؛ برای سرعت بهتر زیر ${WARN_VIDEO_MB} مگابایت نگهش دار.`);
        }
      } catch (err) {
        setError(
          (err?.message || "").toLowerCase().includes("mime")
            ? "باکت product-images اجازه‌ی آپلود ویدیو را نمی‌دهد (Allowed MIME types). در تنظیمات باکت، video/mp4 را اضافه کن یا محدودیت را بردار."
            : err?.message || "آپلود ویدیو ناموفق بود"
        );
      }
    }
    setUploading("");
  };

  const save = async () => {
    if (!form.title.trim()) return setError("عنوان گروه را وارد کن");
    if (form.items.length === 0) return setError("حداقل یک ویدیو اضافه کن");

    setBusy(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        cover_url: form.cover_url,
        items: form.items,
        active: form.active,
      };

      if (form.id) await api("PATCH", { id: form.id, ...payload });
      else await api("POST", payload);

      // فایل‌های حذف‌شده از فرم رو از Storage هم پاک کن
      await Promise.all(removedUrls.current.map((u) => deleteProductImage(u)));
      sessionUploads.current = [];
      removedUrls.current = [];

      setForm(null);
      setOriginal(null);
      flash("ذخیره شد");
      await load();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  // ---------------- لیست ----------------
  const toggleActive = async (g) => {
    try {
      await api("PATCH", { id: g.id, active: !g.active });
      setGroups((prev) => prev.map((x) => (x.id === g.id ? { ...x, active: !g.active } : x)));
    } catch (e) {
      fail(e);
    }
  };

  const moveGroup = async (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= groups.length) return;

    const next = [...groups];
    [next[idx], next[j]] = [next[j], next[idx]];
    setGroups(next);

    try {
      await Promise.all(
        next.map((g, i) =>
          g.sort_order === i ? null : api("PATCH", { id: g.id, sort_order: i })
        )
      );
      setGroups(next.map((g, i) => ({ ...g, sort_order: i })));
    } catch (e) {
      fail(e);
      load();
    }
  };

  const removeGroup = async (g) => {
    if (!confirm(`گروه «${g.title}» و همه‌ی ویدیوهاش حذف بشه؟`)) return;
    try {
      await api("DELETE", null, `?id=${encodeURIComponent(g.id)}`);
      await Promise.all([
        deleteProductImage(g.cover_url),
        ...(g.items || []).map((it) => deleteProductImage(it.url)),
      ]);
      setGroups((prev) => prev.filter((x) => x.id !== g.id));
      flash("حذف شد");
    } catch (e) {
      fail(e);
    }
  };

  const productLink = (p) => `/product/${p.category}/${p.slug || p.id}`;

  return (
    <div style={{ fontFamily: "var(--font-primary)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <p style={{ color: "var(--text-mut)", fontSize: 12.5, margin: 0, lineHeight: 1.9 }}>
          هر گروه یک دایره توی صفحه‌ی اصلیه و چند ویدیوی کوتاه (عمودی، ۸ تا ۱۵ ثانیه) داخلش پخش می‌شه.
        </p>
        {!form && (
          <button onClick={openNew} style={btn("#9B5CFF", "#fff")}>
            <Plus size={15} /> گروه جدید
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: "#ff9b9b", background: "#ff6b6b22", borderRadius: 10, padding: "9px 12px", fontSize: 13, marginBottom: 12, lineHeight: 1.8 }}>
          {error}
        </div>
      )}
      {note && (
        <div style={{ color: "#7ff5e2", background: "#22E5C922", borderRadius: 10, padding: "9px 12px", fontSize: 13, marginBottom: 12 }}>
          {note}
        </div>
      )}

      {/* ---------------- فرم ---------------- */}
      {form && (
        <div style={{ ...card, marginBottom: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5 }}>
            {form.id ? "ویرایش گروه" : "گروه جدید"}
          </div>

          <input
            placeholder="عنوان گروه (مثلاً معرفی پاد جدید)"
            value={form.title}
            maxLength={40}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={inputStyle}
          />

          {/* کاور */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--surface2)", overflow: "hidden", flexShrink: 0 }}>
              {form.cover_url && (
                <img src={form.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
            <label style={{ ...btn(), opacity: uploading ? 0.6 : 1 }}>
              <Upload size={14} /> {uploading === "cover" ? "در حال آپلود..." : "آپلود کاور (عکس مربعی)"}
              <input type="file" accept="image/*" onChange={onCover} disabled={!!uploading} style={{ display: "none" }} />
            </label>
          </div>

          {/* ویدیوها */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {form.items.map((it, idx) => {
              const linkInList = products.some((p) => productLink(p) === it.link);

              return (
                <div key={it.url} style={{ display: "flex", gap: 10, background: "var(--surface2)", borderRadius: 12, padding: 10 }}>
                  <video
                    src={it.url}
                    muted
                    playsInline
                    preload="metadata"
                    style={{ width: 62, height: 110, objectFit: "cover", borderRadius: 8, background: "#000", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 12.5, color: "var(--text-mut)" }}>ویدیو {idx + 1}</div>
                    <select
                      value={linkInList ? it.link : ""}
                      onChange={(e) => setItem(idx, { link: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">لینک به محصول: انتخاب کن (اختیاری)</option>
                      {products.map((p) => (
                        <option key={p.id} value={productLink(p)}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      dir="ltr"
                      placeholder="یا لینک دلخواه، مثل /shop/pod-system"
                      value={it.link}
                      onChange={(e) => setItem(idx, { link: e.target.value })}
                      style={{ ...inputStyle, fontSize: 12 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button type="button" aria-label="بالا" disabled={idx === 0} onClick={() => moveItem(idx, -1)} style={iconBtn(idx === 0)}>
                      <ArrowUp size={14} />
                    </button>
                    <button type="button" aria-label="پایین" disabled={idx === form.items.length - 1} onClick={() => moveItem(idx, 1)} style={iconBtn(idx === form.items.length - 1)}>
                      <ArrowDown size={14} />
                    </button>
                    <button type="button" aria-label="حذف" onClick={() => removeItem(idx)} style={{ ...iconBtn(false), color: "#ff6b6b" }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            <label style={{ ...btn("var(--surface2)"), justifyContent: "center", padding: 14, border: "1px dashed var(--text-mut)", opacity: uploading ? 0.6 : 1 }}>
              <Plus size={15} />
              {uploading && uploading !== "cover" ? "در حال آپلود ویدیو..." : "افزودن ویدیو (MP4)"}
              <input type="file" accept="video/*" multiple onChange={onVideo} disabled={!!uploading} style={{ display: "none" }} />
            </label>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer" }}>
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            نمایش در صفحه‌ی اصلی
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={busy || !!uploading} style={{ ...btn("#9B5CFF", "#fff"), opacity: busy || uploading ? 0.6 : 1 }}>
              {busy ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button onClick={() => closeForm(true)} disabled={busy} style={btn()}>
              انصراف
            </button>
          </div>
        </div>
      )}

      {/* ---------------- لیست گروه‌ها ---------------- */}
      {loading && <p style={{ color: "var(--text-mut)", fontSize: 13.5 }}>در حال بارگذاری...</p>}
      {!loading && groups.length === 0 && !form && !error && (
        <p style={{ color: "var(--text-mut)", fontSize: 13.5 }}>هنوز گروهی نساختی.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {groups.map((g, idx) => (
          <div key={g.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, opacity: g.active ? 1 : 0.55 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--surface2)", overflow: "hidden", flexShrink: 0 }}>
              {g.cover_url && <img src={g.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{g.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-mut)" }}>
                {(g.items || []).length} ویدیو {g.active ? "" : "— مخفی"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button aria-label="بالا" disabled={idx === 0 || !!form} onClick={() => moveGroup(idx, -1)} style={iconBtn(idx === 0 || !!form)}>
                <ArrowUp size={14} />
              </button>
              <button aria-label="پایین" disabled={idx === groups.length - 1 || !!form} onClick={() => moveGroup(idx, 1)} style={iconBtn(idx === groups.length - 1 || !!form)}>
                <ArrowDown size={14} />
              </button>
              <button aria-label={g.active ? "مخفی کردن" : "نمایش"} onClick={() => toggleActive(g)} style={iconBtn(false)}>
                {g.active ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button aria-label="ویرایش" disabled={!!form} onClick={() => openEdit(g)} style={iconBtn(!!form)}>
                <Pencil size={14} />
              </button>
              <button aria-label="حذف" onClick={() => removeGroup(g)} style={{ ...iconBtn(false), color: "#ff6b6b" }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
