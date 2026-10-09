"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

import { Reveal } from "./ui";
import ScrollcraftHero from "./ScrollcraftHero";

import ProductCard from "./ProductCard";
import BannerCarousel from "./BannerCarousel";
import FaqSection from "./FaqSection";
import SiteImage from "./SiteImage";
import { CATEGORIES, resolveCategoryId } from "@/lib/data";
import { useProducts } from "./ProductsProvider";

// مخلوط کردن تصادفی لیست (Fisher–Yates)
function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// موجودها اول (با حفظ ترتیب فعلی)، ناموجودها آخر لیست
function availableFirst(list) {
  return [
    ...list.filter((p) => p.available !== false),
    ...list.filter((p) => p.available === false),
  ];
}

// تب‌های بخش «همه محصولات» صفحه اول
const HOME_TABS = [
  { id: "all", label: "همه محصولات", color: "#4F7FFF" },
  ...CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    color: c.color,
  })),
];

export default function HomeContent() {
  const { products, loading } = useProducts();

  // رنگ نور دستگاه ویپ بالای هیرو، وقتی روی یکی از باکس‌های دسته‌بندی
  // هاور می‌شود به رنگ همون دسته‌بندی تغییر می‌کند (وقتی هاور نیست،
  // به رنگ پیش‌فرض بنفش برمی‌گردد — این رفتار توی ScrollcraftHero هندل می‌شود).
  const [hoveredCategoryColor, setHoveredCategoryColor] = useState(null);

  const [activeTab, setActiveTab] = useState("all");

  // ترتیب تصادفی: فقط وقتی لیست محصولات تازه لود می‌شود (یعنی با هر
  // ریلود صفحه) دوباره ساخته می‌شود؛ با عوض کردن تب یا رندر مجدد،
  // ترتیب تغییر نمی‌کند. ناموجودها همیشه آخر لیست می‌مانند.
  const shuffledProducts = useMemo(
    () => availableFirst(shuffle(products)),
    [products]
  );

  const featured = useMemo(
    () =>
      activeTab === "all"
        ? shuffledProducts
        : shuffledProducts.filter(
            (p) => resolveCategoryId(p.category) === activeTab
          ),
    [shuffledProducts, activeTab]
  );

  // محصولات تخفیف‌دار هم با هر ریلود به ترتیب تصادفی نمایش داده می‌شوند
  const saleItems = useMemo(
    () =>
      availableFirst(
        shuffle(products.filter((p) => p.discount > 0))
      ),
    [products]
  );

  const saleScrollRef = useRef(null);
  const dragState = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
    captured: false,
  });

  // تشخیص «کلیک واقعی» از «درگ» بر اساس فاصله‌ی جابه‌جایی. آستانه‌ی قبلی
  // (۴ پیکسل) خیلی حساس بود؛ یک کلیک عادی با موس/تاچ‌پد معمولاً چند پیکسل
  // لرزش طبیعی دارد.
  const DRAG_DISTANCE_THRESHOLD = 8;

  const endDrag = (pointerId) => {
    const el = saleScrollRef.current;
    if (el && dragState.current.captured && pointerId != null) {
      el.releasePointerCapture?.(pointerId);
    }
    dragState.current.isDown = false;
    dragState.current.captured = false;
  };

  const handleDragStart = (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    // قبلاً اگر شروع کلیک روی دکمه/لینک/سوییچ رنگ بود، درگ کلاً غیرفعال
    // می‌شد — اما چون تقریباً کل کارت محصول داخل یک <Link> است، این باعث
    // می‌شد درگ تقریباً هیچ‌جای کارت کار نکند. الان از هرجای کارت هم
    // می‌شود درگ کرد؛ تشخیص «کلیک واقعی» در مقابل «درگ» بر اساس مقدار
    // جابه‌جایی (moved) در handleDragMove انجام می‌شود، و در صورت درگ،
    // handleSaleClickCapture کلیک روی دکمه/لینک زیرین را متوقف می‌کند.
    //
    // نکته‌ی مهم: setPointerCapture عمداً اینجا (روی خودِ pointerdown)
    // صدا زده نمی‌شود — اگر روی هر کلیک ساده هم capture انجام شود،
    // برخی مرورگرها (به‌خصوص کروم) رویداد click نهایی را به‌جای خودِ
    // دکمه/لینک زیرین، به همین عنصر بیرونی نسبت می‌دهند و در نتیجه هیچ
    // دکمه‌ای (افزودن به سبد، انتخاب رنگ) کلیک‌پذیر نمی‌ماند. به همین
    // خاطر capture را فقط در handleDragMove و فقط وقتی واقعاً درگ
    // تشخیص داده شود، فعال می‌کنیم.
    const el = saleScrollRef.current;
    if (!el) return;
    dragState.current.isDown = true;
    dragState.current.moved = false;
    dragState.current.captured = false;
    dragState.current.startX = e.clientX;
    dragState.current.scrollLeft = el.scrollLeft;
  };

  const handleDragMove = (e) => {
    const el = saleScrollRef.current;
    if (!el || !dragState.current.isDown) return;
    const walk = e.clientX - dragState.current.startX;

    if (!dragState.current.moved) {
      if (Math.abs(walk) <= DRAG_DISTANCE_THRESHOLD) return; // هنوز کلیک ساده است، دست نزن
      dragState.current.moved = true;
      // همین الان که مطمئن شدیم درگ واقعی است، پوینتر را capture کن
      el.setPointerCapture?.(e.pointerId);
      dragState.current.captured = true;
    }

    e.preventDefault();
    el.scrollLeft = dragState.current.scrollLeft - walk;
  };

  const handleDragEnd = (e) => {
    endDrag(e?.pointerId);
  };

  const handleSaleClickCapture = (e) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
    // بلافاصله ریست کن تا این وضعیت به کلیک‌های بعدی نشت نکند و
    // مثلاً بعد از یک درگ واقعی، همه‌ی کلیک‌های بعدی مسدود نمانند.
    dragState.current.moved = false;
  };

  return (
    <div>
      {/* =========================
          BANNER
      ========================= */}

      <BannerCarousel />

      {/* =========================
          HERO — Scrollcraft style
          (اسکرول = تایم‌لاین، سکشن بلند با sticky)
      ========================= */}

      <ScrollcraftHero deviceColor={hoveredCategoryColor} />

      {/* =========================
          CATEGORY STRIP
      ========================= */}

      <section
        className="site-section"
        aria-labelledby="shop-categories-title"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding:
            "44px 20px 50px",
        }}
      >
        <h2
          id="shop-categories-title"
          style={{
            fontFamily:
              "var(--font-primary)",
            fontWeight: 800,
            fontSize: 22,
            marginBottom: 20,
          }}
        >
          دسته‌بندی محصولات
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(150px,1fr))",
            gap: 16,
          }}
        >
          {CATEGORIES.map(
            (c, i) => (
              <Reveal
                key={c.id}
                delay={0.08 * i}
              >
                <div
                  className="glow-box"
                  onMouseEnter={() =>
                    setHoveredCategoryColor(c.color)
                  }
                  onMouseLeave={() =>
                    setHoveredCategoryColor(null)
                  }
                  style={{
                    borderRadius: 16,
                    "--glow": "#4F7FFF",
                    "--glow-2": c.color,
                  }}
                >
                <Link
                  href={`/shop/${c.id}`}
                  aria-label={`مشاهده ${c.label}`}
                  className="category-card-link glow-box-body"
                  style={{
                    display: "block",
                    width: "100%",
                    borderRadius: 16,
                    cursor:
                      "pointer",
                    textDecoration:
                      "none",
                    boxSizing:
                      "border-box",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1 / 1",
                      background:
                        `${c.color}14`,
                    }}
                  >
                    <SiteImage
                      src={c.image}
                      alt={c.label}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      fontFamily:
                        "var(--font-primary)",
                      fontWeight: 700,
                      fontSize: 14,
                      color:
                        "var(--text-hi)",
                      textAlign:
                        "center",
                      padding:
                        "12px 10px",
                    }}
                  >
                    {c.label}
                  </div>
                </Link>
                </div>
              </Reveal>
            )
          )}
        </div>
      </section>

      {/* =========================
          DISCOUNT BANNER
      ========================= */}

      <section
        className="site-section"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding:
            "40px 20px 50px",
          position: "relative",
        }}
      >
        <Reveal>
          <Link
            href="/shop?discount=1"
            aria-label="مشاهده محصولات تخفیف‌دار"
            className="discount-banner-link"
            style={{
              display: "block",
              position:
                "relative",
              overflow:
                "hidden",
              borderRadius: 24,
              border:
                "1px solid var(--border-soft)",
              width: "100%",
              aspectRatio: "1400 / 500",
              textDecoration: "none",
            }}
          >
            <SiteImage
              src="/discount-banner.jpg"
              alt="تا ۲۰٪ تخفیف روی مایع‌های یخی - مشاهده محصولات تخفیف‌دار"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Link>
        </Reveal>
      </section>

      {/* =========================
          SALE OFFERS
      ========================= */}

      <section
        className="sale-section site-section site-section-alt"
        aria-labelledby="sale-title"
        style={{
          width: "100%",
          margin: 0,
          padding:
            "44px 0 54px",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding:
              "0 20px",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              marginBottom:
                22,
            }}
          >
            <div>
              <h2
                id="sale-title"
                style={{
                  fontFamily:
                    "var(--font-primary)",
                  fontWeight: 800,
                  fontSize: 22,
                  marginBottom:
                    4,
                }}
              >
                پیشنهادها
              </h2>

              <p
                style={{
                  color:
                    "var(--text-mut)",
                  fontSize:
                    12.5,
                }}
              >
                محصولات
                تخفیف‌دار همین
                حالا
              </p>
            </div>

            <Link
              href="/shop"
              style={{
                color:
                  "var(--neon-blue)",
                fontFamily:
                  "var(--font-primary)",
                fontSize: 13,
                textDecoration:
                  "none",
              }}
            >
              مشاهده همه ←
            </Link>
          </div>

          <div
            ref={saleScrollRef}
            className="sale-scroll"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            onClickCapture={handleSaleClickCapture}
            style={{
              display:
                "flex",
              gap: 16,
              overflowX:
                "auto",
              paddingTop:
                18,
              paddingBottom:
                10,
            }}
          >
            {saleItems.map(
              (p, i) => (
                <Reveal
                  key={p.id}
                  delay={
                    0.06 *
                    (i % 4)
                  }
                  style={{
                    minWidth: 190,
                    maxWidth: 190,
                  }}
                >
                  <ProductCard
                    product={p}
                  />
                </Reveal>
              )
            )}
          </div>
        </div>
      </section>

      {/* =========================
          FEATURED PRODUCTS
      ========================= */}

      <section
        className="site-section"
        aria-labelledby="featured-title"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding:
            "50px 20px 70px",
        }}
      >
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            marginBottom:
              22,
          }}
        >
          <h2
            id="featured-title"
            style={{
              fontFamily:
                "var(--font-primary)",
              fontWeight: 800,
              fontSize: 22,
            }}
          >
            همه محصولات
          </h2>

          <Link
            href={
              activeTab === "all"
                ? "/shop"
                : `/shop/${activeTab}`
            }
            style={{
              color:
                "var(--neon-blue)",
              fontFamily:
                "var(--font-primary)",
              fontSize: 13,
              textDecoration:
                "none",
            }}
          >
            مشاهده همه ←
          </Link>
        </div>

        <div
          className="featured-tabs"
          role="tablist"
          aria-label="دسته‌بندی محصولات"
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 6,
            marginBottom: 18,
          }}
        >
          {HOME_TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flexShrink: 0,
                  cursor: "pointer",
                  padding: "9px 16px",
                  borderRadius: 999,
                  fontFamily: "var(--font-primary)",
                  fontWeight: 700,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  border: isActive
                    ? `1px solid ${tab.color}`
                    : "1px solid var(--border-soft)",
                  background: isActive
                    ? `${tab.color}22`
                    : "transparent",
                  color: isActive
                    ? tab.color
                    : "var(--text-hi)",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {!loading && featured.length === 0 && (
          <p
            style={{
              color: "var(--text-mut)",
              fontSize: 13,
              padding: "20px 0",
            }}
          >
            محصولی در این دسته‌بندی وجود ندارد.
          </p>
        )}

        <div
          className="featured-grid"
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fill,minmax(190px,1fr))",
            gap: 18,
          }}
        >
          {featured.map(
            (p, i) => (
              <Reveal
                key={p.id}
                delay={
                  0.08 *
                  (i % 4)
                }
              >
                <ProductCard
                  product={p}
                />
              </Reveal>
            )
          )}
        </div>
      </section>

      {/* =========================
          FAQ
      ========================= */}

      <FaqSection />

      {/* =========================
          RESPONSIVE
      ========================= */}

      <style>{`
        .discount-banner-link {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .discount-banner-link:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.3);
        }

        .featured-tabs {
          scrollbar-width: none;
        }

        .featured-tabs::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 600px) {
          .featured-grid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            ) !important;

            gap: 10px !important;
          }

          .sale-section {
            padding-top: 30px !important;
            padding-bottom: 38px !important;
          }

          .sale-scroll {
            gap: 10px !important;
          }
        }

        @media (max-width: 380px) {
          .featured-grid {
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
