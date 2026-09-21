"use client";

import { useEffect, useState } from "react";
import {
  HelpCircle,
  MessageSquare,
  Newspaper,
  Trash2,
  Loader2,
  Send,
  RefreshCw,
  ExternalLink,
  Star,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const cardStyle = {
  background: "var(--surface)",
  border: "1px solid var(--surface2)",
  borderRadius: 14,
  padding: 16,
};

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "var(--surface2)",
  border: "1px solid var(--surface2)",
  borderRadius: 10,
  padding: "10px 14px",
  color: "var(--text-hi)",
  fontFamily: "var(--font-primary)",
  fontSize: 13,
  lineHeight: 1.9,
  outline: "none",
  resize: "vertical",
};

const smallBtn = {
  background: "var(--surface2)",
  border: "none",
  borderRadius: 10,
  padding: "8px 14px",
  display: "flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
  color: "var(--text-hi)",
  fontFamily: "var(--font-primary)",
  fontSize: 12.5,
};

const subTabStyle = (active) => ({
  background: active ? "#4F7FFF22" : "var(--surface)",
  border: active ? "1px solid #4F7FFF" : "1px solid var(--surface2)",
  color: active ? "var(--text-hi)" : "var(--text-mut)",
  borderRadius: 999,
  padding: "8px 16px",
  display: "flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
  fontFamily: "var(--font-primary)",
  fontWeight: 700,
  fontSize: 13,
});

