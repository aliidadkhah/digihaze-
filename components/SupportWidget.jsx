"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Headphones,
  ChevronLeft,
} from "lucide-react";

// رنگ‌های اصلی ویجت پشتیبانی (طلایی/زرد مطابق طرح)
const GOLD = "#FFC531";
const GOLD_DARK = "#F0A800";
const INK = "#241D08";

const FAQ_CATEGORIES = [
  "سوالات عمومی",
  "سوالات مربوط به ضمانت کالا",
  "سوالات مربوط به دستگاه",
  "سوالات مربوط به جویس و سالت",
  "سوالات مربوط به کویل",
];

export default function SupportWidget() {
  const [open, setOpen] = useState(false);

  const [conversationId, setConversationId] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // نمایش مستقیم فرم پیام (رد شدن از منوی سوالات متداول)
  const [showForm, setShowForm] = useState(false);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

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

  // وقتی گفتگویی شروع شده، همیشه حالت فرم/چت نمایش داده شود
  useEffect(() => {
    if (conversationId) {
      setShowForm(true);
    }
  }, [conversationId]);

  const handleCategoryClick = (label) => {
    setMessage((prev) =>
      prev
        ? prev
        : `سلام، سوال من درباره «${label}» است:\n`
    );

    setShowForm(true);

    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 50);
  };

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

  const hasConversationStarted =
    messages.length > 0 || !!conversationId;

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
              color: INK,
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`,
              padding: "4px 12px",
              borderRadius: 999,
              boxShadow: "0 6px 18px rgba(240,168,0,0.35)",
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
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`,
            color: INK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 8px 30px rgba(240,168,0,0.45)",
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
          {/* هدر زرد */}
          <div
            style={{
              padding: "16px 16px 20px",
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`,
              flexShrink: 0,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              {/* آواتار پشتیبان‌ها (راست) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row-reverse",
                }}
              >
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "rgba(36,29,8,0.15)",
                      border: "2px solid rgba(255,255,255,0.85)",
                      marginRight: i === 0 ? 0 : -12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: INK,
                      flexShrink: 0,
                    }}
                  >
                    <Headphones size={15} />
                  </div>
                ))}
              </div>

              {/* دکمه بستن (چپ) */}
              <button
                onClick={() => setOpen(false)}
                aria-label="بستن پشتیبانی"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(36,29,8,0.12)",
                  color: INK,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ marginTop: 10, textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "Vazirmatn",
                  fontWeight: 800,
                  fontSize: 17,
                  color: INK,
                }}
              >
                پشتیبانی سایت
              </div>

              <div
                style={{
                  fontFamily: "Vazirmatn",
