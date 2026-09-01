"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

export function Badge({ children, bg = "#2F86FF" }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: bg,
        color: "var(--ink)",
      }}
    >
      {children}
    </span>
  );
}

export function Stars({ rating, size = 14 }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= Math.round(rating) ? "#C6FF3D" : "none"}
          stroke={i <= Math.round(rating) ? "#C6FF3D" : "var(--text-lo)"}
        />
      ))}
    </span>
  );
}

/* scroll-triggered reveal via IntersectionObserver */
export function Reveal({ children, delay = 0, y = 26, style = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="scroll-reveal"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Countdown({ target, color = "#C6FF3D" }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    setLeft(target - Date.now());
    const t = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <div style={{ display: "flex", gap: 6, direction: "ltr" }}>
      {[h, m, s].map((v, i) => (
        <span
          key={i}
          style={{
            background: "var(--ink)",
            color,
            border: `1px solid ${color}55`,
            borderRadius: 8,
            padding: "4px 8px",
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 13,
            minWidth: 30,
            textAlign: "center",
          }}
        >
          {pad(v)}
        </span>
      ))}
    </div>
  );
}

export const inputStyle = {
  background: "var(--surface)",
  border: "1px solid var(--surface2)",
  borderRadius: 12,
  padding: "13px 16px",
  color: "var(--text-hi)",
  fontFamily: "Vazirmatn",
  fontSize: 13.5,
  outline: "none",
};

export function navArrowStyle(side) {
  return {
    position: "absolute",
    top: "50%",
    [side]: 12,
    transform: "translateY(-50%)",
    background: "#F5F1FFcc",
    border: "none",
    borderRadius: "50%",
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
}

export const qtyBtnStyle = {
  background: "none",
  border: "none",
  width: 36,
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "var(--text-hi)",
};
