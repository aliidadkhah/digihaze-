"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  Users,
  UserPlus,
  Layers,
  Percent,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  Download,
  EyeOff,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// ---------------------------------------------------------------
// ابزارهای فرمت‌دهی
// ---------------------------------------------------------------
const NO_TRACK_KEY = "dh_no_track";

function fa(n, digits = 0) {
  return Number(n || 0).toLocaleString("fa-IR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function pctOf(a, b) {
  return b > 0 ? (a / b) * 100 : 0;
}

function delta(cur, prev) {
  if (!prev) return cur > 0 ? { pct: null, dir: "up" } : { pct: 0, dir: "flat" };
  const pct = ((cur - prev) / prev) * 100;
  return { pct, dir: pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat" };
}

// "2026-10-23T14:00" → Date (بدون جابجایی منطقه‌ی زمانی)
function parseBucket(b) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(b || "");
  if (!m) return new Date(0);
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
}

const dayFmt = new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric", timeZone: "UTC" });
const dayLongFmt = new Intl.DateTimeFormat("fa-IR", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

function labelBucket(b, gran, long = false) {
  const d = parseBucket(b);
  if (gran === "hour") return `ساعت ${fa(d.getUTCHours())}`;
  return (long ? dayLongFmt : dayFmt).format(d);
}

const CHANNEL_LABELS = {
  direct: "مستقیم",
  organic: "جستجوی گوگل و موتورهای جستجو",
  social: "شبکه‌های اجتماعی",
  referral: "ارجاع از سایت‌های دیگه",
  paid: "تبلیغات پولی",
  email: "ایمیل",
  campaign: "کمپین (UTM)",
};
const CHANNEL_COLORS = {
  direct: "#4F7FFF",
  organic: "#2FBF71",
  social: "#9B5CFF",
  referral: "#FF7A1F",
  paid: "#FF5C5C",
  email: "#16B8C8",
  campaign: "#E5B800",
};
const DEVICE_LABELS = { mobile: "موبایل", desktop: "دسکتاپ", tablet: "تبلت" };
const DEVICE_COLORS = { mobile: "#4F7FFF", desktop: "#9B5CFF", tablet: "#FF7A1F" };
const PAGE_TYPE_LABELS = {
  home: "صفحه اصلی",
  product: "صفحه محصول",
  shop: "فروشگاه و دسته‌ها",
  content: "بلاگ و راهنمای خرید",
  cart: "سبد خرید",
  checkout: "تسویه حساب",
  order_success: "سفارش موفق",
  other: "سایر",
};
const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

let regionNames = null;
function countryName(code) {
  if (!code || code === "unknown") return "نامشخص";
  try {
    if (!regionNames) regionNames = new Intl.DisplayNames(["fa"], { type: "region" });
    return regionNames.of(code) || code;
  } catch {
    return code;
  }
}
function flag(code) {
  if (!code || code.length !== 2 || code === "unknown") return "🌐";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

function prettyPath(p) {
  let s = p || "/";
  try {
    s = decodeURIComponent(s);
  } catch {}
  return s;
}

// ---------------------------------------------------------------
// استایل‌های مشترک
// ---------------------------------------------------------------
const card = {
  background: "var(--surface)",
  border: "1px solid var(--surface2)",
  borderRadius: 14,
  padding: 16,
};
const cardTitle = { fontWeight: 700, fontSize: 13.5, marginBottom: 12 };
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
  fontSize: 13,
};
const pill = (active) => ({
  background: active ? "#4F7FFF" : "var(--surface2)",
  color: active ? "#fff" : "var(--text-hi)",
  border: "none",
  borderRadius: 999,
  padding: "7px 14px",
  cursor: "pointer",
  fontFamily: "var(--font-primary)",
  fontSize: 12.5,
  fontWeight: active ? 700 : 500,
});
const dateInput = {
  background: "var(--surface2)",
  border: "1px solid var(--surface2)",
  borderRadius: 10,
  padding: "6px 10px",
  color: "var(--text-hi)",
  fontFamily: "var(--font-primary)",
  fontSize: 12.5,
};
const muted = { color: "var(--text-mut)", fontSize: 12.5 };

// ---------------------------------------------------------------
// کامپوننت‌های کوچک
// ---------------------------------------------------------------
function useWidth(ref) {
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const update = () => setW(Math.max(260, el.clientWidth));
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function DeltaBadge({ cur, prev, invert = false }) {
  const d = delta(cur, prev);
  if (d.dir === "flat") {
    return <span style={{ ...muted, fontSize: 11.5 }}>بدون تغییر</span>;
  }
  const good = invert ? d.dir === "down" : d.dir === "up";
  const color = good ? "#2FBF71" : "#FF5C5C";
  const Icon = d.dir === "up" ? TrendingUp : TrendingDown;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11.5,
        fontWeight: 700,
        color,
        background: `${color}1f`,
        borderRadius: 999,
        padding: "2px 8px",
      }}
    >
      <Icon size={12} />
      {d.pct === null ? "جدید" : `${fa(Math.abs(d.pct), 1)}٪`}
    </span>
  );
}

