"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BANNER_SLIDES = [
  {
    id: "b1",
    color: "#2F86FF",
    href: "/shop?category=eliquid",
    img: "/slider.jpg",
  },
  {
    id: "b2",
    color: "#FF8A3D",
    href: "/product/p3",
    img: "/slider2.jpg",
  },
  {
    id: "b3",
    color: "#22E5C9",
    href: "/shop",
    img: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function BannerCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      setIdx((current) => (current + 1) % BANNER_SLIDES.length);
    }, 2500);

    return () => clearInterval(timer);
  }, [paused]);

  const go = (index) => {
    setIdx(
      (index + BANNER_SLIDES.length) % BANNER_SLIDES.length
    );
  };

  return (
    <section
      style={{
        width: "100%",
        padding: "18px 0 0",
      }}
    >
      <div
        className="banner-slider"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
          border: "none",
          borderRadius: 0,
          aspectRatio: "21 / 3",
          boxSizing: "border-box",
        }}
      >
        {/* Slides */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            direction: "ltr",
            transform: "translateX(-" + idx * 100 + "%)",
            transition:
              "transform 0.35s cubic-bezier(.65,0,.35,1)",
          }}
        >
          {BANNER_SLIDES.map((slide) => (
            <button
              key={slide.id}
              onClick={() => router.push(slide.href)}
              style={{
                position: "relative",
                flex: "0 0 100%",
                width: "100%",
                maxWidth: "100%",
                height: "100%",
                border: "none",
                padding: 0,
                margin: 0,
                cursor: "pointer",
                display: "block",
                boxSizing: "border-box",
                background: "none",
              }}
            >
              <img
                src={slide.img}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </button>
          ))}
        </div>

        {/* Dots - پایینِ پایین و وسط */}
        <div
          style={{
            position: "absolute",
            bottom: 2,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            zIndex: 5,
            direction: "ltr",
          }}
        >
          {BANNER_SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => go(i)}
              aria-label={"اسلاید " + (i + 1)}
              style={{
                width: i === idx ? 22 : 8,
                height: 8,
                borderRadius: 999,
                border: "none",
                padding: 0,
                margin: 0,
                background:
                  i === idx
                    ? slide.color
                    : "#ffffff77",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* افزایش ارتفاع بنر در موبایل */}
      <style jsx>{`
        @media (max-width: 768px) {
          .banner-slider {
            aspect-ratio: 16 / 5 !important;
          }
        }

        @media (max-width: 480px) {
          .banner-slider {
            aspect-ratio: 16 / 6 !important;
          }
        }
      `}</style>
    </section>
  );
}
