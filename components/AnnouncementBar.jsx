"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";

const DISMISS_KEY = "digihaze_announcement_dismissed";

export default function AnnouncementBar() {
  const [settings, setSettings] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!settings?.announcement_text) return;

    try {
      const stored = window.localStorage.getItem(DISMISS_KEY);
      // اگر متن اطلاعیه عوض بشه، دوباره برای همه نمایش داده می‌شود
      if (stored === settings.announcement_text) {
        setDismissed(true);
      }
    } catch {
      // localStorage در دسترس نیست، مشکلی نیست
    }
  }, [settings]);

  if (
    !settings ||
    !settings.announcement_active ||
    !settings.announcement_text?.trim() ||
    dismissed
  ) {
    return null;
  }

  const color = settings.announcement_color || "#2F86FF";

  const close = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, settings.announcement_text);
    } catch {
      // ignore
    }
  };

  return (
    <div
      style={{
        background: color,
        color: "var(--ink)",
        position: "relative",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "10px 44px 10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          textAlign: "center",
        }}
      >
        <Megaphone size={15} style={{ flexShrink: 0 }} />

        <span
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 700,
            fontSize: 12.5,
          }}
        >
          {settings.announcement_text}
        </span>
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="بستن اطلاعیه"
        style={{
          position: "absolute",
          top: "50%",
          left: 14,
          transform: "translateY(-50%)",
          background: "rgba(0,0,0,0.12)",
          border: "none",
          borderRadius: "50%",
          width: 22,
          height: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "inherit",
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}
