"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import ProductCard from "./ProductCard";
import { CATEGORIES, resolveCategoryId } from "@/lib/data";

/* =========================================
   بخش «پیشنهادها» صفحه اول
   - باکس بنفش با پنل سمت راست (دسته‌بندی‌ها)
   - کارت‌های محصول (همان ProductCard سایت) با اسکرول افقی
   - پیش‌فرض: همه محصولات تخفیف‌دار
========================================= */

const PURPLE = "#7C3AED";
const PURPLE_DARK = "#5B21B6";

// ترتیب دسته‌بندی‌ها در پنل سمت راست
const OFFER_CATEGORY_ORDER = [
  "salt-nicotine",
  "pod-system",
  "cartridge",
  "disposable-pod",
];

const OFFER_TABS = [
  { id: "all", label: "همه محصولات" },
  ...OFFER_CATEGORY_ORDER.map((id) => {
    const c = CATEGORIES.find((x) => x.id === id);
    return c ? { id, label: c.label } : null;
  }).filter(Boolean),
];

// مخلوط کردن تصادفی (Fisher–Yates)
function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// موجودها اول، ناموجودها آخر لیست
function availableFirst(list) {
  return [
    ...list.filter((p) => p.available !== false),
    ...list.filter((p) => p.available === false),
  ];
}

/* =========================================
   خود سکشن
========================================= */

