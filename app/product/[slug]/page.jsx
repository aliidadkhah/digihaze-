import { notFound, redirect } from "next/navigation";
import ProductContent from "@/components/ProductContent";
import { money, discountedPrice } from "@/lib/data";
import {
  getProductById,
  getProductBySlug,
  getRelated,
} from "@/lib/products";
import {
  SITE_URL,
  SITE_NAME,
} from "@/lib/site";

// =====================================================
// Dynamic rendering
// =====================================================

export const dynamic = "force-dynamic";

// =====================================================
// ساخت URL مطمئن برای تصاویر
// =====================================================

function getImageUrl(image) {
  if (!image || typeof image !== "string") {
    return null;
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  return `${SITE_URL}${
    image.startsWith("/") ? "" : "/"
  }${image}`;
}

// =====================================================
// تبدیل متن به رشته امن
// =====================================================

function cleanText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/\s+/g, " ")
    .trim();
}

// =====================================================
// دریافت محصول
//
// اگر slug واقعی باشد:
// /product/argus-0-7-3ml
//
// اگر ID قدیمی باشد:
// /product/p2
//
// در حالت دوم محصول پیدا می‌شود و به slug جدید
// Redirect می‌کنیم.
// =====================================================

async function getProduct(slug) {
  if (!slug) {
    return null;
  }

  // -----------------------------------------------
  // اول تلاش برای پیدا کردن با slug
  // -----------------------------------------------

  const productBySlug =
    await getProductBySlug(slug);

  if (productBySlug) {
    return {
      product: productBySlug,
      isLegacy: false,
    };
  }

  // -----------------------------------------------
  // اگر با slug پیدا نشد، بررسی ID قدیمی
  // -----------------------------------------------

  const productById =
    await getProductById(slug);

  if (productById) {
    return {
      product: productById,
      isLegacy: true,
    };
  }

  return null;
}

// =====================================================
// SEO Metadata
// =====================================================

