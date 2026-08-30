import { notFound } from "next/navigation";
import ProductContent from "@/components/ProductContent";
import { money, discountedPrice } from "@/lib/data";
import { getProductById, getRelated } from "@/lib/products";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

// =====================================================
// SEO Metadata
// =====================================================

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: `محصول پیدا نشد | ${SITE_NAME}`,
      description: "محصول موردنظر در فروشگاه دیجی هیز پیدا نشد.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const price = Number(discountedPrice(product)) || 0;
  const priceText = money(price);

  const pageTitle = `خرید ${product.name} | قیمت ${product.name}`;

  const description = (
    `خرید ${product.name} با بهترین قیمت از ${SITE_NAME}. ` +
    `مشاهده مشخصات، قیمت، تصاویر و وضعیت موجودی ${product.name}. ` +
    `قیمت فعلی: ${priceText}`
  )
    .replace(/\s+/g, " ")
    .slice(0, 160);

  const productUrl = `${SITE_URL}/product/${product.id}`;

  const image =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : "/og-image.jpg";

  const imageUrl = image.startsWith("http")
    ? image
    : `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`;

  return {
    title: pageTitle,

    description,

    keywords: [
      product.name,
      `خرید ${product.name}`,
      `قیمت ${product.name}`,
      product.brand,
      "پاد",
      "ویپ",
      "سالت نیکوتین",
      "کارتریج",
      "دیجی هیز",
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
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 1200,
          alt: product.name,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [imageUrl],
    },

    robots: {
      index: product.available !== false,
      follow: true,

      googleBot: {
        index: product.available !== false,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

// =====================================================
// Product Page
// =====================================================

export default async function ProductPage({ params }) {
  const { id } = await params;

  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const related = await getRelated(product);

  // ===================================================
  // قیمت
  // ===================================================

  const finalPrice = Number(discountedPrice(product)) || 0;

  // سایت با تومان کار می‌کند
  // Schema.org با ریال
  const priceInRial = finalPrice * 10;

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

  const productUrl = `${SITE_URL}/product/${product.id}`;

  // ===================================================
  // Product Schema
  // ===================================================

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",

    "@id": `${productUrl}#product`,

    name: product.name,

    url: productUrl,

    image: imageUrls,

    description: product.description || "",

    ...(product.brand
      ? {
          brand: {
            "@type": "Brand",
            name: product.brand,
          },
        }
      : {}),

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

    ...(Number(product.reviewsCount) > 0 &&
    Number(product.rating) > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(product.rating),
            bestRating: 5,
            worstRating: 1,
            reviewCount: Number(product.reviewsCount),
          },
        }
      : {}),
  };

  // ===================================================
  // Breadcrumb Schema
  // ===================================================

  const categoryName = product.category || "محصولات";

  const categoryPath =
    product.category
      ? `/shop/${product.category}`
      : "/shop";

  const breadcrumbSchema = {
    "@context": "https://schema.org",

    "@type": "BreadcrumbList",

    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "صفحه اصلی",
        item: SITE_URL,
      },

      {
        "@type": "ListItem",
        position: 2,
        name: "فروشگاه",
        item: `${SITE_URL}/shop`,
      },

      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: `${SITE_URL}${categoryPath}`,
      },

      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  // ===================================================
  // خروجی
  // ===================================================

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <ProductContent
        product={product}
        related={related}
      />
    </>
  );
}