export default function FeedbackManager() {
  const [data, setData] = useState({
    comments: [],
    reviews: [],
    questions: [],
    errors: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sub, setSub] = useState("questions"); // questions | reviews | comments
  const [answerDrafts, setAnswerDrafts] = useState({}); // { [questionId]: "متن پاسخ" }
  const [busyId, setBusyId] = useState(null);
  const [rowMsg, setRowMsg] = useState({}); // { [id]: "پیام" }

  const getToken = async () => {
    const { data: s } = await supabase.auth.getSession();
    return s?.session?.access_token;
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/feedback", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطا در دریافت اطلاعات");

      setData({
        comments: json.comments || [],
        reviews: json.reviews || [],
        questions: json.questions || [],
        errors: json.errors || {},
      });

      const drafts = {};
      (json.questions || []).forEach((q) => {
        drafts[q.id] = q.answer || "";
      });
      setAnswerDrafts(drafts);
    } catch (e) {
      setError(e.message || "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (type, id, listKey) => {
    const label =
      type === "question" ? "این سوال" : type === "review" ? "این نظر" : "این نظر";
    if (!window.confirm(`${label} برای همیشه حذف بشه؟`)) return;

    setBusyId(id);
    try {
      const token = await getToken();
      const res = await fetch(
        `/api/admin/feedback?type=${type}&id=${encodeURIComponent(id)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || "حذف ناموفق بود");
        return;
      }
      setData((prev) => ({
        ...prev,
        [listKey]: prev[listKey].filter((item) => item.id !== id),
      }));
    } catch {
      alert("خطا در ارتباط با سرور");
    } finally {
      setBusyId(null);
    }
  };

  const saveAnswer = async (id) => {
    setBusyId(id);
    setRowMsg((prev) => ({ ...prev, [id]: "" }));
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, answer: answerDrafts[id] || "" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRowMsg((prev) => ({ ...prev, [id]: json.error || "ثبت پاسخ ناموفق بود" }));
        return;
      }
      setData((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === id
            ? { ...q, answer: json.answer, answeredAt: json.answeredAt }
            : q
        ),
      }));
      setRowMsg((prev) => ({
        ...prev,
        [id]: json.answer ? "پاسخ ثبت شد ✅" : "پاسخ پاک شد",
      }));
    } catch {
      setRowMsg((prev) => ({ ...prev, [id]: "خطا در ارتباط با سرور" }));
    } finally {
      setBusyId(null);
    }
  };

  // سوال‌های بی‌پاسخ اول نمایش داده بشن
  const sortedQuestions = [...data.questions].sort((a, b) => {
    const aa = a.answer ? 1 : 0;
    const bb = b.answer ? 1 : 0;
    if (aa !== bb) return aa - bb;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  const unanswered = data.questions.filter((q) => !q.answer).length;

  const productLink = (product) =>
    product?.link ? (
      <a
        href={product.link}
        target="_blank"
        rel="noreferrer"
        style={{
          color: "#4F7FFF",
          fontSize: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          textDecoration: "none",
        }}
      >
        {product.name} <ExternalLink size={12} />
      </a>
    ) : (
      <span style={{ color: "var(--text-mut)", fontSize: 12 }}>{product?.name}</span>
    );

  const deleteBtn = (type, id, listKey) => (
    <button
      onClick={() => remove(type, id, listKey)}
      disabled={busyId === id}
      title="حذف"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "#FF5C5C",
        padding: 6,
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "var(--font-primary)",
        fontSize: 12,
      }}
    >
      {busyId === id ? <Loader2 size={15} className="fb-spin" /> : <Trash2 size={15} />}
      حذف
    </button>
  );

  const emptyText = (text) => (
    <p style={{ color: "var(--text-mut)", fontSize: 13 }}>{text}</p>
  );

  const tableWarning = (key) =>
    data.errors?.[key] ? (
      <div
        style={{
          color: "#FF7A1F",
          background: "#FF7A1F22",
          borderRadius: 10,
          padding: "8px 12px",
          fontSize: 12.5,
          marginBottom: 12,
        }}
      >
        دریافت این بخش با خطا مواجه شد: {data.errors[key]} — احتمالاً فایل SQL مایگریشن
        (supabase/product_feedback_migration.sql) هنوز توی Supabase اجرا نشده.
      </div>
    ) : null;

  return (
    <div dir="rtl">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setSub("questions")} style={subTabStyle(sub === "questions")}>
            <HelpCircle size={14} /> سوال و جواب ({data.questions.length})
            {unanswered > 0 && (
              <span
                style={{
                  background: "#FF7A1F",
                  color: "#fff",
                  borderRadius: 999,
                  fontSize: 11,
                  padding: "1px 7px",
                }}
              >
                {unanswered.toLocaleString("fa-IR")} بی‌پاسخ
              </span>
            )}
          </button>
          <button onClick={() => setSub("reviews")} style={subTabStyle(sub === "reviews")}>
            <Star size={14} /> نظرات محصولات ({data.reviews.length})
          </button>
          <button onClick={() => setSub("comments")} style={subTabStyle(sub === "comments")}>
            <Newspaper size={14} /> نظرات بلاگ ({data.comments.length})
          </button>
        </div>

        <button onClick={load} style={smallBtn}>
          <RefreshCw size={14} /> به‌روزرسانی
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "#FF5C5C",
            background: "#FF5C5C22",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12.5,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {loading && <p style={{ color: "var(--text-mut)" }}>در حال بارگذاری...</p>}

      {/* ---------------- سوال و جواب ---------------- */}
      {!loading && sub === "questions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tableWarning("questions")}
          {data.questions.length === 0 && !data.errors?.questions && emptyText("هنوز سوالی ثبت نشده.")}

          {sortedQuestions.map((q) => (
            <div key={q.id} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                    {q.name}
                    {!q.answer && (
                      <span
                        style={{
                          marginRight: 8,
                          background: "#FF7A1F22",
                          color: "#FF7A1F",
                          borderRadius: 999,
                          fontSize: 11,
                          padding: "2px 8px",
                        }}
                      >
                        بی‌پاسخ
                      </span>
                    )}
                    {q.answer && (
                      <span
                        style={{
                          marginRight: 8,
                          color: "#4CD98A",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: 11,
                        }}
                      >
                        <CheckCircle2 size={12} /> پاسخ داده شده
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-mut)", marginTop: 2 }}>
                    {formatDate(q.createdAt)} • {productLink(q.product)}
                  </div>
                </div>
                {deleteBtn("question", q.id, "questions")}
              </div>

              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 13.5,
                  lineHeight: 1.9,
                  color: "var(--text-hi)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {q.question}
              </p>

              <textarea
                rows={3}
                maxLength={2000}
                placeholder="پاسخ ادمین رو اینجا بنویس..."
                value={answerDrafts[q.id] ?? ""}
                onChange={(e) =>
                  setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                style={textareaStyle}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => saveAnswer(q.id)}
                  disabled={busyId === q.id}
                  style={{ ...smallBtn, background: "#4F7FFF", color: "#fff", fontWeight: 700 }}
                >
                  {busyId === q.id ? <Loader2 size={14} className="fb-spin" /> : <Send size={14} />}
                  {q.answer ? "ویرایش پاسخ" : "ثبت پاسخ"}
                </button>
                {rowMsg[q.id] && (
                  <span style={{ fontSize: 12, color: "var(--text-mut)" }}>{rowMsg[q.id]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- نظرات محصولات ---------------- */}
      {!loading && sub === "reviews" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tableWarning("reviews")}
          {data.reviews.length === 0 && !data.errors?.reviews && emptyText("هنوز نظری برای محصولات ثبت نشده.")}

          {data.reviews.map((r) => (
            <div key={r.id} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center", gap: 8 }}>
                    {r.name}
                    <span style={{ color: "#B6FF1A", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <Star size={12} fill="#B6FF1A" /> {Number(r.rating).toLocaleString("fa-IR")}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-mut)", marginTop: 2 }}>
                    {formatDate(r.createdAt)} • {productLink(r.product)}
                  </div>
                </div>
                {deleteBtn("review", r.id, "reviews")}
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.9,
                  color: "var(--text-lo)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {r.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- نظرات بلاگ ---------------- */}
      {!loading && sub === "comments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tableWarning("comments")}
          {data.comments.length === 0 && !data.errors?.comments && emptyText("هنوز نظری برای مقاله‌ها ثبت نشده.")}

          {data.comments.map((c) => (
            <div key={c.id} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center", gap: 6 }}>
                    <MessageSquare size={14} color="#4F7FFF" /> {c.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-mut)", marginTop: 2 }}>
                    {formatDate(c.createdAt)} •{" "}
                    {c.link ? (
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#4F7FFF",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          textDecoration: "none",
                        }}
                      >
                        {c.postTitle} <ExternalLink size={12} />
                      </a>
                    ) : (
                      c.postTitle
                    )}
                  </div>
                </div>
                {deleteBtn("comment", c.id, "comments")}
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.9,
                  color: "var(--text-lo)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .fb-spin {
          animation: fb-spin 0.8s linear infinite;
        }
        @keyframes fb-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
