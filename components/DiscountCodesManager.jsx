"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Percent, Tag } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const EMPTY_FORM = {
  code: "",
  type: "percent",
  value: "",
  maxUses: "",
  minOrderTotal: "",
  expiresAt: "",
  active: true,
};

export default function DiscountCodesManager() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  };

  const fetchCodes = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/discount-codes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در دریافت کدهای تخفیف");
      setCodes(data.discountCodes || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      maxUses: c.max_uses === null || c.max_uses === undefined ? "" : String(c.max_uses),
      minOrderTotal: c.min_order_total ? String(c.min_order_total) : "",
      expiresAt: c.expires_at ? c.expires_at.slice(0, 10) : "",
      active: c.active,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.code.trim()) {
      setError("کد تخفیف را وارد کن");
      return;
    }

    if (!Number(form.value) || Number(form.value) <= 0) {
      setError("مقدار تخفیف را وارد کن");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const body = {
        code: form.code.trim(),
        type: form.type,
        value: form.value,
        maxUses: form.maxUses,
        minOrderTotal: form.minOrderTotal,
        expiresAt: form.expiresAt || null,
        active: form.active,
      };
      if (editingId) body.id = editingId;

      const res = await fetch("/api/admin/discount-codes", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ذخیره ناموفق بود");

      resetForm();
      fetchCodes();
    } catch (e) {
      setError(e.message || "خطایی رخ داد");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c) => {
    try {
      const token = await getToken();
      await fetch("/api/admin/discount-codes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: c.id, toggleActive: !c.active }),
      });
      fetchCodes();
    } catch (e) {
      setError(e.message || "خطایی رخ داد");
    }
  };

  const remove = async (id) => {
    if (!confirm("این کد تخفیف حذف شود؟")) return;
    try {
      const token = await getToken();
      await fetch(`/api/admin/discount-codes?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCodes();
    } catch (e) {
      setError(e.message || "خطایی رخ داد");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* فرم افزودن/ویرایش */}
      <form
        onSubmit={submit}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--surface2)",
          borderRadius: 14,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 560,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Tag size={17} color="#9B5CFF" />
          <span style={{ fontFamily: "var(--font-primary)", fontWeight: 800, fontSize: 15 }}>
            {editingId ? "ویرایش کد تخفیف" : "افزودن کد تخفیف"}
          </span>
        </div>

        <input
          placeholder="کد تخفیف (مثلاً DIGIHAZE20)"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          dir="ltr"
          style={inputStyle}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="percent">درصدی (%)</option>
            <option value="fixed">مبلغ ثابت (تومان)</option>
          </select>

          <input
            type="number"
            placeholder={form.type === "percent" ? "مثلاً 20" : "مثلاً 50000"}
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>سقف تعداد استفاده (اختیاری)</label>
            <input
              type="number"
              placeholder="نامحدود"
              value={form.maxUses}
              onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>حداقل مبلغ سبد (اختیاری)</label>
            <input
              type="number"
              placeholder="بدون محدودیت"
              value={form.minOrderTotal}
              onChange={(e) => setForm((f) => ({ ...f, minOrderTotal: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>تاریخ انقضا (اختیاری)</label>
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            style={inputStyle}
          />
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-primary)",
            fontSize: 13,
            color: "var(--text-hi)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          فعال
        </label>

        {error && (
          <div
            style={{
              background: "#ff3b3b18",
              color: "#ff6b6b",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              fontFamily: "var(--font-primary)",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#4F7FFF",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              fontFamily: "var(--font-primary)",
              fontWeight: 700,
              fontSize: 13,
              color: "var(--ink)",
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
            {editingId ? "ذخیره تغییرات" : "افزودن کد"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                background: "var(--surface2)",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                fontFamily: "var(--font-primary)",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--text-hi)",
                cursor: "pointer",
              }}
            >
              انصراف از ویرایش
            </button>
          )}
        </div>
      </form>

      {/* لیست کدها */}
      {loading && <p style={{ color: "var(--text-mut)" }}>در حال بارگذاری...</p>}
      {!loading && codes.length === 0 && (
        <p style={{ color: "var(--text-mut)" }}>هنوز کد تخفیفی ثبت نشده.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {codes.map((c) => {
          const expired = c.expires_at && new Date(c.expires_at).getTime() < Date.now();
          const reachedLimit =
            c.max_uses !== null && c.max_uses !== undefined && c.used_count >= c.max_uses;

          return (
            <div
              key={c.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--surface2)",
                borderRadius: 14,
                padding: 16,
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    dir="ltr"
                    style={{ fontFamily: "var(--font-primary)", fontWeight: 800, fontSize: 15 }}
                  >
                    {c.code}
                  </span>
                  <span
                    style={{
                      background: "var(--surface2)",
                      borderRadius: 8,
                      padding: "2px 8px",
                      fontSize: 11.5,
                      fontFamily: "var(--font-primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      color: "var(--text-mut)",
                    }}
                  >
                    {c.type === "percent" ? <Percent size={11} /> : null}
                    {c.type === "percent"
                      ? `${c.value}٪`
                      : `${Number(c.value).toLocaleString("fa-IR")} تومان`}
                  </span>
                  {!c.active && (
                    <span style={{ ...pillStyle, color: "var(--text-faint)" }}>غیرفعال</span>
                  )}
                  {expired && <span style={{ ...pillStyle, color: "#ff6b6b" }}>منقضی</span>}
                  {reachedLimit && (
                    <span style={{ ...pillStyle, color: "#FF7A1F" }}>سقف استفاده تمام شد</span>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "var(--text-mut)",
                    fontFamily: "var(--font-primary)",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <span>
                    استفاده شده: {c.used_count} از {c.max_uses ?? "نامحدود"}
                  </span>
                  {c.min_order_total > 0 && (
                    <span>حداقل سبد: {Number(c.min_order_total).toLocaleString("fa-IR")} تومان</span>
                  )}
                  {c.expires_at && (
                    <span>انقضا: {new Date(c.expires_at).toLocaleDateString("fa-IR")}</span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "var(--font-primary)",
                    fontSize: 12,
                    color: "var(--text-mut)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={c.active}
                    onChange={() => toggleActive(c)}
                  />
                  فعال
                </label>

                <button
                  onClick={() => startEdit(c)}
                  style={{ ...iconTextBtn }}
                >
                  ویرایش
                </button>

                <button
                  onClick={() => remove(c.id)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <Trash2 size={17} color="#4F7FFF" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const inputStyle = {
  background: "var(--bg)",
  border: "1px solid var(--surface2)",
  borderRadius: 10,
  padding: "11px 14px",
  color: "var(--text-hi)",
  fontFamily: "var(--font-primary)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  color: "var(--text-mut)",
  fontFamily: "var(--font-primary)",
  marginBottom: 5,
};

const iconTextBtn = {
  background: "var(--surface2)",
  border: "none",
  borderRadius: 8,
  padding: "7px 12px",
  cursor: "pointer",
  color: "var(--text-hi)",
  fontFamily: "var(--font-primary)",
  fontSize: 12,
};

const pillStyle = {
  background: "var(--surface2)",
  borderRadius: 8,
  padding: "2px 8px",
  fontSize: 11.5,
  fontFamily: "var(--font-primary)",
};
