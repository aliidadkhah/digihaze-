"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, X, User, Sun, Moon } from "lucide-react";
import { useCart, useUser, useTheme } from "./Providers";

const LINKS = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "فروشگاه" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();
  const { user } = useUser();
  const { theme, toggle } = useTheme();

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

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
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "Vazirmatn, sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: "var(--text-hi)",
            letterSpacing: 0.5,
            textDecoration: "none",
          }}
        >
          ابر<span style={{ color: "#2F86FF" }}>فروش</span>
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
              }}
            >
              {l.label}
              {isActive(l.href) && (
                <span style={{ position: "absolute", bottom: 0, right: 0, left: 0, height: 2, background: "#22E5C9", borderRadius: 2 }} />
              )}
            </Link>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={toggle}
            aria-label="تغییر حالت روشن/تاریک"
            style={{ background: "var(--surface2)", border: "none", borderRadius: 12, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            {theme === "dark" ? <Sun size={19} color="var(--text-hi)" /> : <Moon size={19} color="var(--text-hi)" />}
          </button>
          <Link
            href="/auth"
            aria-label={user ? "حساب کاربری" : "ورود / ثبت‌نام"}
            style={{ background: "var(--surface2)", border: user ? "1.5px solid #22E5C9" : "none", borderRadius: 12, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
          >
            <User size={19} color={user ? "#22E5C9" : "var(--text-hi)"} />
          </Link>
          <Link
            href="/cart"
            aria-label="سبد خرید"
            style={{ background: "var(--surface2)", border: "none", borderRadius: 12, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", textDecoration: "none" }}
          >
            <ShoppingBag size={19} color="var(--text-hi)" />
            {count > 0 && (
              <span style={{ position: "absolute", top: -4, left: -4, background: "#2F86FF", color: "var(--ink)", fontSize: 10, fontWeight: 800, borderRadius: 999, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                {count}
              </span>
            )}
          </Link>
          <button
            className="nav-burger"
            onClick={() => setMenuOpen((v) => !v)}
            style={{ background: "var(--surface2)", border: "none", borderRadius: 12, width: 42, height: 42, alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            {menuOpen ? <X size={19} color="var(--text-hi)" /> : <Menu size={19} color="var(--text-hi)" />}
          </button>
        </div>
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
