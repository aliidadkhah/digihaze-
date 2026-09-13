"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/data";
import { ChevronDown } from "lucide-react";

export default function CategoryBar({ categories = CATEGORIES }) {
  const pathname = usePathname();

  const [openId, setOpenId] = useState(null);
  const [panelPos, setPanelPos] = useState(null);

  const wrapRef = useRef(null);
  const closeTimerRef = useRef(null);
  const itemRefs = useRef({});

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  // حداقل فاصله از لبه‌ی چپ/راست صفحه که پنل هیچ‌وقت نباید ازش رد بشه
  const PANEL_EDGE_MARGIN = 12;

  const computePanelPos = (id) => {
    const el = itemRefs.current[id];

    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;

    // عرض پنل رو با عرض صفحه هماهنگ می‌کنیم تا توی گوشی از کادر خارج نشه
    const width = Math.min(340, vw - PANEL_EDGE_MARGIN * 2);

    // فاصله‌ی ایده‌آل از راست، طوری که پنل زیر همون آیتم باز بشه
    const idealRight = vw - rect.right;

    // این فاصله رو کلمپ می‌کنیم که نه از راست صفحه رد بشه، نه از چپ
    const maxRight = vw - width - PANEL_EDGE_MARGIN;
    const right = Math.min(
      Math.max(idealRight, PANEL_EDGE_MARGIN),
      Math.max(maxRight, PANEL_EDGE_MARGIN)
    );

    setPanelPos({
      top: rect.bottom + 6,
      right,
      width,
    });
  };

  const openNow = (id) => {
    clearCloseTimer();
    computePanelPos(id);
    setOpenId(id);
  };

  const closeWithDelay = () => {
    clearCloseTimer();

    closeTimerRef.current = setTimeout(() => {
      setOpenId(null);
      setPanelPos(null);
    }, 150);
  };

  const activeCategory =
    pathname === "/shop"
      ? "all"
      : pathname.startsWith("/shop/")
        ? pathname.split("/")[2] || "all"
        : null;

  const activeSub = pathname.startsWith("/shop/")
    ? pathname.split("/")[3] || ""
    : "";

  const items = [
    {
      href: "/shop",
      label: "همه محصولات",
      id: "all",
      subcategories: [],
    },

    ...categories.map((c) => ({
      href: `/shop/${c.id}`,
      label: c.label,
      id: c.id,
      color: c.color,
      subcategories: c.subcategories || [],
    })),
  ];

  useEffect(() => {
    function onClickOutside(e) {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target)
      ) {
        setOpenId(null);
        setPanelPos(null);
      }
    }

    document.addEventListener(
      "mousedown",
      onClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        onClickOutside
      );

      clearCloseTimer();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (openId) {
        computePanelPos(openId);
      }
    };

    const handleScroll = () => {
      if (openId) {
        computePanelPos(openId);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );

      window.removeEventListener(
        "scroll",
        handleScroll,
        true
      );
    };
  }, [openId]);

  return (
    <div
      className="category-bar"
      ref={wrapRef}
      style={{
        borderTop: "1px solid var(--surface2)",
        borderBottom: "1px solid var(--surface2)",
        background: "var(--surface)",
        position: "relative",
      }}
    >
      <div
        className="category-bar-inner"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          gap: 26,
          overflowX: "auto",
        }}
      >
        {items.map((it) => {
          const active =
            activeCategory === it.id;

          const hasSubs =
            it.subcategories?.length > 0;

          const panelOpen =
            openId === it.id;

          return (
            <div
              key={it.href}
              ref={(el) => {
                itemRefs.current[it.id] = el;
              }}
              style={{
                position: "relative",
                flexShrink: 0,
              }}
              onMouseEnter={
                hasSubs
                  ? () => openNow(it.id)
                  : undefined
              }
              onMouseLeave={
                hasSubs
                  ? closeWithDelay
                  : undefined
              }
            >
              <div
                className="category-bar-item-row"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  width: "max-content",
                }}
              >
                <Link
                  href={it.href}
                  className="category-bar-link"
                  onClick={() => {
                    setOpenId(null);
                    setPanelPos(null);
                  }}
                  style={{
                    position: "relative",
                    whiteSpace: "nowrap",
                    fontFamily:
                      "Vazirmatn, sans-serif",
                    fontSize: 13.5,
                    fontWeight:
                      active ? 800 : 600,
                    color: active
                      ? "#22E5C9"
                      : "var(--text-lo)",
                    textDecoration: "none",
                    padding: "13px 0 13px 2px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {it.color && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: it.color,
                        flexShrink: 0,
                      }}
                    />
                  )}

                  {it.label}

                  {active && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        left: 0,
                        height: 2,
                        background: "#22E5C9",
                        borderRadius: 2,
                      }}
                    />
                  )}
                </Link>

                {hasSubs && (
                  <button
                    type="button"
                    aria-label={`زیردسته‌های ${it.label}`}
                    onClick={() => {
                      if (panelOpen) {
                        closeWithDelay();
                      } else {
                        openNow(it.id);
                      }
                    }}
                    className="category-bar-chevron"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      margin: 0,
                      padding:
                        "13px 2px 13px 0",
                      display: "inline-flex",
                      alignItems: "center",
                      color: active
                        ? "#22E5C9"
                        : "var(--text-lo)",
                    }}
                  >
                    <ChevronDown
                      size={14}
                      style={{
                        transition:
                          "transform .16s",
                        transform: panelOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                    />
                  </button>
                )}
              </div>

              {hasSubs &&
                panelOpen &&
                panelPos && (
                  <div
                    className="category-bar-panel"
                    onMouseEnter={() =>
                      openNow(it.id)
                    }
                    onMouseLeave={
                      closeWithDelay
                    }
                    style={{
                      position: "fixed",
                      top: panelPos.top,
                      right: panelPos.right,
                      background:
                        "var(--surface)",
                      border:
                        "1px solid var(--surface2)",
                      borderRadius: 14,
                      boxShadow:
                        "0 14px 30px rgba(0,0,0,.24)",
                      padding: "16px 18px",
                      width: panelPos.width,
                      maxWidth: `calc(100vw - ${PANEL_EDGE_MARGIN * 2}px)`,
                      boxSizing: "border-box",
                      zIndex: 60,
                    }}
                  >
                    <div
                      style={{
                        fontFamily:
                          "Vazirmatn, sans-serif",
                        fontSize: 12.5,
                        fontWeight: 700,
                        color:
                          "var(--text-lo)",
                        marginBottom: 10,
                      }}
                    >
                      بر اساس برند {it.label}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          panelPos.width < 300
                            ? "1fr"
                            : "1fr 1fr",
                        gap: "0px 18px",
                      }}
                    >
                      {it.subcategories.map(
                        (s) => {
                          const subActive =
                            active &&
                            activeSub === s.id;

                          return (
                            <Link
                              key={s.id}
                              href={`/shop/${it.id}/${s.id}`}
                              onClick={() => {
                                setOpenId(null);
                                setPanelPos(null);
                              }}
                              style={{
                                display: "block",
                                padding:
                                  "5px 10px",
                                lineHeight: 1.4,
                                borderRadius: 8,
                                fontFamily:
                                  "Vazirmatn, sans-serif",
                                fontSize: 13.5,
                                fontWeight:
                                  subActive
                                    ? 700
                                    : 500,
                                color:
                                  subActive
                                    ? "#22E5C9"
                                    : "var(--text-hi)",
                                textDecoration:
                                  "none",
                              }}
                              className="category-bar-sub-item"
                            >
                              {s.label}
                            </Link>
                          );
                        }
                      )}
                    </div>

                    <div
                      style={{
                        borderTop:
                          "1px solid var(--surface2)",
                        marginTop: 10,
                        paddingTop: 10,
                      }}
                    >
                      <Link
                        href={`/shop/${it.id}`}
                        onClick={() => {
                          setOpenId(null);
                          setPanelPos(null);
                        }}
                        style={{
                          display: "block",
                          padding: "6px 10px",
                          borderRadius: 8,
                          fontFamily:
                            "Vazirmatn, sans-serif",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#22E5C9",
                          textDecoration:
                            "none",
                        }}
                        className="category-bar-sub-item"
                      >
                        مشاهده همه {it.label}
                      </Link>
                    </div>
                  </div>
                )}
            </div>
          );
        })}
      </div>

      <style>{`
        .category-bar-inner {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .category-bar-inner::-webkit-scrollbar {
          display: none;
        }

        .category-bar-link:hover {
          color: var(--text-hi);
        }

        .category-bar-link {
          text-decoration: none !important;
        }

        .category-bar-sub-item {
          text-decoration: none !important;
          transition:
            transform 0.15s ease,
            background 0.15s ease;
          transform-origin: right center;
        }

        .category-bar-sub-item:hover {
          background: var(--surface2) !important;
          font-weight: 800 !important;
          transform: scale(1.08);
        }

        .category-bar-item-row {
          gap: 0 !important;
        }

        .category-bar-item-row > * {
          margin: 0 !important;
        }

        .category-bar-chevron {
          margin-inline-start: 0 !important;
        }

        @media (max-width: 760px) {
          .category-bar-inner {
            gap: 20px;
            padding: 0 14px;
          }

          .category-bar-link {
            font-size: 13px !important;
            padding: 11px 2px !important;
          }
        }

        @media (max-width: 380px) {
          .category-bar-inner {
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
