import { notFound } from "next/navigation";
import ProductContent from "@/components/ProductContent";
import { money, discountedPrice } from "@/lib/data";
import { getProductById, getRelated } from "@/lib/products";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

// =====================================================
// SEO / Metadata
// =====================================================

export async function generateMetadata({ params }) {
  const { id } = await params;

  const product = await getProductById(id);

  // محصول پیدا نشد
  if (!product) {
    return {
      title: `محصول پیدا نشد | ${SITE_NAME}`,
      description:
        "محصول موردنظر در فروشگاه دیجی هیز پیدا نشد.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // قیمت نهایی
  const price = discountedPrice(product);
  const priceText = money(price);

  // توضیحات SEO
  const description =
    `${product.name} | خرید ${product.name} با بهترین قیمت. ` +
    `مشاهده مشخصات، قیمت و وضعیت موجودی محصول در ${SITE_NAME}. ` +
    `قیمت فعلی: ${priceText}`;

  const cleanDescription = description
    .replace(/\s+/g, " ")
    .slice(0, 160);

  // URL محصول
  const productUrl =
    `${SITE_URL}/product/${product.id}`;

  // تصویر اصلی محصول
  const image =
    Array.isArray(product.images) &&
    product.images.length > 0
      ? product.images[0]
      : "/og-image.jpg";

  // تبدیل URL نسبی به URL کامل
  const imageUrl = image.startsWith("http")
    ? image
    : `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`;

  const pageTitle =
    `خرید ${product.name} | قیمت ${product.name}`;

  return {
    // =================================================
    // عنوان
    // =================================================

    title: pageTitle,

    // =================================================
    // توضیحات
    // =================================================

    description: cleanDescription,

    // =================================================
    // Canonical
    // =================================================

    alternates: {
      canonical: productUrl,
    },

    // =================================================
    // Open Graph
    // =================================================

    openGraph: {
      title: pageTitle,

      description: cleanDescription,

      url: productUrl,

      siteName: SITE_NAME,

      locale: "fa_IR",

      type: "website",

      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 1200,
          alt: product.name,
        },
      ],
    },

    // =================================================
    // Twitter
    // =================================================

    twitter: {
      card: "summary_large_image",

      title: pageTitle,

      description: cleanDescription,

      images: [imageUrl],
    },

    // =================================================
    // Robots
    // =================================================

    robots: {
      // محصول ناموجود را ایندکس نمی‌کنیم
      index: product.available !== false,

      // لینک‌های صفحه همچنان قابل دنبال کردن هستند
      follow: true,

      googleBot: {
        index: product.available !== false,
        follow: true,
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
  const { id } = await params;

  // دریافت محصول از Supabase
  const product = await getProductById(id);

  // اگر محصول وجود نداشت
  if (!product) {
    notFound();
  }

  // محصولات مرتبط
  const related = await getRelated(product);

  // ===================================================
  // قیمت
  // ===================================================

  /*
   * قیمت سایت بر اساس تومان است.
   *
   * Schema.org با IRR کار می‌کند،
   * بنابراین تومان × 10 = ریال
   */

  const finalPrice =
    Number(discountedPrice(product)) || 0;

  const priceInRial =
    finalPrice * 10;

  // ===================================================
  // موجودی
  // ===================================================

  const availability =
    product.available === false
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock";

  // ===================================================
  // تصاویر
  // ===================================================

  const imageUrls =
    Array.isArray(product.images)
      ? product.images
          .filter(Boolean)
          .map((image) =>
            image.startsWith("http")
              ? image
              : `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`
          )
      : [];

  // ===================================================
  // URL محصول
  // ===================================================

  const productUrl =
    `${SITE_URL}/product/${product.id}`;

  // ===================================================
  // JSON-LD
  // ===================================================

  const jsonLd = {
    "@context": "https://schema.org",

    "@type": "Product",

    "@id": `${productUrl}#product`,

    name: product.name,

    url: productUrl,

    image: imageUrls,

    description:
      product.description || "",

    // برند
    ...(product.brand
      ? {
          brand: {
            "@type": "Brand",
            name: product.brand,
          },
        }
      : {}),

    // پیشنهاد خرید
    offers: {
      "@type": "Offer",

      url: productUrl,

      priceCurrency: "IRR",

      price: priceInRial,

      availability,

      itemCondition:
        "https://schema.org/NewCondition",

      seller: {
        "@type": "Organization",

        name: SITE_NAME,

        url: SITE_URL,
      },
    },

    // امتیاز کاربران
    ...(Number(product.reviewsCount) > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",

            ratingValue:
              Number(product.rating) || 0,

            bestRating: 5,

            worstRating: 1,

            reviewCount:
              Number(product.reviewsCount),
          },
        }
      : {}),
  };

  // ===================================================
  // خروجی صفحه
  // ===================================================

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <ProductContent
        product={product}
        related={related}
      />
    </>
  );
}
