import ShopContent from "@/components/ShopContent";
import { CATEGORIES } from "@/lib/data";
import { notFound } from "next/navigation";
import { SITE_URL, SITE_NAME } from "@/lib/site";

// =====================================================
// SEO دسته‌بندی‌ها
// =====================================================

const CATEGORY_SEO = {
  pod: {
    title: "خرید پاد ویپ | قیمت و مشخصات انواع پاد",
    description:
      "خرید انواع پاد ویپ با بررسی مشخصات، قیمت و مدل‌های مختلف در دیجی هیز. مشاهده محصولات موجود و انتخاب پاد مناسب.",
  },

  salt: {
    title: "خرید سالت نیکوتین | قیمت انواع سالت ویپ",
    description:
      "خرید سالت نیکوتین با تنوع طعم و برند. مشاهده قیمت، مشخصات و مدل‌های مختلف سالت ویپ در دیجی هیز.",
  },

  device: {
    title: "خرید دستگاه ویپ | قیمت و مشخصات دستگاه ویپ",
    description:
      "خرید دستگاه ویپ با مشاهده مشخصات، قیمت و مدل‌های مختلف. مقایسه و انتخاب دستگاه ویپ مناسب در دیجی هیز.",
  },

  cartridge: {
    title: "خرید کارتریج ویپ | قیمت و مشخصات کارتریج",
    description:
      "خرید انواع کارتریج ویپ با مشاهده قیمت، مشخصات و مدل‌های مختلف. بررسی و انتخاب کارتریج مناسب در دیجی هیز.",
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

    keywords: [
      seo.title,
      `خرید ${category}`,
      `قیمت ${category}`,
      "دیجی هیز",
      "فروشگاه ویپ",
      "فروشگاه پاد",
    ],

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

        name: seo?.title || category,

        item: categoryUrl,
      },
    ],
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
          محتوای فروشگاه
      ========================================== */}

      <ShopContent
        initialCategory={category}
        initialSearch=""
        initialSub=""
      />
    </>
  );
}
