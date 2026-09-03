"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteImage from "./SiteImage";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  Percent,
  Star,
  ShieldCheck,
  ChevronDown,
  Tag,
} from "lucide-react";

import {
  Stars,
  Reveal,
  navArrowStyle,
  qtyBtnStyle,
  inputStyle,
} from "./ui";

import { FlavorCloud } from "./visuals";
import ProductCard from "./ProductCard";
import { money, discountedPrice, CATEGORIES } from "@/lib/data";
import { useCart, useUser } from "./Providers";

// حذف تگ‌های HTML برای تخمین طول متن (برای تصمیم «نمایش بیشتر»)
function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// اطلاعات دسته‌بندی محصول (عنوان و رنگ) برای بردکرامب و چیپ دسته
function getCategoryInfo(categoryId) {
  const found = CATEGORIES.find((c) => c.id === categoryId);
  return found || { id: categoryId, label: categoryId || "محصولات", color: "#2F86FF" };
}

// متن ساده‌ی قدیمی (بدون تگ HTML) رو هم درست نشون می‌دهد
function toDisplayHtml(text) {
  if (!text) return "";
  if (text.includes("<")) return text;
  return text.replace(/\n/g, "<br>");
}

function ReviewForm({ onSubmit }) {
  const { user } = useUser();

  const [name, setName] = useState(user?.name || "");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      return setError("لطفاً نامت رو بنویس");
    }

    if (!text.trim()) {
      return setError("لطفاً متن نظرت رو بنویس");
    }

    onSubmit({
      name: name.trim(),
      rating,
      text: text.trim(),
    });

    setText("");
  };

  return (
    <form
      onSubmit={submit}
      style={{
        background: "var(--surface)",
        borderRadius: 14,
        padding: 16,
        marginBottom: 18,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 13.5,
        }}
      >
        ثبت نظر شما
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
        }}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
            }}
          >
            <Star
              size={20}
              fill={
                n <= (hoverRating || rating)
                  ? "#C6FF3D"
                  : "none"
              }
              stroke={
                n <= (hoverRating || rating)
                  ? "#C6FF3D"
                  : "var(--text-lo)"
              }
            />
          </button>
        ))}
      </div>

      {!user && (
        <input
          placeholder="نام شما"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
      )}

      <textarea
        placeholder="تجربه‌ات از این محصول رو بنویس..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        style={{
          ...inputStyle,
          resize: "vertical",
        }}
      />

      {error && (
        <div
          style={{
            color: "#2F86FF",
            fontSize: 12,
            background: "#2F86FF22",
            borderRadius: 8,
            padding: "6px 10px",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        style={{
          alignSelf: "flex-start",
          background: "#2F86FF",
          color: "var(--ink)",
          border: "none",
          borderRadius: 10,
          padding: "9px 20px",
          fontFamily: "Vazirmatn",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        ثبت نظر
      </button>
    </form>
  );
}

export default function ProductContent({ product, related }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("desc");
  const [added, setAdded] = useState(false);

  const [reviews, setReviews] = useState(
    product.reviews || []
  );

  const [descExpanded, setDescExpanded] = useState(false);

  const categoryInfo = getCategoryInfo(product.category);

  // ویژگی‌های مهم: اگر ادمین جداگانه ثبت کرده، همون‌ها؛ وگرنه از روی مشخصات فنی می‌سازیم
  const keyFeatures =
    product.features?.length > 0
      ? product.features
      : (product.specs || [])
          .filter((s) => (s.value || s.v || "").trim())
          .slice(0, 4)
          .map((s) => `${s.label || s.k}: ${s.value || s.v}`);

  const descriptionIsLong =
    stripHtml(product.description).length > 320;

  /*
   * رنگ انتخاب‌شده
   *
   * اگر محصول رنگ داشته باشد، اولین رنگ به صورت پیش‌فرض انتخاب می‌شود.
   * اگر محصول رنگ نداشته باشد، مقدار null خواهد بود.
   */
  const [selectedColor, setSelectedColor] = useState(
    product.colors?.length > 0
      ? product.colors[0]
      : null
  );

  const { addToCart } = useCart();

  useEffect(() => {
    setImgIdx(0);
    setQty(1);
    setTab("desc");
    setReviews(product.reviews || []);
    setDescExpanded(false);

    setSelectedColor(
      product.colors?.length > 0
        ? product.colors[0]
        : null
    );
  }, [product.id]);

  const addReview = (review) => {
    setReviews((prev) => [
      { ...review },
      ...prev,
    ]);

    setTab("reviews");
  };

  /*
   * افزودن محصول به سبد خرید
   *
   * اگر محصول رنگ داشته باشد،
   * رنگ انتخاب‌شده داخل cartProduct ذخیره می‌شود.
   */
  const handleAddToCart = () => {
    if (
      product.colors?.length > 0 &&
      !selectedColor
    ) {
      return;
    }

    const cartProduct = {
      ...product,

      selectedColor:
        product.colors?.length > 0
          ? selectedColor
          : null,
    };

    addToCart(cartProduct, qty);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1600);
  };

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "30px 20px 70px",
      }}
    >
      {/* =========================
          Breadcrumb
      ========================= */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 20,
          fontFamily: "Vazirmatn",
          fontSize: 12.5,
          color: "var(--text-mut)",
        }}
      >
        <Link
          href="/"
          style={{ color: "var(--text-mut)", textDecoration: "none" }}
        >
          خانه
        </Link>

        <span style={{ opacity: 0.6 }}>/</span>

        <Link
          href={`/shop/${product.category}`}
          style={{ color: "var(--text-mut)", textDecoration: "none" }}
        >
          {categoryInfo.label}
        </Link>

        <span style={{ opacity: 0.6 }}>/</span>

        <span
          style={{
            color: "var(--text-hi)",
            fontWeight: 700,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 240,
          }}
        >
          {product.name}
        </span>
      </div>

      {product.discount > 0 && (
        <div
          style={{
            background: `linear-gradient(90deg, ${product.color}33, transparent)`,
            border: `1px solid ${product.color}55`,
            borderRadius: 14,
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <Percent
            size={16}
            color={product.color}
          />

          <span
            style={{
              fontFamily: "Vazirmatn",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {product.discount}٪ تخفیف ویژه فقط تا پایان موجودی
          </span>
        </div>
      )}

      <div
        className="product-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 46,
        }}
      >
        {/* =========================
            Gallery
        ========================= */}
        <div>
          <div
            style={{
              position: "relative",
              borderRadius: 20,
              overflow: "hidden",
              aspectRatio: "4/5",
              background: "var(--surface)",
            }}
          >
            <FlavorCloud
              color={product.color}
              size={400}
              style={{
                top: -100,
                right: -100,
              }}
            />

            <SiteImage
              src={product.images[imgIdx]}
              alt={product.name}
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            {product.images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setImgIdx(
                      (i) =>
                        (i -
                          1 +
                          product.images.length) %
                        product.images.length
                    )
                  }
                  style={navArrowStyle("right")}
                >
                  <ChevronRight
                    size={18}
                    color="#120C22"
                  />
                </button>

                <button
                  onClick={() =>
                    setImgIdx(
                      (i) =>
                        (i + 1) %
                        product.images.length
                    )
                  }
                  style={navArrowStyle("left")}
                >
                  <ChevronLeft
                    size={18}
                    color="#120C22"
                  />
                </button>
              </>
            )}
          </div>

          {product.images.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 12,
              }}
            >
              {product.images.map((im, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 10,
                    overflow: "hidden",
                    border:
                      i === imgIdx
                        ? `2px solid ${product.color}`
                        : "2px solid transparent",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <SiteImage
                    src={im}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* =========================
            Info
        ========================= */}
        <div>
          <div
            style={{
              color: "var(--text-mut)",
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            {product.brand}
          </div>

          <h1
            style={{
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              fontSize: 26,
              marginBottom: 12,
            }}
          >
            {product.name}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <Stars
              rating={product.rating}
              size={16}
            />

            <span
              style={{
                color: "var(--text-lo)",
                fontSize: 13,
              }}
            >
              {product.rating} از ۵ ({reviews.length} نظر)
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              marginBottom: 22,
            }}
          >
            <span
              style={{
                fontFamily: "Vazirmatn",
                fontWeight: 800,
                fontSize: 26,
              }}
            >
              {money(discountedPrice(product))}
            </span>

            {product.discount > 0 && (
              <span
                style={{
                  fontSize: 15,
                  color: "var(--text-faint)",
                  textDecoration: "line-through",
                }}
              >
                {money(product.price)}
              </span>
            )}
          </div>

          {/* =========================
              انتخاب رنگ
          ========================= */}
          {product.colors?.length > 0 && (
            <div
              style={{
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: "Vazirmatn",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  گزینه:
                </span>

                <span
                  style={{
                    color: "var(--text-lo)",
                    fontSize: 13,
                  }}
                >
                  {selectedColor?.name}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                {product.colors.map((color) => {
                  const isSelected =
                    selectedColor?.id ===
                    color.id;

                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() =>
                        setSelectedColor(color)
                      }
                      title={color.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 12px",
                        borderRadius: 10,
                        border: isSelected
                          ? `2px solid ${product.color}`
                          : "1px solid var(--surface2)",
                        background: isSelected
                          ? `${product.color}18`
                          : "var(--surface)",
                        color:
                          "var(--text-hi)",
                        cursor: "pointer",
                        fontFamily:
                          "Vazirmatn",
                        fontSize: 12.5,
                        fontWeight:
                          isSelected
                            ? 700
                            : 500,
                        transition:
                          "all 0.2s ease",
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background:
                            color.hex,
                          border:
                            color.hex.toLowerCase() ===
                            "#ffffff"
                              ? "1px solid #999"
                              : "none",
                          boxShadow:
                            isSelected
                              ? `0 0 0 2px var(--surface), 0 0 0 4px ${product.color}`
                              : "none",
                        }}
                      />

                      {color.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================
              Quantity + Add To Cart
          ========================= */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 26,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border:
                  "1px solid var(--surface2)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() =>
                  setQty((q) => q + 1)
                }
                style={qtyBtnStyle}
              >
                <Plus size={15} />
              </button>

              <span
                style={{
                  width: 40,
                  textAlign: "center",
                  fontFamily: "Vazirmatn",
                  fontWeight: 700,
                }}
              >
                {qty}
              </span>

              <button
                onClick={() =>
                  setQty((q) =>
                    Math.max(1, q - 1)
                  )
                }
                style={qtyBtnStyle}
              >
                <Minus size={15} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              style={{
                flex: 1,
                background: added
                  ? "#22E5C9"
                  : "#2F86FF",
                color: "var(--ink)",
                border: "none",
                borderRadius: 12,
                padding: "14px 0",
                fontFamily: "Vazirmatn",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition:
                  "background 0.25s ease",
              }}
            >
              {added ? (
                <Check size={16} />
              ) : (
                <ShoppingBag size={16} />
              )}

              {added
                ? "اضافه شد"
                : "افزودن به سبد خرید"}
            </button>
          </div>

          {/* =========================
              ویژگی‌های مهم
          ========================= */}
          {keyFeatures.length > 0 && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--surface2)",
                borderRadius: 14,
                padding: "14px 16px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: "Vazirmatn",
                  fontWeight: 700,
                  fontSize: 13,
                  marginBottom: 10,
                  color: "var(--text-hi)",
                }}
              >
                ویژگی‌های مهم
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 8,
                }}
              >
                {keyFeatures.map((feat, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 7,
                      fontSize: 12.5,
                      color: "var(--text-lo)",
                      fontFamily: "Vazirmatn",
                      lineHeight: 1.7,
                    }}
                  >
                    <Check
                      size={14}
                      color={product.color || "#2F86FF"}
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================
              ضمانت اصالت کالا
          ========================= */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              background: "#22E5C90f",
              border: "1px solid #22E5C955",
              borderRadius: 14,
              padding: "13px 16px",
              marginBottom: 14,
            }}
          >
            <ShieldCheck
              size={20}
              color="#22E5C9"
              style={{ flexShrink: 0, marginTop: 1 }}
            />

            <div>
              <div
                style={{
                  fontFamily: "Vazirmatn",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--text-hi)",
                  marginBottom: 3,
                }}
              >
                ضمانت اصالت کالا
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: "Vazirmatn",
                  fontSize: 12,
                  color: "var(--text-mut)",
                  lineHeight: 1.8,
                }}
              >
                تمام محصولات دیجی‌هیز اورجینال و تأمین‌شده از منابع معتبر هستند و با ضمانت اصالت کالا برای شما ارسال می‌شوند.
              </p>
            </div>
          </div>

          {/* =========================
              دسته‌بندی و برچسب‌ها
          ========================= */}
          {(product.category || product.tags?.length > 0) && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
              }}
            >
              {product.category && (
                <Link
                  href={`/shop/${product.category}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    textDecoration: "none",
                    background: `${categoryInfo.color}18`,
                    color: categoryInfo.color,
                    border: `1px solid ${categoryInfo.color}55`,
                    borderRadius: 999,
                    padding: "5px 12px",
                    fontFamily: "Vazirmatn",
                    fontSize: 11.5,
                    fontWeight: 700,
                  }}
                >
                  <Tag size={11} />
                  {categoryInfo.label}
                </Link>
              )}

              {(product.tags || []).map((tag, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    background: "var(--surface)",
                    color: "var(--text-mut)",
                    border: "1px solid var(--surface2)",
                    borderRadius: 999,
                    padding: "5px 12px",
                    fontFamily: "Vazirmatn",
                    fontSize: 11.5,
                    fontWeight: 500,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

        </div>
      </div>

      <div style={{ marginTop: 40 }}>
          {/* =========================
              Tabs
          ========================= */}
          <div
            style={{
              borderBottom:
                "1px solid var(--surface2)",
              display: "flex",
              gap: 22,
              marginBottom: 18,
            }}
          >
            {[
              {
                id: "desc",
                label: "توضیحات",
              },
              {
                id: "specs",
                label: "توضیحات تکمیلی",
              },
              {
                id: "brand",
                label: "درباره برند",
              },
              {
                id: "reviews",
                label: `نظرات (${reviews.length})`,
              },
              {
                id: "qa",
                label: `سوال و جواب (${(product.qa || []).length})`,
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  setTab(t.id)
                }
                style={{
                  background: "none",
                  border: "none",
                  paddingBottom: 12,
                  fontFamily: "Vazirmatn",
                  fontWeight:
                    tab === t.id
                      ? 700
                      : 500,
                  fontSize: 13.5,
                  color:
                    tab === t.id
                      ? "var(--text-hi)"
                      : "var(--text-mut)",
                  borderBottom:
                    tab === t.id
                      ? "2px solid #2F86FF"
                      : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "desc" && (
            <div>
              <div
                style={{
                  position: "relative",
                  maxHeight:
                    descExpanded || !descriptionIsLong
                      ? "none"
                      : 220,
                  overflow: "hidden",
                }}
              >
                <div
                  className="rich-content"
                  dir="rtl"
                  style={{
                    color: "var(--text-lo)",
                    fontSize: 14,
                    lineHeight: 2,
                    textAlign: "center",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: toDisplayHtml(product.description),
                  }}
                />

                {!descExpanded && descriptionIsLong && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      left: 0,
                      height: 70,
                      background:
                        "linear-gradient(to bottom, transparent, var(--bg))",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>

              {descriptionIsLong && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    margin: "12px auto 0",
                    background: "var(--surface)",
                    border: "1px solid var(--surface2)",
                    borderRadius: 999,
                    padding: "8px 18px",
                    fontFamily: "Vazirmatn",
                    fontWeight: 700,
                    fontSize: 12.5,
                    color: "#2F86FF",
                    cursor: "pointer",
                  }}
                >
                  {descExpanded ? "نمایش کمتر" : "نمایش بیشتر"}
                  <ChevronDown
                    size={14}
                    style={{
                      transition: "transform 0.25s ease",
                      transform: descExpanded
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  />
                </button>
              )}
            </div>
          )}

          {tab === "specs" && (
            <div
              style={{
                maxWidth: 560,
                margin: "0 auto",
              }}
            >
              {product.specs
                .filter((s) => (s.value || s.v || "").trim())
                .map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "baseline",
                    gap: 28,
                    padding: "10px 0",
                    borderBottom:
                      "1px solid var(--surface2)",
                    fontSize: 13.5,
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      color:
                        "var(--text-mut)",
                      minWidth: 130,
                    }}
                  >
                    {s.label || s.k}
                  </span>

                  <span
                    style={{
                      fontWeight: 700,
                      minWidth: 130,
                    }}
                  >
                    {s.value || s.v}
                  </span>
                </div>
              ))}

            </div>
          )}

          {tab === "brand" && (
            <div>
              {product.brandImage && (
                <div
                  style={{
                    borderRadius: 14,
                    overflow: "hidden",
                    marginBottom: 16,
                    maxWidth: 420,
                    margin: "0 auto 16px",
                  }}
                >
                  <img
                    src={product.brandImage}
                    alt={product.brand}
                    style={{
                      width: "100%",
                      display: "block",
                    }}
                  />
                </div>
              )}

              {product.brandDescription ? (
                <div
                  className="rich-content"
                  dir="rtl"
                  style={{
                    color: "var(--text-lo)",
                    fontSize: 14,
                    lineHeight: 2,
                    textAlign: "center",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: toDisplayHtml(product.brandDescription),
                  }}
                />
              ) : (
                <p
                  style={{
                    color: "var(--text-mut)",
                    fontSize: 13,
                  }}
                >
                  هنوز توضیحی درباره‌ی برند {product.brand} ثبت نشده.
                </p>
              )}
            </div>
          )}

          {tab === "qa" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {(product.qa || []).length === 0 && (
                <p
                  style={{
                    color: "var(--text-mut)",
                    fontSize: 13,
                  }}
                >
                  هنوز سوالی برای این محصول ثبت نشده.
                </p>
              )}

              {(product.qa || []).map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--surface)",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13.5,
                      marginBottom: 8,
                    }}
                  >
                    {item.question}
                  </div>

                  <p
                    style={{
                      color: "var(--text-lo)",
                      fontSize: 13,
                      lineHeight: 1.9,
                    }}
                  >
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === "reviews" && (
            <div>
              <ReviewForm
                onSubmit={addReview}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: 14,
                }}
              >
                {reviews.length === 0 && (
                  <p
                    style={{
                      color:
                        "var(--text-mut)",
                      fontSize: 13,
                    }}
                  >
                    هنوز نظری ثبت نشده. اولین نفر باش!
                  </p>
                )}

                {reviews.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      background:
                        "var(--surface)",
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 13.5,
                        }}
                      >
                        {r.name}
                      </span>

                      <Stars
                        rating={r.rating}
                        size={12}
                      />
                    </div>

                    <p
                      style={{
                        color:
                          "var(--text-lo)",
                        fontSize: 13,
                      }}
                    >
                      {r.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      <style>{`
        .rich-content {
          direction: rtl;
          text-align: center;
        }
        .rich-content img {
          max-width: 100%;
          border-radius: 14px;
          margin: 14px auto;
          display: block;
        }
        .rich-content h1,
        .rich-content h2,
        .rich-content h3 {
          font-family: Vazirmatn;
          font-weight: 800;
          color: var(--text-hi);
          margin: 22px auto 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #2F86FF;
          display: inline-block;
        }
        .rich-content h3 {
          font-size: 16px;
        }
        .rich-content ul,
        .rich-content ol {
          padding-inline-start: 22px;
          margin: 8px 0;
        }
        .rich-content li {
          margin: 4px 0;
        }
        .rich-content p {
          margin: 0 0 10px;
        }
      `}</style>

      {/* =========================
          Related Products
      ========================= */}
      {related.length > 0 && (
        <div
          style={{
            marginTop: 60,
          }}
        >
          <h2
            style={{
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              fontSize: 20,
              marginBottom: 20,
            }}
          >
            محصولات مرتبط
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill,minmax(190px,1fr))",
              gap: 18,
            }}
          >
            {related.map((p, i) => (
              <Reveal
                key={p.id}
                delay={0.06 * i}
              >
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
