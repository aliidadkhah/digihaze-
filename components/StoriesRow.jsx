"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Volume2, VolumeX, ShoppingBag } from "lucide-react";

const SEEN_KEY = "dh_story_seen";

function readSeen() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function writeSeen(map) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(map));
  } catch {}
}

/* =========================================================
   ردیف دایره‌های استوری + نمایشگر تمام‌صفحه
========================================================= */
export default function StoriesRow() {
  const [groups, setGroups] = useState([]);
  const [seen, setSeen] = useState({});
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    setSeen(readSeen());

    fetch("/api/stories", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => setGroups(json.groups || []))
      .catch(() => {});
  }, []);

  const markSeen = useCallback((groupId, count) => {
    setSeen((prev) => {
      if ((prev[groupId] || 0) >= count) return prev;
      const next = { ...prev, [groupId]: count };
      writeSeen(next);
      return next;
    });
  }, []);

  if (groups.length === 0) return null;

  return (
    <section
      aria-label="استوری‌ها"
      style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 20px 0" }}
    >
      <div
        className="stories-scroll"
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          padding: "4px 2px 8px",
        }}
      >
        {groups.map((g, i) => {
          const unseen = (seen[g.id] || 0) < g.items.length;

          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`مشاهده استوری ${g.title}`}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 7,
                flexShrink: 0,
                width: 78,
              }}
            >
              <span
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  padding: 3,
                  background: unseen
                    ? "linear-gradient(135deg, #FF7A1F, #9B5CFF, #4F7FFF)"
                    : "var(--surface2)",
                  display: "block",
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    border: "3px solid var(--bg)",
                    background: "var(--surface2)",
                    overflow: "hidden",
                  }}
                >
                  {g.cover_url && (
                    <img
                      src={g.cover_url}
                      alt=""
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  )}
                </span>
              </span>
              <span
                style={{
                  fontFamily: "var(--font-primary)",
                  fontSize: 12,
                  color: unseen ? "var(--text-hi)" : "var(--text-mut)",
                  fontWeight: unseen ? 700 : 500,
                  maxWidth: 78,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {g.title}
              </span>
            </button>
          );
        })}
      </div>

      <style>{`
        .stories-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .stories-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {openIndex !== null && (
        <StoryViewer
          groups={groups}
          startIndex={openIndex}
          onSeen={markSeen}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </section>
  );
}

/* =========================================================
   نمایشگر تمام‌صفحه
========================================================= */
function StoryViewer({ groups, startIndex, onSeen, onClose }) {
  const [gi, setGi] = useState(startIndex);
  const [ii, setIi] = useState(0);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  const videoRef = useRef(null);
  const press = useRef({ x: 0, y: 0, t: 0, timer: null, held: false });

  const group = groups[gi];
  const item = group?.items?.[ii];

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // گروه دیده‌شده رو علامت بزن
  useEffect(() => {
    if (group) onSeen(group.id, ii + 1);
  }, [group, ii, onSeen]);

  const next = useCallback(() => {
    setProgress(0);
    if (ii < group.items.length - 1) {
      setIi(ii + 1);
    } else if (gi < groups.length - 1) {
      setGi(gi + 1);
      setIi(0);
    } else {
      onClose();
    }
  }, [ii, gi, group, groups.length, onClose]);

  const prev = useCallback(() => {
    setProgress(0);
    if (ii > 0) {
      setIi(ii - 1);
    } else if (gi > 0) {
      setGi(gi - 1);
      setIi(0);
    } else if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [ii, gi]);

  // توقف/ادامه
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused, gi, ii]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted, gi, ii]);

  // ---------- لمس ----------
  const onPointerDown = (e) => {
    const p = press.current;
    p.x = e.clientX;
    p.y = e.clientY;
    p.t = Date.now();
    p.held = false;
    clearTimeout(p.timer);
    p.timer = setTimeout(() => {
      p.held = true;
      setPaused(true);
    }, 220);
  };

  const onPointerUp = (e) => {
    const p = press.current;
    clearTimeout(p.timer);

    if (p.held) {
      setPaused(false);
      return;
    }

    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;

    // کشیدن به پایین = بستن
    if (dy > 90 && Math.abs(dx) < 70) {
      onClose();
      return;
    }

    // لمس ساده: چپ = بعدی، راست = قبلی (جهت راست‌به‌چپ)
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeft = e.clientX - rect.left < rect.width / 2;
    if (isLeft) next();
    else prev();
  };

  const onPointerCancel = () => {
    clearTimeout(press.current.timer);
    if (press.current.held) setPaused(false);
  };

  if (!mounted || !group || !item) return null;

  // آماده‌سازی ویدیوی بعدی
  const upcoming =
    group.items[ii + 1]?.url || groups[gi + 1]?.items?.[0]?.url || null;

  const isInternal = item.link?.startsWith("/");

  const productBtnStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    color: "#0B0E14",
    borderRadius: 999,
    padding: "12px 22px",
    fontFamily: "var(--font-primary)",
    fontWeight: 800,
    fontSize: 14,
    textDecoration: "none",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  };

  const roundBtn = {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.45)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`استوری ${group.title}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10050,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        direction: "rtl",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "min(100vw, calc(100dvh * 9 / 16))",
          height: "100dvh",
          background: "#000",
          overflow: "hidden",
        }}
      >
        {/* ویدیو + لایه‌ی لمس */}
        <video
          key={`${gi}-${ii}`}
          ref={videoRef}
          src={item.url}
          autoPlay
          muted={muted}
          playsInline
          preload="auto"
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration) setProgress(v.currentTime / v.duration);
          }}
          onEnded={next}
          onError={next}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />

        <div
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          style={{ position: "absolute", inset: 0, touchAction: "none", zIndex: 1 }}
        />

        {upcoming && (
          <video src={upcoming} preload="auto" muted style={{ display: "none" }} />
        )}

        {/* بالای صفحه: نوار پیشرفت و عنوان */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            padding: "14px 12px 30px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)",
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {group.items.map((_, i) => (
              <div
                key={i}
                style={{ flex: 1, height: 3, borderRadius: 3, background: "rgba(255,255,255,0.3)", overflow: "hidden" }}
              >
                <div
                  style={{
                    height: "100%",
                    background: "#fff",
                    width: i < ii ? "100%" : i === ii ? `${Math.min(progress, 1) * 100}%` : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                overflow: "hidden",
                background: "var(--surface2)",
                flexShrink: 0,
              }}
            >
              {group.cover_url && (
                <img src={group.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              )}
            </span>
            <span style={{ color: "#fff", fontFamily: "var(--font-primary)", fontWeight: 700, fontSize: 14 }}>
              {group.title}
            </span>
          </div>
        </div>

        {/* دکمه‌ها (بالاتر از لایه‌ی لمس) */}
        <div style={{ position: "absolute", top: 40, left: 12, zIndex: 3, display: "flex", gap: 8 }}>
          <button type="button" aria-label={muted ? "پخش با صدا" : "بی‌صدا"} onClick={() => setMuted((m) => !m)} style={roundBtn}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button type="button" aria-label="بستن" onClick={onClose} style={roundBtn}>
            <X size={18} />
          </button>
        </div>

        {/* دکمه‌ی مشاهده محصول */}
        {item.link && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 3,
              padding: "40px 16px 28px",
              display: "flex",
              justifyContent: "center",
              background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
              pointerEvents: "none",
            }}
          >
            <span style={{ pointerEvents: "auto" }}>
              {isInternal ? (
                <Link href={item.link} onClick={onClose} style={productBtnStyle}>
                  <ShoppingBag size={16} /> مشاهده محصول
                </Link>
              ) : (
                <a href={item.link} target="_blank" rel="noopener noreferrer" style={productBtnStyle}>
                  <ShoppingBag size={16} /> مشاهده محصول
                </a>
              )}
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
