"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import { Reveal } from "./ui";
import ScrollcraftHero from "./ScrollcraftHero";

import ProductCard from "./ProductCard";
import BannerCarousel from "./BannerCarousel";
import FaqSection from "./FaqSection";
import SiteImage from "./SiteImage";
import { CATEGORIES } from "@/lib/data";
import { useProducts } from "./ProductsProvider";

export default function HomeContent() {
  const { products } = useProducts();

  const featured = products;

  const saleItems = products.filter(
    (p) => p.discount > 0
  );

  const saleScrollRef = useRef(null);
  const dragState = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });
  // نحوه‌ی محاسبه‌ی scrollLeft در حالت RTL بین مرورگرها فرق می‌کند
  // (مثلاً کروم مقدار منفی می‌دهد). این رو یک‌بار تشخیص می‌دهیم تا
  // جهت درگ همیشه درست باشد، مهم نیست کاربر چه مرورگری استفاده می‌کند.
  const rtlScrollType = useRef("negative");

  useEffect(() => {
    const dummy = document.createElement("div");
    const inner = document.createElement("div");
    dummy.dir = "rtl";
    dummy.style.cssText =
      "position:absolute;top:-9999px;width:2px;height:1px;overflow:scroll;visibility:hidden;";
    inner.style.width = "3px";
    dummy.appendChild(inner);
    document.body.appendChild(dummy);

    if (dummy.scrollLeft > 0) {
      rtlScrollType.current = "default"; // مرورگرهای قدیمی webkit
    } else {
      dummy.scrollLeft = 1;
      rtlScrollType.current = dummy.scrollLeft === 0 ? "negative" : "reverse";
    }

    document.body.removeChild(dummy);
  }, []);

  // اگر وسط درگ، فوکوس پنجره از دست برود (مثلاً کاربر تب عوض کند یا موس
  // را بیرون از پنجره رها کند) و رویداد pointerup هیچ‌وقت نرسد، وضعیت
  // درگ رو دستی ریست می‌کنیم تا اسکرول برای همیشه قفل نماند.
  useEffect(() => {
    // توجه: اینجا فقط isDown ریست می‌شود، نه moved — چون moved باید تا
    // زمان بررسی‌شدن توسط handleSaleClickCapture (بعد از رویداد click)
    // دست‌نخورده بماند، وگرنه جلوگیری از کلیک ناخواسته بعد از یک درگ
    // واقعی از کار می‌افتد.
    const resetIsDown = () => {
      dragState.current.isDown = false;
    };
    window.addEventListener("blur", resetIsDown);
    return () => window.removeEventListener("blur", resetIsDown);
  }, []);

  // تشخیص «کلیک واقعی» از «درگ» بر اساس فاصله‌ی جابه‌جایی. آستانه‌ی قبلی
  // (۴ پیکسل) خیلی حساس بود؛ یک کلیک عادی با موس/تاچ‌پد معمولاً چند پیکسل
  // لرزش طبیعی دارد و با آستانه‌ی کم، آن کلیک هم اشتباهاً «درگ» تشخیص داده
  // می‌شد و چون handleSaleClickCapture جلوی کلیک را می‌گرفت، هیچ‌چیز زیرش
  // (افزودن به سبد، انتخاب رنگ، لینک محصول) قابل‌کلیک نمی‌ماند.
  const DRAG_DISTANCE_THRESHOLD = 8;

  const endDrag = (pointerId) => {
    const el = saleScrollRef.current;
    if (el && pointerId != null) {
      el.releasePointerCapture?.(pointerId);
    }
    dragState.current.isDown = false;
  };

  const handleDragStart = (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    // قبلاً اگر شروع کلیک روی دکمه/لینک/سوییچ رنگ بود، درگ کلاً غیرفعال
    // می‌شد — اما چون تقریباً کل کارت محصول داخل یک <Link> است، این باعث
    // می‌شد درگ تقریباً هیچ‌جای کارت کار نکند. الان از هرجای کارت هم
    // می‌شود درگ کرد؛ تشخیص «کلیک واقعی» در مقابل «درگ» بر اساس مقدار
    // جابه‌جایی (moved) در handleDragMove انجام می‌شود، و در صورت درگ،
    // handleSaleClickCapture کلیک روی دکمه/لینک زیرین را متوقف می‌کند.
    const el = saleScrollRef.current;
    if (!el) return;
    el.setPointerCapture?.(e.pointerId);
    dragState.current.isDown = true;
    dragState.current.moved = false;
    dragState.current.startX = e.clientX;
    dragState.current.scrollLeft = el.scrollLeft;
  };

  const handleDragMove = (e) => {
    const el = saleScrollRef.current;
    if (!el || !dragState.current.isDown) return;
    e.preventDefault();
    const walk = e.clientX - dragState.current.startX;
    if (Math.abs(walk) > DRAG_DISTANCE_THRESHOLD) {
      dragState.current.moved = true;
    }
    // جهت درگ باید با نحوه‌ی محاسبه‌ی scrollLeft در RTL هماهنگ باشد،
    // وگرنه در مرورگرهایی مثل کروم که RTL را با مقدار منفی نشان می‌دهند
    // درگ اصلاً اسکرول نمی‌کند یا برعکسِ جهت انگشت/موس اسکرول می‌کند.
    const sign = rtlScrollType.current === "default" ? -1 : 1;
    el.scrollLeft = dragState.current.scrollLeft + sign * walk;
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

      <ScrollcraftHero />

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
