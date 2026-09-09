"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
Search,
ShoppingCart,
Menu,
X,
ChevronDown,
} from "lucide-react";

import { CATEGORIES } from "@/lib/data";

const LINKS = [
{ href: "/", label: "خانه" },
{ href: "/shop", label: "فروشگاه", dropdown: true },
{ href: "/about", label: "درباره ما" },
{ href: "/contact", label: "تماس با ما" },
];

export default function Navbar() {
const pathname = usePathname();
const router = useRouter();

const [menuOpen, setMenuOpen] = useState(false);
const [mobileShopOpen, setMobileShopOpen] =
useState(false);

const [search, setSearch] = useState("");

const isActive = (href) => {
if (href === "/") {
return pathname === "/";
}

```
return pathname === href ||
  pathname.startsWith(`${href}/`);
```

};

const submitSearch = (e) => {
e.preventDefault();

```
const q = search.trim();

if (!q) {
  router.push("/shop");
  return;
}

router.push(
  `/shop?search=${encodeURIComponent(q)}`
);

setMenuOpen(false);
```

};

return (
<header
style={{
position: "sticky",
top: 0,
zIndex: 50,
background: "var(--bg)",
borderBottom: "1px solid var(--surface2)",
}}
>
{/* ============================= */}
{/* ردیف اصلی */}
{/* ============================= */}

```
  <div
    className="navbar-main"
    style={{
      maxWidth: 1180,
      margin: "0 auto",
      padding: "12px 20px",
      display: "flex",
      alignItems: "center",
      gap: 18,
    }}
  >
    {/* لوگو */}
    <Link
      href="/"
      className="navbar-logo-link"
    >
      <Image
        src="/logo.png"
        alt="دیجی هیز"
        width={125}
        height={42}
        priority
        className="navbar-logo"
      />
    </Link>

    {/* ============================= */}
    {/* منوی دسکتاپ */}
    {/* ============================= */}

    <nav
      className="nav-desktop"
      style={{
        alignItems: "center",
        gap: 24,
        flexShrink: 0,
      }}
    >
      {LINKS.map((l) =>
        l.dropdown ? (
          <div
            key={l.href}
            style={{
              position: "relative",
            }}
            className="desktop-shop-menu"
          >
            <Link
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
          </div>
        ) : (
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
        )
      )}
    </nav>

    {/* ============================= */}
    {/* جستجو دسکتاپ */}
    {/* ============================= */}

    <form
      onSubmit={submitSearch}
      className="nav-desktop nav-search-desktop"
      style={{
        display: "flex",
        alignItems: "center",
        flex: "1 1 auto",
        minWidth: 0,
        maxWidth: 320,
      }}
    >
      <input
        type="search"
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        placeholder="جستجوی محصول..."
        aria-label="جستجوی محصول"
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          color: "var(--text-hi)",
          fontFamily: "Vazirmatn, sans-serif",
          fontSize: 13,
          padding: "10px 12px",
        }}
      />

      <button
        type="submit"
        className="search-button"
        aria-label="جستجو"
      >
        <Search
          size={19}
          color="var(--text-lo)"
        />
      </button>
    </form>

    {/* ============================= */}
    {/* اکشن‌ها */}
    {/* ============================= */}

    <div className="navbar-actions">
      <Link
        href="/cart"
        aria-label="سبد خرید"
        style={{
          color: "var(--text-hi)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ShoppingCart size={22} />
      </Link>

      <button
        type="button"
        onClick={() =>
          setMenuOpen((v) => !v)
        }
        aria-label="باز کردن منو"
        className="nav-burger"
        style={{
          background: "none",
          border: "none",
          color: "var(--text-hi)",
          cursor: "pointer",
          padding: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {menuOpen ? (
          <X size={24} />
        ) : (
          <Menu size={24} />
        )}
      </button>
    </div>
  </div>

  {/* ============================= */}
  {/* جستجوی موبایل */}
  {/* ============================= */}

  <div className="search-mobile-row">
    <form
      onSubmit={submitSearch}
      className="mobile-search-form"
    >
      <input
        type="search"
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        placeholder="جستجوی محصول..."
        aria-label="جستجوی محصول"
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          color: "var(--text-hi)",
          fontFamily: "Vazirmatn, sans-serif",
          fontSize: 13,
          padding: "10px 12px",
        }}
      />

      <button
        type="submit"
        className="search-button"
        aria-label="جستجو"
      >
        <Search
          size={19}
          color="var(--text-lo)"
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
                  style={{ color: "var(--text-lo)", fontSize: 13 }}
                >
                  همه محصولات
                </Link>

                {CATEGORIES.map((c) => (
                  <Link
                    key={c.id}
                    href={`/shop/${c.id}`}
                    onClick={() =>
                      setMenuOpen(false)
                    }
                    style={{ color: "var(--text-lo)", fontSize: 13 }}
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

  <style>{`

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
      font-size: 13px;
      font-weight: 400;
      color: var(--text-lo);
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
```

);
}
