"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send, Trash2, Loader2, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function PostComments({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchComments();

    supabase.auth.getSession().then(({ data }) => {
      setIsAdmin(!!data?.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setIsAdmin(!!s);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function fetchComments() {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      const data = await res.json();
      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("لطفاً نام خود را وارد کنید");
      return;
    }
    if (content.trim().length < 2) {
      setError("متن نظر خیلی کوتاه است");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, name, content }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "ثبت نظر ناموفق بود");
        return;
      }

      setComments((prev) => [...prev, data.comment]);
      setContent("");
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("این نظر حذف شود؟")) return;

    setDeletingId(id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(`/api/comments?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "حذف نظر ناموفق بود");
        return;
      }

      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("خطا در ارتباط با سرور");
    } finally {
      setDeletingId(null);
    }
  }

  const inputStyle = {
    width: "100%",
    background: "var(--surface2)",
    border: "1px solid var(--surface2)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "var(--text-hi)",
    fontFamily: "var(--font-primary)",
    fontSize: 13.5,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ marginTop: 50 }} dir="rtl">
      <h2
        style={{
          fontFamily: "var(--font-primary)",
          fontWeight: 800,
          fontSize: 18,
          color: "var(--text-hi)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <MessageCircle size={18} color="#4F7FFF" />
        نظرات {comments.length > 0 ? `(${comments.length})` : ""}
      </h2>

      {loading ? (
        <div style={{ color: "var(--text-faint)", fontSize: 13, fontFamily: "var(--font-primary)" }}>
          در حال بارگذاری نظرات...
        </div>
      ) : comments.length === 0 ? (
        <div
          style={{
            color: "var(--text-faint)",
            fontSize: 13.5,
            fontFamily: "var(--font-primary)",
            marginBottom: 28,
          }}
        >
          هنوز نظری ثبت نشده. اولین نفری باشید که نظر می‌دهید.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 30 }}>
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--surface2)",
                borderRadius: 14,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#4F7FFF18",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={14} color="#4F7FFF" />
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-primary)",
                        fontWeight: 700,
                        fontSize: 13,
                        color: "var(--text-hi)",
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-primary)",
                        fontSize: 11,
                        color: "var(--text-faint)",
                      }}
                    >
                      {formatDate(c.createdAt)}
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    title="حذف نظر"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-faint)",
                      padding: 6,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {deletingId === c.id ? (
                      <Loader2 size={15} className="spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                )}
              </div>

              <p
                style={{
                  fontFamily: "var(--font-primary)",
                  fontSize: 13.5,
                  lineHeight: 1.9,
                  color: "var(--text-lo)",
                  margin: 0,
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

      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--surface2)",
          borderRadius: 14,
          padding: 18,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-primary)",
            fontWeight: 700,
            fontSize: 14,
            color: "var(--text-hi)",
            marginBottom: 12,
          }}
        >
          ثبت نظر
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="text"
            placeholder="نام شما"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            style={inputStyle}
          />
          <textarea
            placeholder="نظر خود را بنویسید..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            rows={4}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--font-primary)" }}
          />

          {error && (
            <div style={{ color: "#FF5C5C", fontSize: 12.5, fontFamily: "var(--font-primary)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "#4F7FFF",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "11px 18px",
              fontFamily: "var(--font-primary)",
              fontWeight: 700,
              fontSize: 13.5,
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.7 : 1,
              alignSelf: "flex-start",
            }}
          >
            {submitting ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
            ارسال نظر
          </button>
        </div>
      </form>

      <style>{`
        .spin {
          animation: pc-spin 0.8s linear infinite;
        }
        @keyframes pc-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