export async function generateMetadata({
  params,
}) {
  const { slug } = await params;

  const result =
    await getProduct(slug);

  // ---------------------------------------------------
  // محصول پیدا نشد
  // ---------------------------------------------------

  if (!result) {
    return {
      title:
        `محصول پیدا نشد | ${SITE_NAME}`,

      description:
        "محصول موردنظر در فروشگاه دیجی هیز پیدا نشد.",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { product } = result;

  // ---------------------------------------------------
  // قیمت
  // ---------------------------------------------------

  const price =
    Number(
      discountedPrice(product)
    ) || 0;

  const priceText =
    money(price);

  // ---------------------------------------------------
  // عنوان صفحه
  // ---------------------------------------------------

  const pageTitle =
    `خرید ${product.name} | قیمت ${product.name}`;

  // ---------------------------------------------------
  // توضیحات Meta
  // ---------------------------------------------------

  const description =
    cleanText(
      `خرید ${product.name} از ${SITE_NAME} با قیمت مناسب. ` +
        `مشاهده مشخصات، تصاویر، برند، قیمت و وضعیت موجودی ${product.name}. ` +
        `قیمت فعلی: ${priceText}`
    ).slice(0, 160);

  // ---------------------------------------------------
  // URL جدید
  // ---------------------------------------------------

  const productUrl =
    `${SITE_URL}/product/${product.slug}`;

  // ---------------------------------------------------
  // تصویر اصلی
  // ---------------------------------------------------

  const firstImage =
    Array.isArray(product.images) &&
    product.images.length > 0
      ? product.images[0]
      : "/og-image.jpg";

  const imageUrl =
    getImageUrl(firstImage);

  // ---------------------------------------------------
  // Metadata
  // ---------------------------------------------------

  return {
    title: pageTitle,

    description,

    keywords: [
      product.name,

      `خرید ${product.name}`,

      `قیمت ${product.name}`,

      product.brand,

      "خرید پاد",

      "خرید ویپ",

      "خرید سالت نیکوتین",

      "خرید کارتریج",

      "فروشگاه ویپ",

      "فروشگاه پاد",

      SITE_NAME,
    ].filter(Boolean),

    alternates: {
      canonical: productUrl,
    },

    openGraph: {
      type: "website",

      locale: "fa_IR",

      url: productUrl,

      siteName: SITE_NAME,

      title: pageTitle,

      description,

      images: imageUrl
        ? [
            {
              url: imageUrl,

              width: 1200,

              height: 1200,

              alt: product.name,
            },
          ]
        : [],
    },

    twitter: {
      card: "summary_large_image",

      title: pageTitle,

      description,

      images: imageUrl
        ? [imageUrl]
        : [],
    },

    robots: {
      index:
        product.available !== false,

      follow: true,

      googleBot: {
        index:
          product.available !== false,

        follow: true,

        "max-image-preview":
          "large",

        "max-snippet": -1,

        "max-video-preview": -1,
      },
    },
  };
}

// =====================================================
// Product Page
// =====================================================

export default async function ProductPage({
  params,
}) {
  const { slug } = await params;

  // ---------------------------------------------------
  // دریافت محصول
  // ---------------------------------------------------

  const result =
    await getProduct(slug);

  // ---------------------------------------------------
  // محصول وجود ندارد
  // ---------------------------------------------------

  if (!result) {
    notFound();
  }

  const {
    product,
    isLegacy,
  } = result;

  // ---------------------------------------------------
  // Redirect از URL قدیمی
  //
  // /product/p2
  //        ↓
  // /product/argus-0-7-3ml
  //
  // permanent redirect = 308
  // ---------------------------------------------------

  if (
    isLegacy &&
    product.slug &&
    product.slug !== slug
  ) {
    redirect(
      `/product/${product.slug}`
    );
  }

  // ---------------------------------------------------
  // محصولات مرتبط
  // ---------------------------------------------------

  const related =
    await getRelated(product);

  // ===================================================
  // قیمت
  // ===================================================

  const finalPrice =
    Number(
      discountedPrice(product)
    ) || 0;

  /*
   * قیمت سایت بر اساس تومان است.
   *
   * Schema.org:
   *
   * priceCurrency = IRR
   *
   * بنابراین قیمت تومان × 10
   * به ریال تبدیل می‌شود.
   */

  const priceInRial =
    finalPrice * 10;

  // ===================================================
  // موجودی
  // ===================================================

  const isAvailable =
    product.available !== false;

  const availability =
    isAvailable
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  // ===================================================
  // تصاویر
  // ===================================================

  const imageUrls =
    Array.isArray(product.images)
      ? product.images
          .filter(Boolean)
          .map(getImageUrl)
          .filter(Boolean)
      : [];

  if (
    imageUrls.length === 0
  ) {
    imageUrls.push(
      `${SITE_URL}/og-image.jpg`
    );
  }

  // ===================================================
  // URL اصلی محصول
  // ===================================================

  const productUrl =
    `${SITE_URL}/product/${product.slug}`;

  // ===================================================
  // توضیحات محصول
  // ===================================================

  const productDescription =
    cleanText(
      product.description ||
        `خرید ${product.name} از ${SITE_NAME}.`
    );

  // ===================================================
  // Review های معتبر
  // ===================================================

  const reviews =
    Array.isArray(product.reviews)
      ? product.reviews
          .filter(Boolean)
          .filter((review) => {
            if (!review) {
              return false;
            }

            const rating =
              Number(
                review.rating ??
                  review.reviewRating ??
                  review.score
              );

            const text =
              cleanText(
                review.text ??
                  review.reviewBody ??
                  review.comment
              );

            const name =
              cleanText(
                review.name ??
                  review.author ??
                  review.userName ??
                  "کاربر"
              );

            return (
              rating >= 1 &&
              rating <= 5 &&
              text &&
              name
            );
          })
      : [];

  // ===================================================
  // Review Schema
  // ===================================================

  const reviewSchema =
    reviews.map((review) => {
      const rating =
        Number(
          review.rating ??
            review.reviewRating ??
            review.score
        );

      const reviewBody =
        cleanText(
          review.text ??
            review.reviewBody ??
            review.comment
        );

      const authorName =
        cleanText(
          review.name ??
            review.author ??
            review.userName ??
            "کاربر"
        );

      const datePublished =
        review.datePublished ??
        review.created_at ??
        review.createdAt ??
        null;

      return {
        "@type":
          "Review",

        author: {
          "@type":
            "Person",

          name:
            authorName,
        },

        reviewRating: {
          "@type":
            "Rating",

          ratingValue:
            rating,

          bestRating:
            5,

          worstRating:
            1,
        },

        reviewBody,

        ...(datePublished
          ? {
              datePublished:
                String(
                  datePublished
                ).slice(0, 10),
            }
          : {}),
      };
    });

  // ===================================================
  // Aggregate Rating
  // ===================================================

  const aggregateRating =
    reviews.length > 0 &&
    Number(product.rating) > 0
      ? {
          "@type":
            "AggregateRating",

          ratingValue:
            Number(
              product.rating
            ),

          bestRating:
            5,

          worstRating:
            1,

          reviewCount:
            reviews.length,
        }
      : null;

  // ===================================================
  // Product Schema
  // ===================================================

  const productSchema = {
    "@context":
      "https://schema.org",

    "@type":
      "Product",

    "@id":
      `${productUrl}#product`,

    name:
      product.name,

    url:
      productUrl,

    image:
      imageUrls,

    description:
      productDescription,

    ...(product.brand
      ? {
          brand: {
            "@type":
              "Brand",

            name:
              product.brand,
          },
        }
      : {}),

    offers: {
      "@type":
        "Offer",

      "@id":
        `${productUrl}#offer`,

      url:
        productUrl,

      priceCurrency:
        "IRR",

      price:
        priceInRial,

      availability,

      itemCondition:
        "https://schema.org/NewCondition",

      seller: {
        "@type":
          "Organization",

        name:
          SITE_NAME,

        url:
          SITE_URL,
      },
    },

    ...(aggregateRating
      ? {
          aggregateRating,
        }
      : {}),

    ...(reviewSchema.length > 0
      ? {
          review:
            reviewSchema,
        }
      : {}),
  };

  // ===================================================
  // Breadcrumb
  // ===================================================

  const categoryName =
    product.category ||
    "محصولات";

  const categoryPath =
    product.category
      ? `/shop/${product.category}`
      : "/shop";

  const categoryUrl =
    `${SITE_URL}${categoryPath}`;

  const breadcrumbSchema = {
    "@context":
      "https://schema.org",

    "@type":
      "BreadcrumbList",

    itemListElement: [
      {
        "@type":
          "ListItem",

        position:
          1,

        name:
          "صفحه اصلی",

        item:
          SITE_URL,
      },

      {
        "@type":
          "ListItem",

        position:
          2,

        name:
          "فروشگاه",

        item:
          `${SITE_URL}/shop`,
      },

      {
        "@type":
          "ListItem",

        position:
          3,

        name:
          categoryName,

        item:
          categoryUrl,
      },

      {
        "@type":
          "ListItem",

        position:
          4,

        name:
          product.name,

        item:
          productUrl,
      },
    ],
  };

  // ===================================================
  // خروجی
  // ===================================================

  return (
    <>
      {/* =========================================
          Product Schema
      ========================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              productSchema
            ),
        }}
      />

      {/* =========================================
          Breadcrumb Schema
      ========================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              breadcrumbSchema
            ),
        }}
      />

      {/* =========================================
          Product Content
      ========================================== */}

      <ProductContent
        product={product}
        related={related}
      />
    </>
  );
}
