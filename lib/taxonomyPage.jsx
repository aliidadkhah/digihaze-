import Link from "next/link";
import { notFound } from "next/navigation";
import ShopContent from "@/components/ShopContent";
import { getProducts } from "@/lib/products";
import { getCategoriesWithOverrides } from "@/lib/categorySettings";
import { LEGACY_CATEGORY_MAP } from "@/lib/data";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import {
  FLAVORS,
  NICOTINE_LEVELS,
  TAXONOMY_CATEGORIES,
  TAXONOMY_TYPES,
  getTaxonomyEntry,
  filterByTaxonomy,
} from "@/lib/taxonomy";

// =====================================================
// صفحه‌های لندینگ taxonomy:
//   /shop/[category]/flavor/[value]
//   /shop/[category]/nicotine/[value]
// =====================================================

function resolve(rawCategory, type, value) {
  const category = LEGACY_CATEGORY_MAP[rawCategory] || rawCategory;

  if (!TAXONOMY_CATEGORIES.includes(category)) return null;

  const entry = getTaxonomyEntry(type, value);
  if (!entry) return null;

  return { category, entry };
}

export function taxonomyUrl(category, type, value) {
  return `${SITE_URL}/shop/${category}/${TAXONOMY_TYPES[type].segment}/${value}`;
}

// -----------------------------------------------------
// Metadata
// -----------------------------------------------------

export async function buildTaxonomyMetadata(rawCategory, type, value) {
  const resolved = resolve(rawCategory, type, value);

  if (!resolved) {
    return {
      title: `فروشگاه | ${SITE_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  const { category, entry } = resolved;

  const products = filterByTaxonomy(
    await getProducts(),
    category,
    type,
    value
  );

  const title = `${entry.h1} | قیمت و مشخصات`;
  const url = taxonomyUrl(category, type, value);

  // صفحه‌ی خالی نباید ایندکس بشه
  const indexable = products.length > 0;

  return {
    title,
    description: entry.description,

    alternates: { canonical: url },

    openGraph: {
      type: "website",
      locale: "fa_IR",
      url,
      siteName: SITE_NAME,
      title,
      description: entry.description,
      images: [
        {
          url: `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description: entry.description,
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

// -----------------------------------------------------
// لینک‌های داخلی به صفحات taxonomy (فقط مواردی که محصول دارند)
// -----------------------------------------------------

export function TaxonomyLinks({
  products,
  category,
  currentType,
  currentValue,
  title = "دسته‌بندی بر اساس طعم و نیکوتین",
}) {
  const groups = [
    { type: "flavor", label: "طعم", items: FLAVORS },
    { type: "nicotine", label: "قدرت نیکوتین", items: NICOTINE_LEVELS },
  ]
    .map((g) => ({
      ...g,
      links: Object.values(g.items)
        .filter(
          (item) =>
            filterByTaxonomy(products, category, g.type, item.id).length > 0 &&
            !(g.type === currentType && item.id === currentValue)
        )
        .map((item) => ({
          key: `${g.type}-${item.id}`,
          label: item.label,
          href: `/shop/${category}/${TAXONOMY_TYPES[g.type].segment}/${item.id}`,
        })),
    }))
    .filter((g) => g.links.length > 0);

  if (groups.length === 0) return null;

  return (
    <nav
      aria-label={title}
      dir="rtl"
      style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px 40px" }}
    >
      <h2
        style={{
          fontFamily: "var(--font-primary)",
          fontSize: 16,
          fontWeight: 800,
          color: "var(--text-hi)",
          margin: "0 0 14px",
        }}
      >
        {title}
      </h2>

      {groups.map((g) => (
        <div
          key={g.type}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: 12.5,
              color: "var(--text-mut)",
              minWidth: 84,
            }}
          >
            {g.label}:
          </span>

          {g.links.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              style={{
                textDecoration: "none",
                fontFamily: "var(--font-primary)",
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--text-hi)",
                background: "var(--surface)",
                border: "1px solid var(--surface2)",
                borderRadius: 999,
                padding: "6px 14px",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

// -----------------------------------------------------
// Page body
// -----------------------------------------------------

export async function TaxonomyPageBody({ rawCategory, type, value }) {
  const resolved = resolve(rawCategory, type, value);

  if (!resolved) notFound();

  const { category, entry } = resolved;

  const categories = await getCategoriesWithOverrides();
  const categoryDef = categories.find((c) => c.id === category);

  if (!categoryDef) notFound();

  const allProducts = await getProducts();
  const products = filterByTaxonomy(allProducts, category, type, value);

  // ترکیب بدون محصول → ۴۰۴ (صفحه‌ی بی‌ارزش نسازیم)
  if (products.length === 0) notFound();

  const url = taxonomyUrl(category, type, value);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "صفحه اصلی", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "فروشگاه",
        item: `${SITE_URL}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryDef.label,
        item: `${SITE_URL}/shop/${category}`,
      },
      { "@type": "ListItem", position: 4, name: entry.h1, item: url },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name: entry.h1,
    description: entry.description,
    url,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <main dir="rtl" aria-labelledby="taxonomy-page-title">
        {/* H1 مرئی + مسیر بازگشت به دسته */}
        <header
          style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px 0" }}
        >
          <p
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: 12.5,
              color: "var(--text-mut)",
              margin: "0 0 8px",
            }}
          >
            <Link href="/shop" style={{ color: "inherit" }}>
              فروشگاه
            </Link>
            {" / "}
            <Link href={`/shop/${category}`} style={{ color: "inherit" }}>
              {categoryDef.label}
            </Link>
          </p>

          <h1
            id="taxonomy-page-title"
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: 26,
              fontWeight: 800,
              color: "var(--text-hi)",
              margin: 0,
            }}
          >
            {entry.h1}
          </h1>
        </header>

        <ShopContent
          products={products}
          categories={categories}
          initialCategory={category}
          initialSearch=""
          initialSub=""
        />

        {/* متن توضیحی یکتا */}
        <section
          aria-label={`توضیحات ${entry.h1}`}
          style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px 40px" }}
        >
          <h2
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: 19,
              fontWeight: 800,
              color: "var(--text-hi)",
              margin: "0 0 14px",
            }}
          >
            درباره‌ی {entry.label}
          </h2>

          {entry.intro.map((para, i) => (
            <p
              key={i}
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: 14,
                lineHeight: 2,
                color: "var(--text-lo)",
                margin: "0 0 12px",
              }}
            >
              {para}
            </p>
          ))}
        </section>

        {/* سوالات متداول */}
        {entry.faq?.length > 0 && (
          <section
            aria-label="سوالات متداول"
            style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px 40px" }}
          >
            <h2
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: 19,
                fontWeight: 800,
                color: "var(--text-hi)",
                margin: "0 0 14px",
              }}
            >
              سوالات متداول
            </h2>

            {entry.faq.map((item, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <h3
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: 14.5,
                    fontWeight: 700,
                    color: "var(--text-hi)",
                    margin: "0 0 4px",
                  }}
                >
                  {item.q}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: 13.5,
                    lineHeight: 1.9,
                    color: "var(--text-lo)",
                    margin: 0,
                  }}
                >
                  {item.a}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* لینک داخلی به بقیه‌ی صفحات taxonomy */}
        <TaxonomyLinks
          products={allProducts}
          category={category}
          currentType={type}
          currentValue={value}
          title="سایر دسته‌بندی‌های سالت نیکوتین"
        />
      </main>
    </>
  );
}
