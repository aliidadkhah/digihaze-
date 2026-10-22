import Link from "next/link";
import ShopContent from "@/components/ShopContent";
import { getCategorySeoText } from "@/lib/categorySeoText";
import { LEGACY_CATEGORY_MAP } from "@/lib/data";
import { getProducts } from "@/lib/products";
import { getCategoriesWithOverrides } from "@/lib/categorySettings";
import { notFound } from "next/navigation";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { TaxonomyLinks } from "@/lib/taxonomyPage";
import { TAXONOMY_CATEGORIES } from "@/lib/taxonomy";

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

// تطبیق برند محصول با برچسب زیردسته (همون منطق فیلتر ShopContent)
function normalizeBrand(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function brandDisplayName(subDef) {
  if (!subDef) return "";
  return subDef.nameFa
    ? `${subDef.nameFa} (${subDef.label})`
    : subDef.label;
}

// =====================================================
// Metadata (مشترک بین /shop/[category] و /shop/[category]/[sub])
// =====================================================

export async function buildCategoryMetadata(rawCategory, sub = "") {
  const category = LEGACY_CATEGORY_MAP[rawCategory] || rawCategory;

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

  // -------------------------------------------------
  // صفحه‌ی برند (/shop/دسته/برند): title، description و canonical
  // مخصوص خودش دارد (قبلاً canonical به صفحه‌ی دسته اشاره می‌کرد و
  // صفحه‌ی برند هیچ‌وقت جدا رتبه نمی‌گرفت). اگه برند محصولی نداشته
  // باشه ایندکس نمی‌شه.
  // -------------------------------------------------
  let categoryUrl = `${SITE_URL}/shop/${category}`;
  let pageTitle = seo.title;
  let pageDescription = seo.description;
  let pageKeywords = seo.keywords;
  let indexable = true;

  if (sub) {
    const categories = await getCategoriesWithOverrides();
    const categoryDef = categories.find((c) => c.id === category);
    const subDef = categoryDef?.subcategories?.find((x) => x.id === sub);

    if (!subDef) {
      return {
        title: `فروشگاه | ${SITE_NAME}`,
        robots: { index: false, follow: false },
      };
    }

    const brandName = brandDisplayName(subDef);

    categoryUrl = `${SITE_URL}/shop/${category}/${sub}`;
    pageTitle = `خرید ${seo.name} ${brandName} | قیمت و مشخصات`;
    pageDescription = `خرید ${seo.name} ${brandName} از ${SITE_NAME}؛ مشاهده قیمت، مدل‌ها و مشخصات محصولات اورجینال ${subDef.label}.`;
    pageKeywords = [
      `خرید ${seo.name} ${subDef.label}`,
      `قیمت ${seo.name} ${subDef.label}`,
      `${subDef.label}`,
    ];

    const products = await getProducts();
    const label = normalizeBrand(subDef.label);

    indexable = products.some(
      (p) =>
        p &&
        p.deleted !== true &&
        (LEGACY_CATEGORY_MAP[p.category] || p.category) === category &&
        normalizeBrand(p.brand) === label
    );
  }

  return {
    title: pageTitle,

    description: pageDescription,

    keywords: pageKeywords,

    alternates: {
      canonical: categoryUrl,
    },

    openGraph: {
      type: "website",

      locale: "fa_IR",

      url: categoryUrl,

      siteName: SITE_NAME,

      title: pageTitle,

      description: pageDescription,

      images: [
        {
          url: `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",

      title: pageTitle,

      description: pageDescription,

      images: [`${SITE_URL}/og-image.jpg`],
    },

    robots: {
      index: indexable,

      follow: true,

      googleBot: {
        index: indexable,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

// =====================================================
// متن سئو زیر محصولات (دسته / برند)
// =====================================================

function CategorySeoText({ content }) {
  const pStyle = {
    color: "var(--text-lo)",
    fontSize: "14.5px",
    lineHeight: 2,
    margin: "0 0 12px",
  };

  return (
    <section
      dir="rtl"
      aria-label={content.title}
      style={{
        maxWidth: "1180px",
        margin: "48px auto 0",
        padding: "0 20px 70px",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: "18px",
          padding: "28px 26px",
        }}
      >
        <h2
          style={{
            color: "var(--text-hi)",
            fontSize: "20px",
            fontWeight: 800,
            margin: "0 0 14px",
          }}
        >
          {content.title}
        </h2>

        {(content.intro || []).map((text, i) => (
          <p key={`intro-${i}`} style={pStyle}>
            {text}
          </p>
        ))}

        {(content.sections || []).map((section) => (
          <div key={section.heading} style={{ marginTop: "20px" }}>
            <h3
              style={{
                color: "var(--text-hi)",
                fontSize: "16px",
                fontWeight: 700,
                margin: "0 0 8px",
              }}
            >
              {section.heading}
            </h3>

            {(section.paragraphs || []).map((text, i) => (
              <p key={`${section.heading}-${i}`} style={pStyle}>
                {text}
              </p>
            ))}
          </div>
        ))}

        {content.links?.length > 0 && (
          <p style={{ ...pStyle, marginTop: "18px" }}>
            بیشتر بخوانید:{" "}
            {content.links.map((link, i) => (
              <span key={link.href}>
                {i > 0 && " | "}
                <Link
                  href={link.href}
                  style={{ color: "var(--neon-blue)", fontWeight: 600 }}
                >
                  {link.text}
                </Link>
              </span>
            ))}
          </p>
        )}

        {content.note && (
          <p
            style={{
              color: "var(--text-mut)",
              fontSize: "12.5px",
              lineHeight: 1.9,
              margin: "16px 0 0",
            }}
          >
            {content.note}
          </p>
        )}
      </div>
    </section>
  );
}

// =====================================================
// Category Page Body (مشترک بین /shop/[category] و /shop/[category]/[sub])
// =====================================================

export async function CategoryPageBody({ rawCategory, sub = "" }) {
  // اگر شناسه‌ی قدیمی بود (pod/device/salt)، بدون ریدایرکت HTTP
  // (که روی Cloudflare می‌تونست باعث گیرکردن/لوپ بشه)،
  // مستقیم محتوای دسته‌بندی جدید رو رندر می‌کنیم.
  const category = LEGACY_CATEGORY_MAP[rawCategory] || rawCategory;

  const categories = await getCategoriesWithOverrides();

  // بررسی معتبر بودن دسته‌بندی
  const exists = categories.some((item) => item.id === category);

  if (!exists) {
    notFound();
  }

  // بررسی معتبر بودن زیردسته (اگر زیردسته‌ای در URL آمده باشد)
  if (sub) {
    const categoryDef = categories.find((item) => item.id === category);

    const subExists = categoryDef?.subcategories?.some(
      (s) => s.id === sub
    );

    if (!subExists) {
      notFound();
    }
  }

  const seo = CATEGORY_SEO[category];

  const products = await getProducts();

  const subDef = sub
    ? categories
        .find((item) => item.id === category)
        ?.subcategories?.find((x) => x.id === sub)
    : null;

  const brandName = brandDisplayName(subDef);

  const seoText = getCategorySeoText(category, subDef?.label || "");

  const pageHeading = sub
    ? `خرید ${seo?.name || category} ${brandName}`
    : seo?.title || `خرید ${category}`;

  const categoryUrl = sub
    ? `${SITE_URL}/shop/${category}/${sub}`
    : `${SITE_URL}/shop/${category}`;

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

        item: `${SITE_URL}/shop/${category}`,
      },

      ...(sub
        ? [
            {
              "@type": "ListItem",

              position: 4,

              name: brandName,

              item: categoryUrl,
            },
          ]
        : []),
    ],
  };

  // ===================================================
  // CollectionPage Schema
  // ===================================================

  const collectionSchema = {
    "@context": "https://schema.org",

    "@type": "CollectionPage",

    "@id": `${categoryUrl}#collection`,

    name: pageHeading,

    description:
      seo?.description || `مشاهده محصولات ${category} در ${SITE_NAME}.`,

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
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      {/* =========================================
          CollectionPage Schema
      ========================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />

      {/* =========================================
          Category Content
      ========================================== */}

      <main dir="rtl" aria-labelledby="category-page-title">
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
          {pageHeading}
        </h1>

        <ShopContent
          products={products}
          categories={categories}
          initialCategory={category}
          initialSearch=""
          initialSub={sub}
        />

        {/* لینک داخلی به صفحات طعم و نیکوتین */}
        {!sub && TAXONOMY_CATEGORIES.includes(category) && (
          <TaxonomyLinks products={products} category={category} />
        )}

        {/* متن سئو زیر محصولات */}
        {seoText && <CategorySeoText content={seoText} />}
      </main>
    </>
  );
}
