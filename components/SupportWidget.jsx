"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    setSending(true);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          message,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "خطا در ارسال");
      }

      setSent(true);
      setName("");
      setPhone("");
      setMessage("");

      setTimeout(() => {
        setSent(false);
      }, 4000);
    } catch (error) {
      alert("ارسال پیام ناموفق بود. لطفاً دوباره امتحان کنید.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* دکمه شناور */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="پشتیبانی"
        style={{
          position: "fixed",
          left: 22,
          bottom: 22,
          width: 58,
          height: 58,
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #22E5C9, #2F86FF)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 8px 30px rgba(47,134,255,0.35)",
          transition: "transform 0.25s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {open ? <X size={25} /> : <MessageCircle size={27} />}
      </button>

      {/* پنجره پشتیبانی */}
      {open && (
        <div
          style={{
            position: "fixed",
            left: 22,
            bottom: 92,
            width: 330,
            maxWidth: "calc(100vw - 44px)",
            background: "var(--surface)",
            border: "1px solid var(--border-soft)",
            borderRadius: 20,
            padding: 20,
            zIndex: 9998,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            direction: "rtl",
          }}
        >
          <div
            style={{
              marginBottom: 18,
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontFamily: "Vazirmatn",
                fontWeight: 800,
                fontSize: 18,
                color: "var(--text-hi)",
                marginBottom: 5,
              }}
            >
              پشتیبانی DigiHaze 💬
            </div>

            <div
              style={{
                fontFamily: "Vazirmatn",
                fontSize: 12,
                color: "var(--text-lo)",
                lineHeight: 1.8,
              }}
            >
              سوالی داری؟ پیامت رو بفرست، در سریع‌ترین زمان پاسخ می‌دیم.
            </div>
          </div>

          {sent ? (
            <div
              style={{
                textAlign: "center",
                padding: "25px 10px",
                fontFamily: "Vazirmatn",
                color: "#22E5C9",
                lineHeight: 2,
              }}
            >
              ✅ پیام شما با موفقیت ارسال شد.
              <br />
              به‌زودی با شما تماس می‌گیریم.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="نام شما"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "var(--bg)",
                  color: "var(--text-hi)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: 12,
                  padding: "11px 13px",
                  marginBottom: 10,
                  fontFamily: "Vazirmatn",
                  outline: "none",
                }}
              />

              <input
                type="tel"
                placeholder="شماره تماس"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "var(--bg)",
                  color: "var(--text-hi)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: 12,
                  padding: "11px 13px",
                  marginBottom: 10,
                  fontFamily: "Vazirmatn",
                  outline: "none",
                }}
              />

              <textarea
                placeholder="پیام شما..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "var(--bg)",
                  color: "var(--text-hi)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: 12,
                  padding: "11px 13px",
                  marginBottom: 12,
                  fontFamily: "Vazirmatn",
                  outline: "none",
                  resize: "vertical",
                }}
              />

              <button
                type="submit"
                disabled={sending}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 12,
                  padding: "12px",
                  background: "linear-gradient(135deg, #22E5C9, #2F86FF)",
                  color: "#fff",
                  fontFamily: "Vazirmatn",
                  fontWeight: 800,
                  cursor: sending ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Send size={17} />
                {sending ? "در حال ارسال..." : "ارسال پیام"}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
