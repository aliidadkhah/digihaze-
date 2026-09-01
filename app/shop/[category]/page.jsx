import ShopContent from "@/components/ShopContent";
import { CATEGORIES } from "@/lib/data";
import { notFound } from "next/navigation";
import { SITE_URL, SITE_NAME } from "@/lib/site";

// =====================================================
// SEO دسته‌بندی‌ها
// =====================================================

const CATEGORY_SEO = {
  "pod-system": {
    name: "پاد ویپ",

    title: "خرید پاد ویپ | قیمت و مشخصات انواع پاد",

    description:
      "خرید انواع پاد ویپ از دیجی هیز؛ مشاهده قیمت، مشخصات، برندها و مدل‌های مختلف پاد و انتخاب محصول مناسب.",

    keywords: [
      "خرید پاد ویپ",
      "خرید پاد",
      "قیمت پاد",
      "قیمت پاد ویپ",
      "انواع پاد ویپ",
      "پاد ویپ",
      "فروش پاد",
    ],
  },

  "salt-nicotine": {
    name: "سالت نیکوتین",

    title: "خرید سالت نیکوتین | قیمت و انواع سالت ویپ",

    description:
      "خرید سالت نیکوتین از دیجی هیز؛ مشاهده انواع طعم، برند، نیکوتین، قیمت و مشخصات سالت ویپ و انتخاب محصول مناسب.",

    keywords: [
      "خرید سالت نیکوتین",
      "خرید سالت ویپ",
      "قیمت سالت نیکوتین",
      "قیمت سالت",
      "انواع سالت نیکوتین",
      "سالت ویپ",
      "فروش سالت نیکوتین",
    ],
  },

  "disposable-pod": {
    name: "دستگاه ویپ",

    title: "خرید دستگاه ویپ | قیمت و مشخصات انواع ویپ",

    description:
      "خرید دستگاه ویپ از دیجی هیز؛ مشاهده مدل‌ها، مشخصات فنی، قیمت و محصولات موجود و مقایسه انواع دستگاه ویپ.",

    keywords: [
      "خرید دستگاه ویپ",
      "خرید ویپ",
      "قیمت دستگاه ویپ",
      "قیمت ویپ",
      "انواع دستگاه ویپ",
      "دستگاه ویپ",
      "فروش ویپ",
    ],
  },

  cartridge: {
    name: "کارتریج ویپ",

    title: "خرید کارتریج ویپ | قیمت و مشخصات انواع کارتریج",

    description:
      "خرید انواع کارتریج ویپ از دیجی هیز؛ مشاهده قیمت، مشخصات، مدل‌های مختلف و کارتریج سازگار با دستگاه‌های مختلف.",

    keywords: [
      "خرید کارتریج ویپ",
      "خرید کارتریج",
      "قیمت کارتریج ویپ",
      "قیمت کارتریج",
      "انواع کارتریج ویپ",
      "کارتریج پاد",
      "فروش کارتریج",
    ],
  },
};

// =====================================================
// Metadata
// =====================================================

export async function generateMetadata({ params }) {
  const { category } = await params;

  const seo = CATEGORY_SEO[category];

  if (!seo) {
    return {
      title: `فروشگاه | ${SITE_NAME}`,

      description:
        "مشاهده محصولات و دسته‌بندی‌های فروشگاه دیجی هیز.",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const categoryUrl =
    `${SITE_URL}/shop/${category}`;

  return {
    title: seo.title,

    description: seo.description,

    keywords: seo.keywords,

    alternates: {
      canonical: categoryUrl,
    },

    openGraph: {
      type: "website",

      locale: "fa_IR",

      url: categoryUrl,

      siteName: SITE_NAME,

      title: seo.title,

      description: seo.description,

      images: [
        {
          url: `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: seo.title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",

      title: seo.title,

      description: seo.description,

      images: [
        `${SITE_URL}/og-image.jpg`,
      ],
    },

    robots: {
      index: true,

      follow: true,

      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

// =====================================================
// Category Page
// =====================================================

export default async function CategoryShopPage({
  params,
}) {
  const { category } = await params;

  // بررسی معتبر بودن دسته‌بندی
  const exists = CATEGORIES.some(
    (item) => item.id === category
  );

  if (!exists) {
    notFound();
  }

  const seo = CATEGORY_SEO[category];

  const categoryUrl =
    `${SITE_URL}/shop/${category}`;

  // ===================================================
  // Breadcrumb Schema
  // ===================================================

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

        name: seo?.name || category,

        item: categoryUrl,
      },
    ],
  };

  // ===================================================
  // CollectionPage Schema
  // ===================================================

  const collectionSchema = {
    "@context": "https://schema.org",

    "@type": "CollectionPage",

    "@id": `${categoryUrl}#collection`,

    name:
      seo?.title ||
      `خرید ${category}`,

    description:
      seo?.description ||
      `مشاهده محصولات ${category} در ${SITE_NAME}.`,

    url: categoryUrl,

    isPartOf: {
      "@type": "WebSite",

      "@id": `${SITE_URL}/#website`,

      name: SITE_NAME,

      url: SITE_URL,
    },

    inLanguage: "fa-IR",
  };

  return (
    <>
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
          CollectionPage Schema
      ========================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              collectionSchema
            ),
        }}
      />

      {/* =========================================
          Category Content
      ========================================== */}

      <main
        dir="rtl"
        aria-labelledby="category-page-title"
      >
        <h1
          id="category-page-title"
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: 0,
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          {seo?.title || `خرید ${category}`}
        </h1>

        <ShopContent
          initialCategory={category}
          initialSearch=""
          initialSub=""
        />
      </main>
    </>
  );
}
