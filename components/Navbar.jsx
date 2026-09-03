"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import CategoryBar from "./CategoryBar";
import { CATEGORIES } from "@/lib/data";

import {
  ShoppingBag,
  Menu,
  X,
  User,
  Sun,
  Moon,
  Search,
  ChevronDown,
} from "lucide-react";

import {
  useCart,
  useUser,
  useTheme,
} from "./Providers";

const LINKS = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "فروشگاه", dropdown: true },
  { href: "/blog", label: "بلاگ" },
  { href: "/buying-guide", label: "راهنمای خرید" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileShopOpen, setMobileShopOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const { count } = useCart();
  const { user } = useUser();
  const { theme, toggle } = useTheme();

  const isActive = (href) =>
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);

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

  const searchInputStyle = {
    flex: 1,
    minWidth: 0,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--text-hi)",
    fontFamily: "Vazirmatn, sans-serif",
    fontSize: 13,
    padding: "10px 12px",
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background:
          "color-mix(in srgb, var(--bg) 85%, transparent)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--surface2)",
      }}
    >
      {/* ============================= */}
      {/* ردیف اصلی */}
      {/* ============================= */}

      <div
        className="navbar-main"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* ============================= */}
        {/* LOGO */}
        {/* ============================= */}

        <Link
          href="/"
          aria-label="دیجی هیز"
          className="navbar-logo-link"
        >
          <img
            src="/digihaze.svg"
            alt="Digihaze"
            className="navbar-logo"
          />
        </Link>

        {/* ============================= */}
        {/* منوی دسکتاپ */}
        {/* ============================= */}

        <nav className="nav-desktop">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="desktop-nav-link"
              style={{
                color: isActive(l.href)
                  ? "#22E5C9"
                  : "var(--text-hi)",
                fontWeight: isActive(l.href)
                  ? 700
                  : 500,
              }}
            >
              {l.label}

              {isActive(l.href) && (
                <span className="active-line" />
              )}
            </Link>
          ))}
        </nav>

        {/* ============================= */}
        {/* جستجوی دسکتاپ */}
        {/* ============================= */}

        <form
          onSubmit={submitSearch}
          className="nav-desktop nav-search-desktop"
        >
          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="جستجوی محصول..."
            style={searchInputStyle}
          />

          <button
            type="submit"
            aria-label="جستجو"
            className="search-button"
          >
            <Search
              size={17}
              color="var(--text-mut)"
            />
          </button>
        </form>

        {/* ============================= */}
        {/* آیکون‌ها */}
        {/* ============================= */}

        <div className="navbar-actions">

          {/* تغییر تم */}

          <button
            type="button"
            onClick={toggle}
            aria-label="تغییر حالت روشن/تاریک"
            style={iconBtnStyle}
          >
            {theme === "dark" ? (
              <Sun
                size={19}
                color="var(--text-hi)"
              />
            ) : (
              <Moon
                size={19}
                color="var(--text-hi)"
              />
            )}
          </button>

          {/* حساب کاربری */}

          <Link
            href="/auth"
            aria-label={
              user
                ? "حساب کاربری"
                : "ورود / ثبت‌نام"
            }
            style={{
              ...iconBtnStyle,
              border: user
                ? "1.5px solid #22E5C9"
                : "none",
              textDecoration: "none",
            }}
          >
            <User
              size={19}
              color={
                user
                  ? "#22E5C9"
                  : "var(--text-hi)"
              }
            />
          </Link>

          {/* سبد خرید */}

          <Link
            href="/cart"
            aria-label="سبد خرید"
            style={{
              ...iconBtnStyle,
              position: "relative",
              textDecoration: "none",
            }}
          >
            <ShoppingBag
              size={19}
              color="var(--text-hi)"
            />

            {count > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  left: -4,
                  background: "#2F86FF",
                  color: "var(--ink)",
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: 999,
                  minWidth: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                {count}
              </span>
            )}
          </Link>

          {/* منوی موبایل */}

          <button
            type="button"
            className="nav-burger"
            onClick={() =>
              setMenuOpen((v) => !v)
            }
            aria-label="منوی سایت"
            style={iconBtnStyle}
          >
            {menuOpen ? (
              <X
                size={19}
                color="var(--text-hi)"
              />
            ) : (
              <Menu
                size={19}
                color="var(--text-hi)"
              />
            )}
          </button>
        </div>
      </div>

      {/* ============================= */}
      {/* دسته‌بندی‌ها */}
      {/* ============================= */}

      <Suspense fallback={null}>
        <CategoryBar />
      </Suspense>

      {/* ============================= */}
      {/* جستجوی موبایل */}
      {/* ============================= */}

      <div className="search-mobile-row">
        <form className="mobile-search-form" onSubmit={submitSearch}>
          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="جستجوی محصول..."
            style={searchInputStyle}
          />

          <button
            type="submit"
            aria-label="جستجو"
            className="search-button"
          >
            <Search
              size={17}
              color="var(--text-mut)"
            />
          </button>
        </form>
      </div>

      {/* ============================= */}
      {/* منوی موبایل */}
      {/* ============================= */}

      {menuOpen && (
        <div className="mobile-menu">

          {LINKS.map((l) =>
            l.dropdown ? (
              <div key={l.href}>

                <button
                  type="button"
                  onClick={() =>
                    setMobileShopOpen(
                      (v) => !v
                    )
                  }
                  className="mobile-shop-button"
                  style={{
                    color: isActive(l.href)
                      ? "#22E5C9"
                      : "var(--text-hi)",
                    fontWeight: isActive(l.href)
                      ? 700
                      : 500,
                  }}
                >
                  {l.label}

                  <ChevronDown
                    size={17}
                    style={{
                      transition:
                        "transform .18s",
                      transform:
                        mobileShopOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                    }}
                  />
                </button>

                {mobileShopOpen && (
                  <div className="mobile-submenu">

                    <Link
                      href="/shop"
                      onClick={() =>
                        setMenuOpen(false)
                      }
                      style={{ color: "var(--text-hi)" }}
                    >
                      همه محصولات
                    </Link>

                    {CATEGORIES.map((c) => (
                      <Link
                        key={c.id}
                        href={`/shop?category=${c.id}`}
                        onClick={() =>
                          setMenuOpen(false)
                        }
                        style={{ color: "var(--text-hi)" }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background:
                              c.color,
                            flexShrink: 0,
                          }}
                        />

                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                onClick={() =>
                  setMenuOpen(false)
                }
                className="mobile-nav-link"
                style={{
                  color: isActive(l.href)
                    ? "#22E5C9"
                    : "var(--text-hi)",
                  fontWeight: isActive(l.href)
                    ? 700
                    : 500,
                }}
              >
                {l.label}
              </Link>
            )
          )}
        </div>
      )}

      {/* ============================= */}
      {/* CSS */}
      {/* ============================= */}

      <style jsx>{`

        .navbar-logo-link {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          text-decoration: none;
          line-height: 0;
        }

        .navbar-logo {
          display: block;
          width: 125px;
          height: 42px;
          object-fit: contain;
          object-position: center;
        }

        .nav-desktop {
          display: flex;
        }

        .desktop-nav-link {
          position: relative;
          padding-bottom: 4px;
          white-space: nowrap;
          text-decoration: none !important;
          font-family: Vazirmatn, sans-serif;
          font-size: 15px;
        }

        .nav-desktop:not(.nav-search-desktop) {
          align-items: center;
          gap: 24px;
          flex-shrink: 0;
        }

        .active-line {
          position: absolute;
          bottom: 0;
          right: 0;
          left: 0;
          height: 2px;
          background: #22E5C9;
          border-radius: 2px;
        }

        .nav-search-desktop {
          flex: 1 1 auto;
          min-width: 0;
          max-width: 320px;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--surface2);
          border-radius: 12px;
          overflow: hidden;
        }

        .search-button {
          background: none;
          border: none;
          padding: 0 12px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .nav-burger {
          display: none;
        }

        .search-mobile-row {
          display: none;
        }

        .mobile-menu {
          border-top: 1px solid var(--surface2);
          padding: 12px 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .mobile-nav-link {
          font-family: Vazirmatn, sans-serif;
          font-size: 16px;
          text-decoration: none !important;
        }

        .mobile-shop-button {
          width: 100%;
          background: none;
          border: none;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: Vazirmatn, sans-serif;
          font-size: 16px;
          cursor: pointer;
          text-decoration: none !important;
        }

        .mobile-submenu {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px 4px 2px 14px;
        }

        .mobile-submenu a {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: Vazirmatn, sans-serif;
          font-size: 14.5px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none !important;
        }

        @media (max-width: 760px) {

          .nav-desktop {
            display: none !important;
          }

          .nav-burger {
            display: flex !important;
          }

          .search-mobile-row {
            display: block;
            border-top: 1px solid var(--surface2);
            padding: 10px 20px;
          }

          .mobile-search-form {
            display: flex;
            align-items: center;
            background: var(--surface);
            border: 1px solid var(--surface2);
            border-radius: 12px;
            overflow: hidden;
          }

          .navbar-main {
            padding: 11px 14px !important;
            gap: 10px !important;
          }

          .navbar-logo {
            width: 100px;
            height: 38px;
          }
        }

        @media (max-width: 480px) {

          .navbar-main {
            padding: 10px 10px !important;
            gap: 8px !important;
          }

          .navbar-logo {
            width: 90px;
            height: 36px;
          }

          .navbar-actions {
            gap: 7px;
          }

          .search-mobile-row {
            padding: 8px 10px !important;
          }
        }

        @media (max-width: 380px) {

          .navbar-logo {
            width: 82px;
            height: 34px;
          }

        }

      `}</style>
    </header>
  );
}