function KpiCard({ icon, label, value, suffix, cur, prev, invert, hint }) {
  return (
    <div style={{ ...card, flex: "1 1 170px", minWidth: 160 }} title={hint}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, ...muted, marginBottom: 10 }}>
        {icon}
        {label}
      </div>
      <div style={{ fontWeight: 800, fontSize: 24, color: "var(--text-hi)", marginBottom: 6 }}>
        {value}
        {suffix && (
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-mut)", marginRight: 4 }}>
            {suffix}
          </span>
        )}
      </div>
      <DeltaBadge cur={cur} prev={prev} invert={invert} />
    </div>
  );
}

function TrendChart({ series, metric, gran }) {
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef);
  const [hover, setHover] = useState(null);

  const height = 250;
  const pad = { top: 16, right: 12, bottom: 28, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const key = metric;
  const prevKey = "p" + metric;
  const maxVal = Math.max(1, ...series.map((s) => Math.max(s[key], s[prevKey])));
  const niceMax = (() => {
    const pow = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const n = maxVal / pow;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * pow;
  })();

  const x = (i) => pad.left + (series.length <= 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const y = (v) => pad.top + innerH - (v / niceMax) * innerH;

  const line = (k) => series.map((s, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(s[k]).toFixed(1)}`).join(" ");
  const area =
    series.length > 1
      ? `${line(key)} L${x(series.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
      : "";

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * niceMax);
  const labelEvery = Math.max(1, Math.ceil(series.length / Math.max(2, Math.floor(innerW / 70))));

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rel = clientX - rect.left - pad.left;
    const idx = Math.round((rel / innerW) * (series.length - 1));
    setHover(Math.min(series.length - 1, Math.max(0, idx)));
  };

  const hv = hover !== null ? series[hover] : null;

  return (
    <div ref={wrapRef} style={{ position: "relative", direction: "ltr" }}>
      <svg
        width={width}
        height={height}
        onMouseMove={onMove}
        onTouchMove={onMove}
        onMouseLeave={() => setHover(null)}
        onTouchEnd={() => setHover(null)}
        style={{ display: "block", touchAction: "pan-y" }}
      >
        <defs>
          <linearGradient id="am-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F7FFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4F7FFF" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--surface2)" strokeWidth="1" />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize="10.5" fill="var(--text-faint)">
              {fa(Math.round(t))}
            </text>
          </g>
        ))}

        {series.map((s, i) =>
          i % labelEvery === 0 ? (
            <text key={s.b} x={x(i)} y={height - 8} textAnchor="middle" fontSize="10.5" fill="var(--text-faint)">
              {gran === "hour" ? fa(parseBucket(s.b).getUTCHours()) : dayFmt.format(parseBucket(s.b))}
            </text>
          ) : null
        )}

        {area && <path d={area} fill="url(#am-area)" />}
        {series.length > 1 && (
          <path d={line(prevKey)} fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeDasharray="4 4" />
        )}
        {series.length > 1 ? (
          <path d={line(key)} fill="none" stroke="#4F7FFF" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        ) : (
          series.map((s, i) => <circle key={i} cx={x(i)} cy={y(s[key])} r="4" fill="#4F7FFF" />)
        )}

        {hv && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke="var(--text-faint)" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(hv[key])} r="5" fill="#4F7FFF" stroke="var(--surface)" strokeWidth="2" />
          </g>
        )}
      </svg>

      {hv && (
        <div
          style={{
            position: "absolute",
            top: 6,
            left: Math.min(Math.max(x(hover) - 80, 4), width - 170),
            width: 160,
            direction: "rtl",
            background: "var(--surface2)",
            border: "1px solid var(--text-faint)",
            borderRadius: 10,
            padding: "8px 10px",
            fontSize: 12,
            pointerEvents: "none",
            color: "var(--text-hi)",
            boxShadow: "0 6px 20px rgba(0,0,0,.25)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{labelBucket(hv.b, gran, true)}</div>
          <div>
            <span style={{ color: "#4F7FFF" }}>●</span> {fa(hv[key])}
          </div>
          <div style={{ color: "var(--text-mut)" }}>
            <span>○</span> دوره‌ی قبل: {fa(hv[prevKey])}
          </div>
        </div>
      )}
    </div>
  );
}

