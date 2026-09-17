"use client";

import { useRef } from "react";
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

  const handleDragStart = (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
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
    if (Math.abs(walk) > 4) dragState.current.moved = true;
    el.scrollLeft = dragState.current.scrollLeft - walk;
  };

  const handleDragEnd = (e) => {
    const el = saleScrollRef.current;
    if (el && e?.pointerId != null) {
      el.releasePointerCapture?.(e.pointerId);
    }
    dragState.current.isDown = false;
  };

  const handleSaleClickCapture = (e) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
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
              "Vazirmatn",
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
                        "Vazirmatn",
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
                    "Vazirmatn",
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
                  "Vazirmatn",
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
                "Vazirmatn",
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
                "Vazirmatn",
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
