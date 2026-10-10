"use client";

import { useEffect, useState } from "react";
import { Eye, Users, TrendingUp, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function fa(n) {
  return Number(n || 0).toLocaleString("fa-IR");
}

const statCard = {
  background: "var(--surface)",
  border: "1px solid var(--surface2)",
  borderRadius: 14,
  padding: 18,
  flex: "1 1 160px",
  minWidth: 150,
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
  fontSize: 13,
};

function StatCard({ icon, label, views, visitors }) {
  return (
    <div style={statCard}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "var(--text-mut)",
          fontSize: 12.5,
          marginBottom: 10,
        }}
      >
        {icon}
        {label}
      </div>
      <div style={{ fontWeight: 800, fontSize: 22, color: "var(--text-hi)" }}>
        {fa(views)} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-mut)" }}>بازدید</span>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-mut)", marginTop: 4 }}>
        {fa(visitors)} بازدیدکننده‌ی یکتا
      </div>
    </div>
  );
}

function DailyChart({ daily }) {
  const max = Math.max(1, ...daily.map((d) => d.views));

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--surface2)",
        borderRadius: 14,
        padding: "18px 16px 10px",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 16 }}>
        بازدید ۱۴ روز اخیر
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          height: 140,
        }}
      >
        {daily.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.views} بازدید، ${d.visitors} بازدیدکننده`}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "var(--text-faint)",
                minHeight: 12,
              }}
            >
              {d.views > 0 ? fa(d.views) : ""}
            </div>
            <div
              style={{
                width: "100%",
                maxWidth: 22,
                height: Math.max(3, (d.views / max) * 100),
                borderRadius: 6,
                background: "#4F7FFF",
                opacity: d.views > 0 ? 1 : 0.15,
              }}
            />
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 8,
          borderTop: "1px solid var(--surface2)",
          paddingTop: 8,
        }}
      >
        {daily.map((d) => (
          <div
            key={d.date}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 10,
              color: "var(--text-faint)",
            }}
          >
            {d.date.slice(5)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsManager() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    setHint("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch("/api/admin/analytics", {
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
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div dir="rtl">
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <button onClick={load} style={smallBtn}>
          {loading ? <Loader2 size={14} className="am-spin" /> : <RefreshCw size={14} />}
          به‌روزرسانی
        </button>
      </div>

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

      {loading && !data && <p style={{ color: "var(--text-mut)" }}>در حال بارگذاری...</p>}

      {data && (
        <>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
            <StatCard
              icon={<Eye size={14} />}
              label="امروز"
              views={data.today.views}
              visitors={data.today.visitors}
            />
            <StatCard
              icon={<TrendingUp size={14} />}
              label="۷ روز اخیر"
              views={data.last7Days.views}
              visitors={data.last7Days.visitors}
            />
            <StatCard
              icon={<Users size={14} />}
              label="۳۰ روز اخیر"
              views={data.last30Days.views}
              visitors={data.last30Days.visitors}
            />
            <div style={statCard}>
              <div style={{ color: "var(--text-mut)", fontSize: 12.5, marginBottom: 10 }}>
                مجموع کل (از ابتدا)
              </div>
              <div style={{ fontWeight: 800, fontSize: 22, color: "var(--text-hi)" }}>
                {fa(data.totalAllTime)} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-mut)" }}>بازدید</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <DailyChart daily={data.daily} />
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--surface2)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 12 }}>
              پربازدیدترین صفحات (۷ روز اخیر)
            </div>

            {data.topPages.length === 0 && (
              <p style={{ color: "var(--text-mut)", fontSize: 13 }}>
                هنوز داده‌ای برای این بازه ثبت نشده.
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.topPages.map((p, i) => (
                <div
                  key={p.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: i % 2 === 0 ? "var(--surface2)" : "transparent",
                  }}
                >
                  <span
                    dir="ltr"
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-hi)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                      flex: 1,
                    }}
                  >
                    {p.path}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#4F7FFF", flexShrink: 0 }}>
                    {fa(p.views)} بازدید
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ color: "var(--text-faint)", fontSize: 11.5, marginTop: 14 }}>
            این آمار مستقل از Google Analytics و بر اساس بازدیدهای ثبت‌شده توی سایت خودمونه. مسیرهای پنل ادمین
            توی این آمار حساب نمی‌شن.
          </p>
        </>
      )}

      <style>{`
        .am-spin {
          animation: am-spin 0.8s linear infinite;
        }
        @keyframes am-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