function Heatmap({ cells }) {
  const grid = useMemo(() => {
    const g = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;
    for (const c of cells) {
      g[c.d][c.h] = c.v;
      if (c.v > max) max = c.v;
    }
    return { g, max };
  }, [cells]);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 560, direction: "ltr" }}>
        {grid.g.map((row, d) => (
          <div key={d} style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
            <div style={{ width: 62, fontSize: 11, color: "var(--text-mut)", textAlign: "right", paddingRight: 6, direction: "rtl" }}>
              {WEEKDAYS[d]}
            </div>
            {row.map((v, h) => (
              <div
                key={h}
                title={`${WEEKDAYS[d]} ساعت ${fa(h)}: ${fa(v)} بازدید`}
                style={{
                  flex: 1,
                  height: 20,
                  borderRadius: 4,
                  background: v === 0 ? "var(--surface2)" : "#4F7FFF",
                  opacity: v === 0 ? 0.5 : 0.18 + 0.82 * (v / grid.max),
                }}
              />
            ))}
          </div>
        ))}
        <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
          <div style={{ width: 62 }} />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} style={{ flex: 1, textAlign: "center", fontSize: 9.5, color: "var(--text-faint)" }}>
              {h % 3 === 0 ? fa(h) : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarList({ items, total, color = "#4F7FFF", empty = "هنوز داده‌ای ثبت نشده.", ltr = false }) {
  if (!items.length) return <p style={{ ...muted, margin: 0 }}>{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((it, idx) => (
        <div
          key={`${it.label}-${idx}`}
          style={{
            position: "relative",
            borderRadius: 8,
            overflow: "hidden",
            background: "var(--surface2)",
            minHeight: 32,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${(it.value / max) * 100}%`,
              background: it.color || color,
              opacity: 0.22,
              right: 0,
              left: "auto",
            }}
          />
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "6px 10px",
              fontSize: 12.5,
            }}
          >
            <span
              dir={ltr ? "ltr" : "rtl"}
              title={it.label}
              style={{
                color: "var(--text-hi)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
                textAlign: ltr ? "left" : "right",
              }}
            >
              {it.prefix}
              {it.label}
            </span>
            <span style={{ fontWeight: 700, color: "var(--text-hi)", flexShrink: 0 }}>
              {fa(it.value)}
              {total > 0 && (
                <span style={{ fontWeight: 500, color: "var(--text-mut)", marginRight: 6, fontSize: 11 }}>
                  {fa(pctOf(it.value, total))}٪
                </span>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Donut({ items }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (!total) return <p style={{ ...muted, margin: 0 }}>هنوز داده‌ای ثبت نشده.</p>;

  const r = 44;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
        <g transform="rotate(-90 60 60)">
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface2)" strokeWidth="16" />
          {items.map((it, i) => {
            const len = (it.value / total) * c;
            const el = (
              <circle
                key={i}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={it.color}
                strokeWidth="16"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </g>
        <text x="60" y="64" textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--text-hi)">
          {fa(total)}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, minWidth: 150 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: it.color, flexShrink: 0 }} />
            <span style={{ color: "var(--text-hi)", flex: 1 }}>{it.label}</span>
            <span style={{ fontWeight: 700, color: "var(--text-hi)" }}>{fa(it.value)}</span>
            <span style={{ color: "var(--text-mut)", fontSize: 11, minWidth: 34, textAlign: "left" }}>
              {fa(pctOf(it.value, total))}٪
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Funnel({ funnel }) {
  const steps = [
    { label: "بازدید از صفحه محصول", value: funnel.product, color: "#4F7FFF" },
    { label: "ورود به سبد خرید", value: funnel.cart, color: "#9B5CFF" },
    { label: "ورود به تسویه حساب", value: funnel.checkout, color: "#FF7A1F" },
    { label: "سفارش موفق", value: funnel.success, color: "#2FBF71" },
  ];
  const first = Math.max(1, steps[0].value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {steps.map((s, i) => {
        const prev = i === 0 ? null : steps[i - 1].value;
        return (
          <div key={s.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
              <span style={{ color: "var(--text-hi)" }}>{s.label}</span>
              <span style={{ color: "var(--text-hi)", fontWeight: 700 }}>
                {fa(s.value)} نشست
                <span style={{ color: "var(--text-mut)", fontWeight: 500, marginRight: 6, fontSize: 11 }}>
                  {fa(pctOf(s.value, first), 1)}٪ از شروع
                </span>
              </span>
            </div>
            <div style={{ height: 14, borderRadius: 7, background: "var(--surface2)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(s.value > 0 ? 2 : 0, (s.value / first) * 100)}%`,
                  background: s.color,
                  borderRadius: 7,
                  marginRight: 0,
                  marginLeft: "auto",
                }}
              />
            </div>
            {prev !== null && prev > 0 && (
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 3 }}>
                {fa(pctOf(s.value, prev), 1)}٪ از مرحله‌ی قبل ادامه دادن
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Sparkbars({ values }) {
  const max = Math.max(1, ...values);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 36, direction: "ltr" }}>
      {values.map((v, i) => (
        <div
          key={i}
          title={`${fa(values.length - 1 - i)} دقیقه پیش: ${fa(v)} بازدید`}
          style={{
            flex: 1,
            height: Math.max(2, (v / max) * 36),
            background: "#2FBF71",
            opacity: v > 0 ? 0.9 : 0.2,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------
// کامپوننت اصلی
// ---------------------------------------------------------------
const RANGES = [
  { id: "today", label: "امروز" },
  { id: "yesterday", label: "دیروز" },
  { id: "7d", label: "۷ روز" },
  { id: "30d", label: "۳۰ روز" },
  { id: "90d", label: "۹۰ روز" },
  { id: "custom", label: "بازه‌ی دلخواه" },
];
const METRICS = [
  { id: "views", label: "بازدید صفحه" },
  { id: "visitors", label: "بازدیدکننده‌ی یکتا" },
  { id: "sessions", label: "نشست" },
];

function isoDay(offsetDays = 0) {
  const d = new Date(Date.now() + 3.5 * 3600 * 1000 - offsetDays * 86400 * 1000);
  return d.toISOString().slice(0, 10);
}

export default function AnalyticsManager() {
  const [range, setRange] = useState("7d");
  const [customFrom, setCustomFrom] = useState(isoDay(6));
  const [customTo, setCustomTo] = useState(isoDay(0));
  const [metric, setMetric] = useState("views");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  const [live, setLive] = useState(null);
  const [excluded, setExcluded] = useState(false);

  const getToken = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData?.session?.access_token;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setHint("");
    try {
      const token = await getToken();
      const qs = new URLSearchParams({ range });
      if (range === "custom") {
        qs.set("from", customFrom);
        qs.set("to", customTo);
      }
      const res = await fetch(`/api/admin/analytics?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "خطا در دریافت آمار");
        setHint(json.hint || "");
        return;
      }
      setData(json);
    } catch (e) {
      setError(e.message || "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  }, [range, customFrom, customTo]);

  const loadLive = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/analytics?realtime=1", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) setLive(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (range === "custom" && (!customFrom || !customTo)) return;
    load();
  }, [load, range, customFrom, customTo]);

  // آمار زنده هر ۳۰ ثانیه تازه می‌شه
  useEffect(() => {
    loadLive();
    const t = setInterval(loadLive, 30000);
    return () => clearInterval(t);
  }, [loadLive]);

  useEffect(() => {
    try {
      setExcluded(localStorage.getItem(NO_TRACK_KEY) === "1");
    } catch {}
  }, []);

  const toggleExclude = () => {
    try {
      if (excluded) localStorage.removeItem(NO_TRACK_KEY);
      else localStorage.setItem(NO_TRACK_KEY, "1");
      setExcluded(!excluded);
    } catch {}
  };

  const gran = data?.meta?.gran || "day";
  const kpi = data?.kpi;
  const prev = data?.kpi_prev;

  const derived = useMemo(() => {
    if (!kpi || !prev) return null;
    const pps = kpi.sessions ? kpi.views / kpi.sessions : 0;
    const ppsPrev = prev.sessions ? prev.views / prev.sessions : 0;
    const bounce = pctOf(kpi.bounces, kpi.sessions);
    const bouncePrev = pctOf(prev.bounces, prev.sessions);
    return {
      pps,
      ppsPrev,
      bounce,
      bouncePrev,
      returning: Math.max(0, kpi.visitors - kpi.new_visitors),
    };
  }, [kpi, prev]);

  // نکته‌ی تحلیلی: پربازدیدترین زمان هفته
  const peak = useMemo(() => {
    if (!data?.heatmap?.length) return null;
    const best = data.heatmap.reduce((a, b) => (b.v > a.v ? b : a));
    return best.v > 0 ? best : null;
  }, [data]);

  const exportCsv = () => {
    if (!data) return;
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [];
    lines.push(["بازه", data.meta.from, data.meta.to].map(esc).join(","));
    lines.push("");
    lines.push(["تاریخ/ساعت", "بازدید", "بازدیدکننده", "نشست"].map(esc).join(","));
    data.series.forEach((s) => lines.push([s.b, s.views, s.visitors, s.sessions].map(esc).join(",")));
    lines.push("");
    lines.push(["صفحه", "بازدید", "بازدیدکننده"].map(esc).join(","));
    data.top_pages.forEach((p) => lines.push([p.page, p.views, p.visitors].map(esc).join(",")));
    lines.push("");
    lines.push(["منبع ورود", "نشست"].map(esc).join(","));
    data.channels.forEach((c) => lines.push([CHANNEL_LABELS[c.k] || c.k, c.n].map(esc).join(",")));

    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `digihaze-analytics-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sourceItems = (data?.channels || []).map((c) => ({
    label: CHANNEL_LABELS[c.k] || c.k,
    value: c.n,
    color: CHANNEL_COLORS[c.k] || "#8a8fa0",
  }));
  const deviceItems = (data?.devices || []).map((d) => ({
    label: DEVICE_LABELS[d.k] || d.k,
    value: d.n,
    color: DEVICE_COLORS[d.k] || "#8a8fa0",
  }));
  const sessionsWithMeta = sourceItems.reduce((s, i) => s + i.value, 0);

  const depthOrder = ["1", "2", "3", "4-5", "6+"];
  const depthItems = depthOrder
    .map((k) => {
      const f = (data?.depth || []).find((d) => d.k === k);
      return { label: `${k.replace("-", " تا ")} صفحه`, value: f ? f.n : 0 };
    })
    .filter((i) => i.value > 0);

  const empty = data && kpi && kpi.views === 0;

  return (
    <div dir="rtl">
      {/* نوار کنترل */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setRange(r.id)} style={pill(range === r.id)}>
              {r.label}
            </button>
          ))}
        </div>
        <button onClick={exportCsv} style={smallBtn} disabled={!data}>
          <Download size={14} />
          خروجی CSV
        </button>
        <button onClick={load} style={smallBtn}>
          {loading ? <Loader2 size={14} className="am-spin" /> : <RefreshCw size={14} />}
          به‌روزرسانی
        </button>
      </div>

      {range === "custom" && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
          <span style={muted}>از</span>
          <input type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} style={dateInput} />
          <span style={muted}>تا</span>
          <input type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} style={dateInput} />
          <span style={{ ...muted, fontSize: 11.5 }}>(تاریخ‌ها میلادی و به وقت تهران)</span>
        </div>
      )}

      {error && (
        <div
          style={{
            color: "#FF5C5C",
            background: "#FF5C5C22",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 12.5,
            marginBottom: 16,
          }}
        >
          <div>{error}</div>
          {hint && <div style={{ marginTop: 4, color: "var(--text-mut)" }}>{hint}</div>}
        </div>
      )}

      {/* آنلاین‌ها */}
      {live && (
        <div style={{ ...card, marginBottom: 14, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 190 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "#2FBF71",
                boxShadow: "0 0 0 0 #2FBF71aa",
                animation: "am-pulse 1.8s infinite",
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: 22, color: "var(--text-hi)" }}>
                {fa(live.active_5m)} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-mut)" }}>نفر آنلاین</span>
              </div>
              <div style={{ ...muted, fontSize: 11.5 }}>فعال در ۵ دقیقه‌ی اخیر</div>
            </div>
          </div>
          <div style={{ flex: "1 1 200px", minWidth: 180 }}>
            <Sparkbars values={live.per_minute || []} />
            <div style={{ ...muted, fontSize: 11, marginTop: 4 }}>
              بازدید ۳۰ دقیقه‌ی اخیر: {fa(live.views_30m)}
            </div>
          </div>
          <div style={{ flex: "2 1 260px", minWidth: 220 }}>
            <div style={{ ...muted, marginBottom: 6, fontSize: 11.5 }}>صفحاتی که الان باز هستن</div>
            {(live.pages || []).length === 0 && <span style={{ ...muted, fontSize: 12 }}>الان کسی روی سایت نیست.</span>}
            {(live.pages || []).map((p) => (
              <div key={p.page} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, padding: "2px 0" }}>
                <span dir="ltr" style={{ color: "var(--text-hi)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {prettyPath(p.page)}
                </span>
                <span style={{ color: "#2FBF71", fontWeight: 700 }}>{fa(p.n)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && !data && <p style={{ color: "var(--text-mut)" }}>در حال بارگذاری...</p>}

      {data && kpi && prev && derived && (
        <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity .2s" }}>
          {/* شاخص‌های اصلی */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <KpiCard
              icon={<Eye size={14} />}
              label="بازدید صفحه"
              value={fa(kpi.views)}
              cur={kpi.views}
              prev={prev.views}
              hint="تعداد کل صفحاتی که دیده شده"
            />
            <KpiCard
              icon={<Users size={14} />}
              label="بازدیدکننده‌ی یکتا"
              value={fa(kpi.visitors)}
              cur={kpi.visitors}
              prev={prev.visitors}
              hint="تعداد مرورگرهای متفاوتی که سایت رو دیدن"
            />
            <KpiCard
              icon={<Activity size={14} />}
              label="نشست"
              value={fa(kpi.sessions)}
              cur={kpi.sessions}
              prev={prev.sessions}
              hint="هر بار حضور پیوسته‌ی یک کاربر؛ بعد از ۳۰ دقیقه بی‌فعالیتی نشست جدید حساب می‌شه"
            />
            <KpiCard
              icon={<UserPlus size={14} />}
              label="بازدیدکننده‌ی جدید"
              value={fa(kpi.new_visitors)}
              suffix={`از ${fa(kpi.visitors)}`}
              cur={kpi.new_visitors}
              prev={prev.new_visitors}
              hint="کسانی که اولین بار سایت رو می‌بینن"
            />
            <KpiCard
              icon={<Layers size={14} />}
              label="صفحه در هر نشست"
              value={fa(derived.pps, 2)}
              cur={derived.pps}
              prev={derived.ppsPrev}
              hint="میانگین تعداد صفحاتی که هر کاربر می‌بینه"
            />
            <KpiCard
              icon={<Percent size={14} />}
              label="نرخ خروج فوری"
              value={`${fa(derived.bounce, 1)}٪`}
              cur={derived.bounce}
              prev={derived.bouncePrev}
              invert
              hint="درصد نشست‌هایی که فقط یک صفحه دیدن و رفتن (کمتر بهتره)"
            />
          </div>

          {empty && (
            <div style={{ ...card, marginBottom: 14, color: "var(--text-mut)", fontSize: 13 }}>
              توی این بازه هنوز بازدیدی ثبت نشده. اگه تازه مایگریشن رو اجرا کردی، چند دقیقه بعد از اولین بازدیدها دوباره سر بزن.
            </div>
          )}

          {/* نمودار روند */}
          <div style={{ ...card, marginBottom: 14, padding: "16px 12px 10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12, padding: "0 4px" }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                روند {gran === "hour" ? "ساعتی" : "روزانه"}
                <span style={{ ...muted, fontSize: 11.5, marginRight: 8 }}>(خط‌چین: دوره‌ی قبل)</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {METRICS.map((m) => (
                  <button key={m.id} onClick={() => setMetric(m.id)} style={{ ...pill(metric === m.id), padding: "5px 11px", fontSize: 12 }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <TrendChart series={data.series} metric={metric} gran={gran} />
          </div>

          {/* منابع ورود + دستگاه */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 14 }}>
            <div style={card}>
              <div style={cardTitle}>کاربران از کجا میان؟</div>
              <Donut items={sourceItems} />
              {sessionsWithMeta === 0 && kpi.sessions > 0 && (
                <p style={{ ...muted, fontSize: 11.5, marginTop: 10 }}>
                  بازدیدهای قبل از این به‌روزرسانی اطلاعات منبع ندارن؛ از این به بعد ثبت می‌شه.
                </p>
              )}
            </div>
            <div style={card}>
              <div style={cardTitle}>دستگاه کاربران</div>
              <Donut items={deviceItems} />
            </div>
          </div>

          {/* قیف خرید + عمق بازدید */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 14 }}>
            <div style={card}>
              <div style={cardTitle}>قیف خرید</div>
              <Funnel funnel={data.funnel} />
            </div>
            <div style={card}>
              <div style={cardTitle}>هر کاربر چند صفحه می‌بینه؟</div>
              <BarList items={depthItems} total={kpi.sessions} color="#9B5CFF" />
              <div style={{ ...cardTitle, marginTop: 18 }}>نوع صفحات</div>
              <BarList
                items={(data.page_types || []).map((t) => ({ label: PAGE_TYPE_LABELS[t.k] || t.k, value: t.views }))}
                total={kpi.views}
                color="#16B8C8"
              />
            </div>
          </div>

          {/* ساعات پربازدید */}
          <div style={{ ...card, marginBottom: 14 }}>
            <div style={cardTitle}>
              بهترین زمان‌ها (نقشه‌ی حرارتی بازدید)
              {peak && (
                <span style={{ ...muted, fontSize: 11.5, marginRight: 10, fontWeight: 400 }}>
                  اوج بازدید: {WEEKDAYS[peak.d]} ساعت {fa(peak.h)}
                </span>
              )}
            </div>
            <Heatmap cells={data.heatmap} />
          </div>

          {/* صفحات */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 14 }}>
            <div style={card}>
              <div style={cardTitle}>پربازدیدترین صفحات</div>
              <BarList
                ltr
                items={data.top_pages.map((p) => ({ label: prettyPath(p.page), value: p.views }))}
                total={kpi.views}
              />
            </div>
            <div style={card}>
              <div style={cardTitle}>پربازدیدترین محصولات</div>
              <BarList
                ltr
                color="#2FBF71"
                items={data.top_products.map((p) => ({
                  label: prettyPath(p.page.replace(/^\/product\//, "")),
                  value: p.views,
                }))}
                total={0}
                empty="هنوز بازدید محصولی ثبت نشده."
              />
            </div>
            <div style={card}>
              <div style={cardTitle}>صفحات ورودی (اولین صفحه‌ی نشست)</div>
              <BarList
                ltr
                color="#9B5CFF"
                items={data.entry_pages.map((p) => ({ label: prettyPath(p.page), value: p.sessions }))}
                total={kpi.sessions}
              />
            </div>
            <div style={card}>
              <div style={cardTitle}>صفحات خروجی (آخرین صفحه‌ی نشست)</div>
              <BarList
                ltr
                color="#FF7A1F"
                items={data.exit_pages.map((p) => ({ label: prettyPath(p.page), value: p.sessions }))}
                total={kpi.sessions}
              />
            </div>
          </div>

          {/* منابع و فناوری */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 14 }}>
            <div style={card}>
              <div style={cardTitle}>سایت‌های ارجاع‌دهنده</div>
              <BarList
                ltr
                items={data.referrers.map((r) => ({ label: r.k, value: r.n }))}
                total={0}
                empty="ورودی از سایت دیگه‌ای ثبت نشده."
              />
            </div>
            <div style={card}>
              <div style={cardTitle}>کشورها</div>
              <BarList
                color="#16B8C8"
                items={data.countries.map((c) => ({
                  label: countryName(c.k),
                  prefix: `${flag(c.k)}  `,
                  value: c.n,
                }))}
                total={kpi.sessions}
              />
              {data.countries.length > 0 && data.countries.every((c) => c.k === "unknown") && (
                <p style={{ ...muted, fontSize: 11.5, marginTop: 10 }}>
                  اطلاعات کشور از هدر کلادفلر گرفته می‌شه؛ اگه دامنه از پروکسی کلادفلر رد نمی‌شه، نامشخص ثبت می‌شه.
                </p>
              )}
            </div>
            <div style={card}>
              <div style={cardTitle}>مرورگرها</div>
              <BarList items={data.browsers.map((b) => ({ label: b.k, value: b.n }))} total={kpi.sessions} color="#E5B800" ltr />
            </div>
            <div style={card}>
              <div style={cardTitle}>سیستم‌عامل‌ها</div>
              <BarList items={data.os.map((b) => ({ label: b.k, value: b.n }))} total={kpi.sessions} color="#FF5C5C" ltr />
            </div>
          </div>

          {data.campaigns.length > 0 && (
            <div style={{ ...card, marginBottom: 14 }}>
              <div style={cardTitle}>کمپین‌ها (UTM)</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ color: "var(--text-mut)", textAlign: "right" }}>
                      <th style={{ padding: "6px 8px", fontWeight: 500 }}>منبع</th>
                      <th style={{ padding: "6px 8px", fontWeight: 500 }}>مدیوم</th>
                      <th style={{ padding: "6px 8px", fontWeight: 500 }}>کمپین</th>
                      <th style={{ padding: "6px 8px", fontWeight: 500 }}>نشست</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map((c, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "var(--surface2)" : "transparent", color: "var(--text-hi)" }}>
                        <td style={{ padding: "6px 8px" }}>{c.utm_source || "—"}</td>
                        <td style={{ padding: "6px 8px" }}>{c.utm_medium || "—"}</td>
                        <td style={{ padding: "6px 8px" }}>{c.utm_campaign || "—"}</td>
                        <td style={{ padding: "6px 8px", fontWeight: 700 }}>{fa(c.n)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div
            style={{
              ...card,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ ...muted, fontSize: 11.5, lineHeight: 1.9 }}>
              مجموع کل بازدیدهای ثبت‌شده از ابتدا: <b style={{ color: "var(--text-hi)" }}>{fa(data.total_all_time)}</b>
              <br />
              ربات‌ها و مسیرهای پنل ادمین توی آمار حساب نمی‌شن. روزها به وقت تهران محاسبه می‌شن.
            </div>
            <button onClick={toggleExclude} style={smallBtn}>
              <EyeOff size={14} />
              {excluded ? "این مرورگر دوباره حساب بشه" : "این مرورگر از آمار حذف بشه"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .am-spin { animation: am-spin 0.8s linear infinite; }
        @keyframes am-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes am-pulse {
          0% { box-shadow: 0 0 0 0 #2FBF7188; }
          70% { box-shadow: 0 0 0 10px #2FBF7100; }
          100% { box-shadow: 0 0 0 0 #2FBF7100; }
        }
      `}</style>
    </div>
  );
}
