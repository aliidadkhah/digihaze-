"use client";

import { useState } from "react";
import { Send, Loader2, HelpCircle, MessageCircle } from "lucide-react";
import { inputStyle } from "./ui";
import { useUser } from "./Providers";

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

/*
 * بخش سوال و جواب محصول
 *
 * - questions: سوال‌هایی که کاربران ثبت کردند (از دیتابیس) — { id, name, question, answer, createdAt }
 * - staticQa: پرسش‌وپاسخ‌های ثابتی که ادمین موقع ساخت/ویرایش محصول وارد کرده — { question, answer }
 * - onAsk({ name, question }): سوال رو ثبت می‌کنه؛ اگر خطا بده Error پرتاب می‌کنه
 */
export default function ProductQA({ questions = [], staticQa = [], onAsk }) {
  const { user } = useUser() || {};

  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSent(false);

    const finalName = (user?.name || name).trim();

    if (!finalName) {
      return setError("لطفاً نامت رو بنویس");
    }

    if (question.trim().length < 5) {
      return setError("متن سوال خیلی کوتاهه");
    }

    setSubmitting(true);
    try {
      await onAsk({ name: finalName, question: question.trim() });
      setQuestion("");
      setSent(true);
    } catch (err) {
      setError(err?.message || "ثبت سوال ناموفق بود");
    } finally {
      setSubmitting(false);
    }
  };

  const total = questions.length + staticQa.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* فرم ثبت سوال */}
      <form
        onSubmit={submit}
        style={{
          background: "var(--surface)",
          borderRadius: 14,
          padding: 16,
          marginBottom: 4,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 13.5,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <HelpCircle size={16} color="#4F7FFF" />
          سوالی درباره این محصول داری؟
        </div>

        {!user?.name && (
          <input
            placeholder="نام شما"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        )}

        <textarea
          placeholder="سوالت رو اینجا بنویس..."
          value={question}
          maxLength={1000}
          rows={3}
          onChange={(e) => setQuestion(e.target.value)}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        {error && (
          <div
            style={{
              color: "#4F7FFF",
              fontSize: 12,
              background: "#4F7FFF22",
              borderRadius: 8,
              padding: "6px 10px",
            }}
          >
            {error}
          </div>
        )}

        {sent && !error && (
          <div
            style={{
              color: "#2FB36E",
              fontSize: 12,
              background: "#2FB36E22",
              borderRadius: 8,
              padding: "6px 10px",
            }}
          >
            سوالت ثبت شد. به‌محض پاسخ ادمین همین‌جا نمایش داده می‌شه.
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            alignSelf: "flex-start",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#4F7FFF",
            color: "var(--ink)",
            border: "none",
            borderRadius: 10,
            padding: "9px 20px",
            fontFamily: "var(--font-primary)",
            fontWeight: 700,
            fontSize: 13,
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? <Loader2 size={14} className="qa-spin" /> : <Send size={14} />}
          ثبت سوال
        </button>
      </form>

      {total === 0 && (
        <p style={{ color: "var(--text-mut)", fontSize: 13 }}>
          هنوز سوالی برای این محصول ثبت نشده. اولین نفر باش!
        </p>
      )}

      {/* پرسش‌وپاسخ‌های ثابتی که ادمین توی مشخصات محصول نوشته */}
      {staticQa.map((item, i) => (
        <div
          key={`static-${i}`}
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>
            {item.question}
          </div>

          <p
            style={{
              color: "var(--text-lo)",
              fontSize: 13,
              lineHeight: 1.9,
              margin: 0,
            }}
          >
            {item.answer}
          </p>
        </div>
      ))}

      {/* سوال‌های کاربران */}
      {questions.map((q) => (
        <div
          key={q.id}
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>{q.name}</span>
            <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
              {formatDate(q.createdAt)}
            </span>
          </div>

          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.9,
              margin: 0,
              color: "var(--text-hi)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {q.question}
          </p>

          {q.answer ? (
            <div
              style={{
                marginTop: 12,
                background: "#4F7FFF12",
                borderRight: "3px solid #4F7FFF",
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 700,
                  fontSize: 12.5,
                  color: "#4F7FFF",
                  marginBottom: 4,
                }}
              >
                <MessageCircle size={13} />
                پاسخ دیجی‌هیز
              </div>
              <p
                style={{
                  color: "var(--text-lo)",
                  fontSize: 13,
                  lineHeight: 1.9,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {q.answer}
              </p>
            </div>
          ) : (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "var(--text-faint)",
              }}
            >
              در انتظار پاسخ
            </div>
          )}
        </div>
      ))}

      <style>{`
        .qa-spin {
          animation: qa-spin 0.8s linear infinite;
        }
        @keyframes qa-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
