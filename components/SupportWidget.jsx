"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Headphones } from "lucide-react";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);

  const [conversationId, setConversationId] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);

  // بازیابی گفتگو از مرورگر
  useEffect(() => {
    const savedConversation = localStorage.getItem(
      "digihaze_support_conversation"
    );

    const savedName = localStorage.getItem("digihaze_support_name");
    const savedPhone = localStorage.getItem("digihaze_support_phone");

    if (savedConversation) {
      setConversationId(savedConversation);
    }

    if (savedName) {
      setName(savedName);
    }

    if (savedPhone) {
      setPhone(savedPhone);
    }
  }, []);

  // گرفتن پیام‌های گفتگو
  const loadMessages = async () => {
    if (!conversationId) return;

    try {
      setLoadingMessages(true);

      const response = await fetch(
        `/api/support?conversationId=${conversationId}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Load support messages error:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // وقتی پنجره باز است پیام‌ها را بگیر
  useEffect(() => {
    if (!open || !conversationId) return;

    loadMessages();

    // هر 3 ثانیه بررسی می‌کنیم آیا پشتیبانی جواب داده
    const interval = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [open, conversationId]);

  // اسکرول به آخرین پیام
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() || sending) return;

    try {
      setSending(true);

      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          name,
          phone,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "خطا در ارسال پیام");
      }

      // ذخیره اطلاعات گفتگو در مرورگر
      if (data.conversationId) {
        setConversationId(data.conversationId);

        localStorage.setItem(
          "digihaze_support_conversation",
          data.conversationId
        );
      }

      localStorage.setItem("digihaze_support_name", name);
      localStorage.setItem("digihaze_support_phone", phone);

      setMessage("");

      // پیام‌ها را بلافاصله دوباره دریافت کن
      if (data.conversationId) {
        setTimeout(() => {
          loadMessages();
        }, 300);
      }
    } catch (error) {
      console.error(error);
      alert("ارسال پیام ناموفق بود. لطفاً دوباره امتحان کنید.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* دکمه شناور پشتیبانی */}
      <div
        style={{
          position: "fixed",
          left: 22,
          bottom: 22,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        {!open && (
          <span
            style={{
              fontFamily: "Vazirmatn",
              fontWeight: 700,
              fontSize: 12,
              color: "#fff",
              background: "linear-gradient(135deg, #22E5C9, #2F86FF)",
              padding: "4px 12px",
              borderRadius: 999,
              boxShadow: "0 6px 18px rgba(47,134,255,0.35)",
              whiteSpace: "nowrap",
            }}
          >
            پشتیبانی
          </span>
        )}

        <button
          onClick={() => setOpen(!open)}
          aria-label="پشتیبانی"
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "none",
            background: "linear-gradient(135deg, #22E5C9, #2F86FF)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 8px 30px rgba(47,134,255,0.4)",
            transition: "transform 0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {open ? <X size={26} /> : <MessageCircle size={28} />}
        </button>
      </div>

      {/* پنجره چت */}
      {open && (
        <div
          style={{
            position: "fixed",
            left: 22,
            bottom: 94,
            width: 370,
            maxWidth: "calc(100vw - 44px)",
            height: 560,
            maxHeight: "calc(100vh - 120px)",
            background: "var(--surface)",
            border: "1px solid var(--border-soft)",
            borderRadius: 22,
            zIndex: 9998,
            boxShadow: "0 25px 70px rgba(0,0,0,0.4)",
            direction: "rtl",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* هدر */}
          <div
            style={{
              padding: "17px 18px",
              background:
                "linear-gradient(135deg, rgba(34,229,201,0.16), rgba(47,134,255,0.16))",
              borderBottom: "1px solid var(--border-soft)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 43,
                height: 43,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #22E5C9, #2F86FF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Headphones size={21} />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "Vazirmatn",
                  fontWeight: 800,
                  fontSize: 15,
                  color: "var(--text-hi)",
                }}
              >
                پشتیبانی DigiHaze
              </div>

              <div
                style={{
                  fontFamily: "Vazirmatn",
                  fontSize: 11,
                  color: "#22E5C9",
                  marginTop: 3,
                }}
              >
                ● آنلاین
              </div>
            </div>
          </div>

          {/* پیام‌ها */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 13px",
              background: "var(--bg)",
            }}
          >
            {/* پیام خوش‌آمدگویی */}
            {messages.length === 0 && !loadingMessages && (
              <div
                style={{
                  textAlign: "center",
                  padding: "25px 15px",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    margin: "0 auto 12px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #22E5C9, #2F86FF)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageCircle size={25} />
                </div>

                <div
                  style={{
                    fontFamily: "Vazirmatn",
                    fontWeight: 800,
                    color: "var(--text-hi)",
                    marginBottom: 7,
                  }}
                >
                  سلام 👋
                </div>

                <div
                  style={{
                    fontFamily: "Vazirmatn",
                    fontSize: 12,
                    color: "var(--text-lo)",
                    lineHeight: 2,
                  }}
                >
                  پیام خود را بفرستید.
                  <br />
                  پشتیبانی در همین چت پاسخ شما را خواهد داد.
                </div>
              </div>
            )}

            {messages.map((item) => {
              const isCustomer = item.sender === "customer";

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: isCustomer
                      ? "flex-start"
                      : "flex-end",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      maxWidth: "82%",
                      padding: "10px 13px",
                      borderRadius: isCustomer
                        ? "15px 15px 4px 15px"
                        : "15px 15px 15px 4px",
                      background: isCustomer
                        ? "linear-gradient(135deg, #22E5C9, #2F86FF)"
                        : "var(--surface)",
                      color: isCustomer
                        ? "#fff"
                        : "var(--text-hi)",
                      border: isCustomer
                        ? "none"
                        : "1px solid var(--border-soft)",
                      fontFamily: "Vazirmatn",
                      fontSize: 13,
                      lineHeight: 1.9,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {item.message}

                    <div
                      style={{
                        fontSize: 9,
                        opacity: 0.65,
                        marginTop: 3,
                        textAlign: "left",
                        direction: "ltr",
                      }}
                    >
                      {item.created_at
                        ? new Date(item.created_at).toLocaleTimeString(
                            "fa-IR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : ""}
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* فرم ارسال */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: 12,
              background: "var(--surface)",
              borderTop: "1px solid var(--border-soft)",
              flexShrink: 0,
            }}
          >
            {/* اطلاعات مشتری فقط قبل از شروع گفتگو */}
            {!conversationId && (
              <div
                style={{
                  display: "flex",
                  gap: 7,
                  marginBottom: 8,
                }}
              >
                <input
                  type="text"
                  placeholder="نام"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "50%",
                    boxSizing: "border-box",
                    background: "var(--bg)",
                    color: "var(--text-hi)",
                    border: "1px solid var(--border-soft)",
                    borderRadius: 10,
                    padding: "9px 10px",
                    fontFamily: "Vazirmatn",
                    fontSize: 11,
                    outline: "none",
                  }}
                />

                <input
                  type="tel"
                  placeholder="شماره تماس"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: "50%",
                    boxSizing: "border-box",
                    background: "var(--bg)",
                    color: "var(--text-hi)",
                    border: "1px solid var(--border-soft)",
                    borderRadius: 10,
                    padding: "9px 10px",
                    fontFamily: "Vazirmatn",
                    fontSize: 11,
                    outline: "none",
                  }}
                />
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
              }}
            >
              <textarea
                placeholder="پیام خود را بنویسید..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                required
                style={{
                  flex: 1,
                  boxSizing: "border-box",
                  background: "var(--bg)",
                  color: "var(--text-hi)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: 13,
                  padding: "10px 12px",
                  fontFamily: "Vazirmatn",
                  fontSize: 12,
                  outline: "none",
                  resize: "none",
                }}
              />

              <button
                type="submit"
                disabled={sending || !message.trim()}
                aria-label="ارسال پیام"
                style={{
                  width: 43,
                  height: 43,
                  flexShrink: 0,
                  border: "none",
                  borderRadius: 13,
                  background:
                    sending || !message.trim()
                      ? "var(--border-soft)"
                      : "linear-gradient(135deg, #22E5C9, #2F86FF)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor:
                    sending || !message.trim()
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                <Send size={17} />
              </button>
            </div>

            <div
              style={{
                textAlign: "center",
                fontFamily: "Vazirmatn",
                fontSize: 9,
                color: "var(--text-lo)",
                marginTop: 7,
              }}
            >
              پاسخ پشتیبانی در همین چت نمایش داده می‌شود.
            </div>
          </form>
        </div>
      )}
    </>
  );
}
