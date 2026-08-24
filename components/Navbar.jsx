"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Menu, X, User, Sun, Moon, Search } from "lucide-react";
import { useCart, useUser, useTheme } from "./Providers";

const LINKS = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "فروشگاه" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const { user } = useUser();
  const { theme, toggle } = useTheme();

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/shop?search=${encodeURIComponent(q)}`);
  };

  const iconBtnStyle = {
    background: "var(--surface2)",
    border: "none",
    borderRadius: 12,
    width: 42,
    height: 42,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "color-mix(in srgb, var(--bg) 85%, transparent)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--surface2)",
      }}
    >
      {/* ردیف اول: لوگو، منو، آیکون‌ها */}
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
       <Link
  href="/"
  style={{
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    textDecoration: "none",
  }}
>
  <img
    src="/digihaze.svg"
    alt="DigiHaze"
    style={{
      width: 150,
      height: "auto",
      display: "block",
    }}
  />
</Link>
        </Link>

        <nav className="nav-desktop" style={{ gap: 28 }}>
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontFamily: "Vazirmatn, sans-serif",
                fontSize: 15,
                fontWeight: isActive(l.href) ? 700 : 500,
                color: isActive(l.href) ? "#22E5C9" : "var(--text-hi)",
                textDecoration: "none",
                position: "relative",
                paddingBottom: 4,
                whiteSpace: "nowrap",
              }}
            >
              {l.label}
              {isActive(l.href) && (
                <span style={{ position: "absolute", bottom: 0, right: 0, left: 0, height: 2, background: "#22E5C9", borderRadius: 2 }} />
              )}
            </Link>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button onClick={toggle} aria-label="تغییر حالت روشن/تاریک" style={iconBtnStyle}>
            {theme === "dark" ? <Sun size={19} color="var(--text-hi)" /> : <Moon size={19} color="var(--text-hi)" />}
          </button>
          <Link
            href="/auth"
            aria-label={user ? "حساب کاربری" : "ورود / ثبت‌نام"}
            style={{ ...iconBtnStyle, border: user ? "1.5px solid #22E5C9" : "none", textDecoration: "none" }}
          >
            <User size={19} color={user ? "#22E5C9" : "var(--text-hi)"} />
          </Link>
          <Link href="/cart" aria-label="سبد خرید" style={{ ...iconBtnStyle, position: "relative", textDecoration: "none" }}>
            <ShoppingBag size={19} color="var(--text-hi)" />
            {count > 0 && (
              <span style={{ position: "absolute", top: -4, left: -4, background: "#2F86FF", color: "var(--ink)", fontSize: 10, fontWeight: 800, borderRadius: 999, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                {count}
              </span>
            )}
          </Link>
          <button className="nav-burger" onClick={() => setMenuOpen((v) => !v)} style={{ ...iconBtnStyle, display: "none" }}>
            {menuOpen ? <X size={19} color="var(--text-hi)" /> : <Menu size={19} color="var(--text-hi)" />}
          </button>
        </div>
      </div>

      {/* ردیف دوم: نوار جستجو، همیشه باز، هم دسکتاپ هم موبایل */}
      <div style={{ borderTop: "1px solid var(--surface2)", padding: "10px 20px" }}>
        <form
          onSubmit={submitSearch}
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            background: "var(--surface)",
            border: "1px solid var(--surface2)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی محصول، مثلاً توت‌فرنگی یا Nova..."
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-hi)",
              fontFamily: "Vazirmatn",
              fontSize: 13.5,
              padding: "11px 14px",
            }}
          />
          <button type="submit" aria-label="جستجو" style={{ background: "none", border: "none", padding: "0 14px", height: 40, display: "flex", alignItems: "center", cursor: "pointer" }}>
            <Search size={18} color="var(--text-mut)" />
          </button>
        </form>
      </div>

      {menuOpen && (
        <div style={{ borderTop: "1px solid var(--surface2)", padding: "12px 20px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: "Vazirmatn, sans-serif", fontSize: 16, fontWeight: isActive(l.href) ? 700 : 500, color: isActive(l.href) ? "#22E5C9" : "var(--text-hi)", textDecoration: "none" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
