"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { Badge, Reveal } from "./ui";
import {
  FlavorCloud,
  VaporParticles,
  FloatingBottle,
} from "./visuals";

import ProductCard from "./ProductCard";
import BannerCarousel from "./BannerCarousel";
import FaqSection from "./FaqSection";
import SiteImage from "./SiteImage";
import { CATEGORIES } from "@/lib/data";
import { useProducts } from "./ProductsProvider";

export default function HomeContent() {
  const { products } = useProducts();

  const featured = products.filter(
    (p) => p.discount > 0 || p.badge
  );

  const saleItems = products.filter(
    (p) => p.discount > 0
  );

  const [heroColor, setHeroColor] =
    useState("#2F86FF");

  const heroRef = useRef(null);

  const [parallax, setParallax] = useState({
    x: 0,
    y: 0,
  });

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;

    const rect =
      heroRef.current.getBoundingClientRect();

    setParallax({
      x:
        ((e.clientX - rect.left) /
          rect.width -
          0.5) *
        30,

      y:
        ((e.clientY - rect.top) /
          rect.height -
          0.5) *
        30,
    });
  };

  return (
    <div>
      {/* =========================
          BANNER
      ========================= */}

      <BannerCarousel />

      {/* =========================
          HERO
      ========================= */}

      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        aria-labelledby="home-title"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "90px 20px 70px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${parallax.x}px, ${parallax.y}px)`,
            transition:
              "transform 0.3s ease-out",
          }}
        >
          <FlavorCloud
            color={heroColor}
            size={640}
            style={{
              top: -160,
              right: "50%",
              transform:
                "translateX(50%)",
              animation:
                "driftA 14s ease-in-out infinite",
            }}
          />

          <FlavorCloud
            color="#22E5C9"
            size={340}
            style={{
              top: 40,
              left: "8%",
              animation:
                "driftB 11s ease-in-out infinite",
            }}
          />

          <FlavorCloud
            color="#FF8A3D"
            size={300}
            style={{
              top: 120,
              right: "6%",
              animation:
                "driftA 16s ease-in-out infinite reverse",
            }}
          />
        </div>

        <VaporParticles
          color={heroColor}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 760,
            margin: "0 auto",
          }}
        >
          <FloatingBottle
            color={heroColor}
          />

          <div
            className="hero-reveal"
            style={{
              animationDelay: "0.05s",
            }}
          >
            <Badge bg="#22E5C9">
              فصل جدید طعم‌ها رسید 🌫️
            </Badge>
          </div>

          <h1
            id="home-title"
            className="hero-reveal"
            style={{
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              fontSize:
                "clamp(32px, 6vw, 56px)",
              lineHeight: 1.25,
              margin:
                "20px 0 16px",
              animationDelay:
                "0.16s",
            }}
          >
            هر پاف، یک{" "}
            <span
              style={{
                color: "#2F86FF",
                textShadow:
                  "0 0 30px #2F86FF66",
              }}
            >
              طعم
            </span>{" "}
            تازه
          </h1>

          {/* =========================
              SEO INTRO
          ========================= */}

          <p
            className="hero-reveal"
            style={{
              color:
                "var(--text-hi)",
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1.8,
              margin:
                "0 0 12px",
              animationDelay:
                "0.22s",
            }}
          >
            دیجی هیز؛ فروشگاه آنلاین
            پاد، سالت نیکوتین،
            دستگاه ویپ و کارتریج
          </p>

          <p
            className="hero-reveal"
            style={{
              color:
                "var(--text-lo)",
              fontSize: 16,
              lineHeight: 1.9,
              marginBottom: 30,
              animationDelay:
                "0.28s",
            }}
          >
            در دیجی هیز می‌توانید
            محصولات مختلف پاد،
            سالت نیکوتین، دستگاه و
            کارتریج را مشاهده کنید،
            مشخصات و قیمت محصولات
            را بررسی کنید و از میان
            دسته‌بندی‌های مختلف،
            محصول موردنظر خود را
            پیدا کنید.
          </p>

          <div
            className="hero-reveal"
            style={{
              display: "flex",
              gap: 14,
              justifyContent:
                "center",
              flexWrap: "wrap",
              animationDelay:
                "0.4s",
            }}
          >
            <Link
              href="/shop"
              className="pulse-btn"
              style={{
                background:
                  "#2F86FF",
                color:
                  "var(--ink)",
                border: "none",
                borderRadius: 14,
                padding:
                  "14px 30px",
                fontFamily:
                  "Vazirmatn",
                fontWeight: 800,
                fontSize: 15,
                textDecoration:
                  "none",
              }}
            >
              مشاهده فروشگاه
            </Link>

            <Link
              href="/about"
              style={{
                background:
                  "transparent",
                color:
                  "var(--text-hi)",
                border:
                  "1px solid var(--border-soft)",
                borderRadius: 14,
                padding:
                  "14px 30px",
                fontFamily:
                  "Vazirmatn",
                fontWeight: 700,
                fontSize: 15,
                textDecoration:
                  "none",
              }}
            >
              درباره ما
            </Link>
          </div>
        </div>
      </section>

      {/* =========================
          CATEGORY STRIP
      ========================= */}

      <section
        aria-labelledby="shop-categories-title"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding:
            "10px 20px 50px",
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
                <Link
                  href={`/shop/${c.id}`}
                  onMouseEnter={() =>
                    setHeroColor(
                      c.color
                    )
                  }
                  aria-label={`مشاهده ${c.label}`}
                  className="category-card-link"
                  style={{
                    display: "block",
                    width: "100%",
                    background:
                      "var(--surface)",
                    border:
                      "1px solid var(--surface2)",
                    borderRadius: 16,
                    overflow: "hidden",
                    cursor:
                      "pointer",
                    transition:
                      "border-color 0.25s ease, transform 0.25s ease",
                    textDecoration:
                      "none",
                    boxSizing:
                      "border-box",
                  }}
                  onMouseOver={(
                    e
                  ) => {
                    e.currentTarget.style.borderColor =
                      c.color;

                    e.currentTarget.style.transform =
                      "translateY(-4px)";
                  }}
                  onMouseOut={(
                    e
                  ) => {
                    e.currentTarget.style.borderColor =
                      "var(--surface2)";

                    e.currentTarget.style.transform =
                      "translateY(0)";
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
              </Reveal>
            )
          )}
        </div>
      </section>

      {/* =========================
          DISCOUNT BANNER
      ========================= */}

      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding:
            "0 20px 50px",
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
        className="sale-section"
        aria-labelledby="sale-title"
        style={{
          width: "100%",
          margin: 0,
          padding:
            "38px 0 50px",
          background:
            "linear-gradient(180deg, rgba(47,134,255,0.035), rgba(34,229,201,0.02))",
          borderTop:
            "1px solid rgba(255,255,255,0.035)",
          borderBottom:
            "1px solid rgba(255,255,255,0.035)",
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
                پیشنهادهای فروش
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
                  "#22E5C9",
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
            className="sale-scroll"
            style={{
              display:
                "flex",
              gap: 16,
              overflowX:
                "auto",
              paddingBottom:
                10,
              scrollSnapType:
                "x mandatory",
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
                    scrollSnapAlign:
                      "start",
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
            پیشنهادهای ویژه
          </h2>

          <Link
            href="/shop"
            style={{
              color:
                "#22E5C9",
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

      <style jsx>{`
        .category-card-link {
          transform: translateZ(0);
        }

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
