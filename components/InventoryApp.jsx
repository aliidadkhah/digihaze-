"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, LogOut, Plus, Minus, RefreshCw, Search, X, PackagePlus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES } from "@/lib/data";

const LOW_STOCK = 2;

// اعداد فارسی/عربی رو به انگلیسی تبدیل می‌کنه تا با کیبورد فارسی هم کار کنه
const toEn = (v) =>
  String(v ?? "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[^\d]/g, "");

const faNum = (n) => Number(n || 0).toLocaleString("fa-IR");

const isUnlimited = (c) => c?.stock === null || c?.stock === undefined;

const stockColor = (stock) =>
  stock === null || stock === undefined
    ? "var(--text-mut)"
    : stock <= 0
    ? "#ff6b6b"
    : stock <= LOW_STOCK
    ? "#FF7A1F"
    : "var(--text-hi)";

const MODES = {
  in: { label: "ورود کالا (خرید)", sign: 1, color: "#22E5C9" },
  out: { label: "فروش بیرون از سایت", sign: -1, color: "#FF7A1F" },
  set: { label: "تعیین موجودی دقیق", sign: 0, color: "#9B5CFF" },
};

const inputStyle = {
  background: "var(--surface2)",
  border: "1px solid var(--surface2)",
  borderRadius: 12,
  padding: "13px 14px",
  color: "var(--text-hi)",
  fontFamily: "var(--font-primary)",
  fontSize: 15,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const roundBtn = (disabled) => ({
  width: 38,
  height: 38,
  borderRadius: 12,
  border: "none",
  background: "var(--surface2)",
  color: "var(--text-hi)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: disabled ? "default" : "pointer",
  opacity: disabled ? 0.35 : 1,
});

export default function InventoryApp() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null); // { text, error }

  const [sheet, setSheet] = useState(null); // { product, color, mode, qty }
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    category: CATEGORIES[0]?.id || "",
    price: "",
    model: "استاندارد",
    count: "",
  });

  // ---------------- نصب‌پذیری (PWA) ----------------
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/inventory-sw.js", { scope: "/inventory" })
        .catch(() => {});
    }
  }, []);

  // ---------------- ورود ----------------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError("ایمیل یا رمز عبور اشتباهه");
  };

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  };

  const showToast = (text, error = false) => {
    setToast({ text, error });
    setTimeout(() => setToast(null), 3200);
  };

  // ---------------- دریافت محصولات ----------------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/inventory", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطا در دریافت انبار");
      setProducts(json.products || []);
    } catch (e) {
      showToast(e.message || "خطایی رخ داد", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  // ---------------- ارسال تغییر ----------------
  const send = async (payload) => {
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطا در ثبت تغییر");
      setProducts((prev) => prev.map((p) => (p.id === json.product.id ? json.product : p)));
      return true;
    } catch (e) {
      showToast(e.message || "خطایی رخ داد", true);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const quick = (product, color, delta) =>
    send({ action: "adjust", productId: product.id, color: color.name, delta });

  const confirmSheet = async () => {
    if (!sheet) return;
    const { product, color, mode, qty } = sheet;
    const n = Number(toEn(qty));

    if (mode === "set") {
      if (qty === "" ) return showToast("عدد موجودی رو وارد کن", true);
      const ok = await send({ action: "set", productId: product.id, color: color.name, value: n });
      if (ok) {
        showToast(`موجودی «${product.name}» ${color.name} شد ${faNum(n)}`);
        setSheet(null);
      }
      return;
    }

    if (!n || n < 1) return showToast("تعداد رو وارد کن", true);
    const delta = MODES[mode].sign * n;
    const ok = await send({ action: "adjust", productId: product.id, color: color.name, delta });
    if (ok) {
      showToast(`${mode === "in" ? "اضافه شد" : "کم شد"}: ${faNum(n)} عدد`);
      setSheet(null);
    }
  };

  const openSheet = (product, color) =>
    setSheet({
      product,
      color,
      mode: isUnlimited(color) ? "set" : "in",
      qty: "",
    });

  // ---------------- محصول جدید ----------------
  const createProduct = async () => {
    const name = newForm.name.trim();
    const price = Number(toEn(newForm.price));
    const count = Number(toEn(newForm.count));

    if (!name) return showToast("اسم محصول رو وارد کن", true);
    if (!price) return showToast("قیمت (تومان) رو وارد کن", true);
    if (newForm.count === "") return showToast("تعداد موجودی رو وارد کن", true);

    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          category: newForm.category,
          price,
          images: [],
          colors: [
            { name: newForm.model.trim() || "استاندارد", hex: "#000000", stock: count },
          ],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطا در ساخت محصول");

      showToast("محصول اضافه شد. عکس و توضیحاتش رو از پنل ادمین کامل کن.");
      setNewOpen(false);
      setNewForm({ name: "", category: CATEGORIES[0]?.id || "", price: "", model: "استاندارد", count: "" });
      await load();
    } catch (e) {
      showToast(e.message || "خطایی رخ داد", true);
    } finally {
      setBusy(false);
    }
  };

  // ---------------- فیلتر ----------------
  const isLow = (p) =>
    (p.colors || []).length > 0
      ? p.colors.some((c) => !isUnlimited(c) && c.stock <= LOW_STOCK)
      : !p.available;

  const visible = useMemo(() => {
    const q = search.trim();
    return products.filter((p) => {
      if (q && !(p.name || "").includes(q)) return false;
      if (onlyLow && !isLow(p)) return false;
      return true;
    });
  }, [products, search, onlyLow]);

  const lowCount = useMemo(() => products.filter(isLow).length, [products]);

  // ---------------- رندر ----------------
  const shell = {
    position: "fixed",
    inset: 0,
    zIndex: 10000,
    background: "var(--bg)",
    color: "var(--text-hi)",
    fontFamily: "var(--font-primary)",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    direction: "rtl",
  };

  if (checking) {
    return (
      <div style={{ ...shell, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-mut)" }}>در حال بارگذاری...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ ...shell, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <form onSubmit={login} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <Boxes size={40} color="#9B5CFF" />
            <h1 style={{ fontWeight: 800, fontSize: 20, marginTop: 8 }}>انبار دیجی‌هیز</h1>
          </div>
          <input
            type="email"
            placeholder="ایمیل ادمین"
            value={email}
            dir="ltr"
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="رمز عبور"
            value={password}
            dir="ltr"
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          {loginError && <div style={{ color: "#ff6b6b", fontSize: 13 }}>{loginError}</div>}
          <button
            type="submit"
            style={{ background: "#9B5CFF", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontFamily: "var(--font-primary)", fontWeight: 800, fontSize: 15, cursor: "pointer" }}
          >
            ورود
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={shell}>
      {/* هدر */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "var(--bg)",
          padding: "14px 14px 10px",
          borderBottom: "1px solid var(--surface2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 17 }}>
            <Boxes size={20} color="#9B5CFF" /> انبار دیجی‌هیز
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={load} disabled={loading} aria-label="به‌روزرسانی" style={roundBtn(loading)}>
              <RefreshCw size={16} />
            </button>
            <button onClick={() => supabase.auth.signOut()} aria-label="خروج" style={roundBtn(false)}>
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search size={15} style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)", color: "var(--text-mut)" }} />
          <input
            placeholder="جستجوی نام محصول..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingRight: 34, padding: "11px 34px 11px 12px", fontSize: 14 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setOnlyLow(false)}
            style={chip(!onlyLow)}
          >
            همه ({faNum(products.length)})
          </button>
          <button onClick={() => setOnlyLow(true)} style={chip(onlyLow, "#FF7A1F")}>
            کم‌موجود/ناموجود ({faNum(lowCount)})
          </button>
          <button
            onClick={() => setNewOpen(true)}
            style={{ marginRight: "auto", display: "flex", alignItems: "center", gap: 6, background: "#9B5CFF", color: "#fff", border: "none", borderRadius: 999, padding: "8px 14px", fontFamily: "var(--font-primary)", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}
          >
            <PackagePlus size={14} /> محصول جدید
          </button>
        </div>
      </div>

      {/* لیست */}
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, paddingBottom: 60 }}>
        {loading && products.length === 0 && <p style={{ color: "var(--text-mut)" }}>در حال بارگذاری...</p>}
        {!loading && visible.length === 0 && (
          <p style={{ color: "var(--text-mut)", textAlign: "center", padding: 30 }}>موردی پیدا نشد.</p>
        )}

        {visible.map((p) => {
          const image = Array.isArray(p.images) ? p.images[0] : null;
          const hasColors = (p.colors || []).length > 0;

          return (
            <div key={p.id} style={{ background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 16, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: hasColors ? 10 : 8 }}>
                {image ? (
                  <img src={image} alt="" width={46} height={46} loading="lazy" style={{ width: 46, height: 46, borderRadius: 10, objectFit: "cover", background: "var(--surface2)", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 46, height: 46, borderRadius: 10, background: "var(--surface2)", flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.6 }}>{p.name}</div>
                  {!p.available && <div style={{ fontSize: 11.5, color: "#ff6b6b" }}>ناموجود</div>}
                </div>
              </div>

              {hasColors ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {p.colors.map((c, i) => {
                    const unlimited = isUnlimited(c);
                    return (
                      <div key={`${c.name}-${i}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <span style={{ width: 14, height: 14, borderRadius: "50%", background: c.hex || "#000", border: "1px solid var(--surface2)", flexShrink: 0 }} />
                          <span style={{ fontSize: 13.5 }}>{c.name || "بدون نام"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button
                            aria-label="یکی کم کن"
                            disabled={busy || unlimited || c.stock <= 0}
                            onClick={() => quick(p, c, -1)}
                            style={roundBtn(busy || unlimited || c.stock <= 0)}
                          >
                            <Minus size={16} />
                          </button>
                          <button
                            onClick={() => openSheet(p, c)}
                            style={{ minWidth: 64, height: 38, borderRadius: 12, border: "1px dashed var(--surface2)", background: "transparent", color: stockColor(c.stock), fontFamily: "var(--font-primary)", fontWeight: 800, fontSize: unlimited ? 12 : 16, cursor: "pointer" }}
                          >
                            {unlimited ? "نامحدود" : faNum(c.stock)}
                          </button>
                          <button
                            aria-label="یکی اضافه کن"
                            disabled={busy || unlimited}
                            onClick={() => quick(p, c, 1)}
                            style={roundBtn(busy || unlimited)}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text-mut)", lineHeight: 1.8 }}>
                    این محصول مدل/رنگ ندارد؛ فقط وضعیت موجود/ناموجود دارد. برای شمارش تعداد، از پنل ادمین یک مدل (مثلاً «استاندارد») برایش بساز.
                  </span>
                  <button
                    disabled={busy}
                    onClick={() => send({ action: "available", productId: p.id, available: !p.available })}
                    style={{ background: p.available ? "#22E5C922" : "#ff6b6b22", color: p.available ? "#22E5C9" : "#ff6b6b", border: "none", borderRadius: 10, padding: "9px 12px", fontFamily: "var(--font-primary)", fontWeight: 700, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {p.available ? "موجود" : "ناموجود"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* پنجره‌ی تغییر موجودی */}
      {sheet && (
        <Overlay onClose={() => setSheet(null)}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>{sheet.product.name}</div>
          <div style={{ color: "var(--text-mut)", fontSize: 13, marginBottom: 14 }}>
            {sheet.color.name} — موجودی فعلی: {isUnlimited(sheet.color) ? "نامحدود" : faNum(sheet.color.stock)}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {Object.entries(MODES).map(([key, m]) => {
              const disabled = isUnlimited(sheet.color) && key !== "set";
              return (
                <button
                  key={key}
                  disabled={disabled}
                  onClick={() => setSheet({ ...sheet, mode: key })}
                  style={{
                    textAlign: "right",
                    background: sheet.mode === key ? `${m.color}22` : "var(--surface2)",
                    border: `1.5px solid ${sheet.mode === key ? m.color : "transparent"}`,
                    color: "var(--text-hi)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    fontFamily: "var(--font-primary)",
                    fontWeight: 700,
                    fontSize: 14,
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? "default" : "pointer",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <input
            inputMode="numeric"
            autoFocus
            placeholder={sheet.mode === "set" ? "موجودی جدید" : "تعداد"}
            value={sheet.qty}
            onChange={(e) => setSheet({ ...sheet, qty: toEn(e.target.value) })}
            style={{ ...inputStyle, fontSize: 18, textAlign: "center", marginBottom: 12 }}
          />

          <button
            disabled={busy}
            onClick={confirmSheet}
            style={{ width: "100%", background: MODES[sheet.mode].color, color: "#061014", border: "none", borderRadius: 12, padding: 14, fontFamily: "var(--font-primary)", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: busy ? 0.6 : 1 }}
          >
            {busy ? "در حال ثبت..." : "ثبت"}
          </button>
        </Overlay>
      )}

      {/* پنجره‌ی محصول جدید */}
      {newOpen && (
        <Overlay onClose={() => setNewOpen(false)}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>محصول جدید</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            <input placeholder="اسم محصول" value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} style={inputStyle} />
            <select value={newForm.category} onChange={(e) => setNewForm({ ...newForm, category: e.target.value })} style={inputStyle}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <input inputMode="numeric" placeholder="قیمت (تومان)" value={newForm.price} onChange={(e) => setNewForm({ ...newForm, price: toEn(e.target.value) })} style={inputStyle} />
            <input placeholder="اسم مدل/رنگ (مثلاً مشکی)" value={newForm.model} onChange={(e) => setNewForm({ ...newForm, model: e.target.value })} style={inputStyle} />
            <input inputMode="numeric" placeholder="تعداد موجودی" value={newForm.count} onChange={(e) => setNewForm({ ...newForm, count: toEn(e.target.value) })} style={inputStyle} />
          </div>
          <button
            disabled={busy}
            onClick={createProduct}
            style={{ width: "100%", background: "#9B5CFF", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontFamily: "var(--font-primary)", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: busy ? 0.6 : 1 }}
          >
            {busy ? "در حال ساخت..." : "افزودن محصول"}
          </button>
        </Overlay>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: 16,
            right: 16,
            zIndex: 10002,
            background: toast.error ? "#3a1020" : "#0e2a2a",
            color: toast.error ? "#ff9b9b" : "#7ff5e2",
            border: `1px solid ${toast.error ? "#ff6b6b55" : "#22E5C955"}`,
            borderRadius: 12,
            padding: "12px 14px",
            fontSize: 13.5,
            textAlign: "center",
          }}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

function chip(active, color = "#4F7FFF") {
  return {
    background: active ? `${color}22` : "var(--surface2)",
    color: active ? color : "var(--text-mut)",
    border: `1px solid ${active ? color : "transparent"}`,
    borderRadius: 999,
    padding: "7px 12px",
    fontFamily: "var(--font-primary)",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function Overlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--surface)",
          borderRadius: "20px 20px 0 0",
          padding: 18,
          paddingBottom: 26,
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="بستن"
          style={{ position: "absolute", top: 14, left: 14, background: "var(--surface2)", border: "none", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-hi)", cursor: "pointer" }}
        >
          <X size={15} />
        </button>
        {children}
      </div>
    </div>
  );
}