export default function OffersSection({
  products = [],
  loading = false,
}) {
  const [activeCat, setActiveCat] = useState("all");
  const [edges, setEdges] = useState({
    prev: false,
    next: false,
  });

  // لیست تخفیف‌دارها: با هر ریلود صفحه ترتیب تصادفی جدید می‌گیرد
  // (فقط وقتی لیست محصولات تازه لود شود دوباره ساخته می‌شود، نه با
  // عوض کردن دسته‌بندی). ناموجودها همیشه آخر لیست هستند.
  const saleProducts = useMemo(
    () =>
      availableFirst(
        shuffle(products.filter((p) => p.discount > 0))
      ),
    [products]
  );

  const items = useMemo(
    () =>
      activeCat === "all"
        ? saleProducts
        : saleProducts.filter(
            (p) => resolveCategoryId(p.category) === activeCat
          ),
    [saleProducts, activeCat]
  );

  /* ---------- اسکرول افقی: درگ با موس + دکمه‌های فلش ---------- */

  const trackRef = useRef(null);

  const drag = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
    captured: false,
  });

  const DRAG_THRESHOLD = 8;

  const updateEdges = () => {
    const el = trackRef.current;
    if (!el) return;

    // در صفحه‌ی راست‌به‌چپ، scrollLeft منفی می‌شود؛ قدر مطلق می‌گیریم
    const pos = Math.abs(el.scrollLeft);

    setEdges({
      prev: pos > 4,
      next: pos + el.clientWidth < el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    const el = trackRef.current;
    if (el) el.scrollLeft = 0;

    updateEdges();

    window.addEventListener("resize", updateEdges);
    return () =>
      window.removeEventListener("resize", updateEdges);
  }, [items]);

  const scrollByDir = (dir) => {
    const el = trackRef.current;
    if (!el) return;

    // next = به سمت چپ (محصولات بعدی)، prev = به سمت راست
    el.scrollBy({
      left: dir * -1 * el.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  const onPointerDown = (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;

    const el = trackRef.current;
    if (!el) return;

    drag.current.isDown = true;
    drag.current.moved = false;
    drag.current.captured = false;
    drag.current.startX = e.clientX;
    drag.current.scrollLeft = el.scrollLeft;
  };

  const onPointerMove = (e) => {
    const el = trackRef.current;
    if (!el || !drag.current.isDown) return;

    const walk = e.clientX - drag.current.startX;

    if (!drag.current.moved) {
      if (Math.abs(walk) <= DRAG_THRESHOLD) return;

      drag.current.moved = true;
      el.setPointerCapture?.(e.pointerId);
      drag.current.captured = true;
    }

    e.preventDefault();
    el.scrollLeft = drag.current.scrollLeft - walk;
  };

  const onPointerEnd = (e) => {
    const el = trackRef.current;

    if (el && drag.current.captured && e?.pointerId != null) {
      el.releasePointerCapture?.(e.pointerId);
    }

    drag.current.isDown = false;
    drag.current.captured = false;
  };

  // بعد از یک درگ واقعی، کلیک روی کارت (لینک) نباید باز شود
  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }

    drag.current.moved = false;
  };

  /* ---------- اگر اصلاً محصول تخفیف‌داری نیست، سکشن نمایش داده نشود ---------- */

  if (!loading && saleProducts.length === 0) return null;


  return (
    <section
      className="sale-section site-section site-section-alt"
      aria-labelledby="sale-title"
      style={{
        width: "100%",
        margin: 0,
        padding: "44px 0 54px",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        <div className="offers-box" dir="rtl">
          {/* ---------- پنل سمت راست ---------- */}
          <aside className="offers-side">
            <h2 id="sale-title" className="offers-title">
              پیشنهادها
            </h2>

            <p className="offers-sub">
              محصولات تخفیف‌دار همین حالا
            </p>

            <div
              className="offers-cats"
              role="tablist"
              aria-label="دسته‌بندی پیشنهادها"
            >
              {OFFER_TABS.map((tab) => {
                const isActive = activeCat === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={
                      "offers-cat" + (isActive ? " active" : "")
                    }
                    onClick={() => setActiveCat(tab.id)}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ---------- کارت‌ها ---------- */}
          <div className="offers-track-wrap">
            {edges.prev && (
              <button
                type="button"
                className="offers-arrow offers-arrow-prev"
                aria-label="قبلی"
                onClick={() => scrollByDir(-1)}
              >
                <ChevronRight size={20} />
              </button>
            )}

            {edges.next && (
              <button
                type="button"
                className="offers-arrow offers-arrow-next"
                aria-label="بعدی"
                onClick={() => scrollByDir(1)}
              >
                <ChevronLeft size={20} />
              </button>
            )}

            <div
              ref={trackRef}
              className="offers-track"
              onScroll={updateEdges}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onClickCapture={onClickCapture}
              onDragStart={(e) => e.preventDefault()}
            >
              {loading && items.length === 0 &&
                [0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="offers-skeleton" />
                ))}

              {!loading && items.length === 0 && (
                <p className="offers-empty">
                  فعلاً پیشنهادی در این دسته‌بندی نداریم.
                </p>
              )}

              {items.map((p) => (
                <div key={p.id} className="offers-item">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .offers-box {
          display: flex;
          align-items: stretch;
          gap: 8px;
          background: linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK});
          border-radius: 24px;
          padding: 16px;
          overflow: hidden;
        }

        /* ---------- پنل راست ---------- */

        .offers-side {
          width: 190px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          color: #fff;
          padding: 6px 4px;
        }

        .offers-title {
          font-family: var(--font-primary);
          font-weight: 800;
          font-size: 24px;
          margin: 0;
          line-height: 1.3;
        }

        .offers-sub {
          font-size: 12px;
          opacity: 0.88;
          margin: 0 0 4px;
        }

        .offers-cats {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .offers-cat {
          width: 100%;
          cursor: pointer;
          padding: 9px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.55);
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          font-family: var(--font-primary);
          font-weight: 700;
          font-size: 13px;
          transition: background 0.2s ease, color 0.2s ease,
            border-color 0.2s ease;
        }

        .offers-cat:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .offers-cat.active {
          background: #fff;
          color: ${PURPLE};
          border-color: #fff;
        }



        /* ---------- ناحیه‌ی کارت‌ها ---------- */

        .offers-track-wrap {
          position: relative;
          flex: 1;
          min-width: 0;
        }

        .offers-track {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 14px 6px;
          scroll-snap-type: x proximity;
          scrollbar-width: none;
          cursor: grab;
        }

        .offers-track::-webkit-scrollbar {
          display: none;
        }

        .offers-item {
          flex: 0 0 220px;
          scroll-snap-align: start;
          display: flex;
          flex-direction: column;
          user-select: none;
        }

        .offers-item img,
        .offers-item a {
          -webkit-user-drag: none;
        }

        .offers-skeleton {
          flex: 0 0 220px;
          height: 470px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.22);
        }

        .offers-empty {
          color: #fff;
          font-size: 14px;
          width: 100%;
          text-align: center;
          align-self: center;
          padding: 70px 10px;
          margin: 0;
        }

        /* ---------- فلش‌ها ---------- */

        .offers-arrow {
          position: absolute;
          top: 34%;
          z-index: 2;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid #e3e3ea;
          background: #fff;
          color: #1d1d35;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
        }

        .offers-arrow-next {
          left: 8px;
        }

        .offers-arrow-prev {
          right: 8px;
        }

        /* ---------- موبایل ---------- */

        @media (hover: none) {
          .offers-arrow {
            display: none;
          }
        }

        @media (max-width: 820px) {
          .offers-box {
            flex-direction: column;
            padding: 14px 12px;
            border-radius: 20px;
          }

          .offers-side {
            width: 100%;
            gap: 8px;
          }

          .offers-cats {
            flex-direction: row;
            overflow-x: auto;
            scrollbar-width: none;
            padding-bottom: 2px;
          }

          .offers-cats::-webkit-scrollbar {
            display: none;
          }

          .offers-cat {
            width: auto;
            flex-shrink: 0;
            white-space: nowrap;
            padding: 8px 14px;
            border-radius: 999px;
          }


          .offers-item,
          .offers-skeleton {
            flex-basis: 175px;
          }
        }

        @media (max-width: 600px) {
          .sale-section {
            padding-top: 30px !important;
            padding-bottom: 38px !important;
          }
        }
      `}</style>
    </section>
  );
}
