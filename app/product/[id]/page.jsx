import { notFound } from "next/navigation";
import ProductContent from "@/components/ProductContent";
import { money, discountedPrice } from "@/lib/data";
import { getProductById, getRelated } from "@/lib/products";

export const dynamic = "force-dynamic";

const SITE_URL = "https://digihaze.ir";

export async function generateMetadata({ params }) {
  const { id } = await params;

  const product = await getProductById(id);

  if (!product) {
    return {
      title: "محصول پیدا نشد | دیجی هیز",
      description: "محصول موردنظر پیدا نشد.",
    };
  }

  const price = discountedPrice(product);
  const priceText = money(price);

  const description =
    `${product.name} | خرید ${product.name} با بهترین قیمت. ` +
    `مشاهده مشخصات، قیمت و وضعیت موجودی محصول در دیجی هیز. ` +
    `قیمت فعلی: ${priceText}`;

  const cleanDescription = description.slice(0, 160);

  const productUrl = `${SITE_URL}/product/${product.id}`;

  const image =
    Array.isArray(product.images) &&
    product.images.length > 0
      ? product.images[0]
      : "/og-image.jpg";

  const imageUrl = image.startsWith("http")
    ? image
    : `${SITE_URL}${image}`;

  return {
    title: `خرید ${product.name} | قیمت ${product.name}`,
    description: cleanDescription,

    alternates: {
      canonical: productUrl,
    },

    openGraph: {
      title: `خرید ${product.name} | قیمت ${product.name}`,
      description: cleanDescription,
      url: productUrl,
      siteName: "دیجی هیز",
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

    twitter: {
      card: "summary_large_image",
      title: `خرید ${product.name} | قیمت ${product.name}`,
      description: cleanDescription,
      images: [imageUrl],
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;

  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const related = await getRelated(product);

  /*
   * قیمت‌ها در سایت بر اساس تومان هستند.
   * Schema.org برای priceCurrency=IRR
   * قیمت را به ریال می‌خواهد.
   */
  const finalPrice = discountedPrice(product);
  const priceInRial = finalPrice * 10;

  const originalPriceInRial =
    product.price * 10;

  const availability =
    product.available === false
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock";

  const imageUrls = Array.isArray(product.images)
    ? product.images.map((image) =>
        image.startsWith("http")
          ? image
          : `${SITE_URL}${image}`
      )
    : [];

  const productUrl =
    `${SITE_URL}/product/${product.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",

    "@id": `${productUrl}#product`,

    name: product.name,

    url: productUrl,

    image: imageUrls,

    description: product.description,

    brand: {
      "@type": "Brand",
      name: product.brand,
    },

    offers: {
      "@type": "Offer",

      url: productUrl,

      priceCurrency: "IRR",

      price: priceInRial,

      ...(product.discount > 0
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              priceCurrency: "IRR",
              price: priceInRial,
              referenceQuantity: {
                "@type": "QuantitativeValue",
                value: 1,
              },
            },
          }
        : {}),

      ...(product.discount > 0
        ? {
            highPrice: originalPriceInRial,
          }
        : {}),

      availability,

      itemCondition:
        "https://schema.org/NewCondition",

      seller: {
        "@type": "Organization",
        name: "دیجی هیز",
        url: SITE_URL,
      },
    },

    ...(product.reviewsCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            bestRating: 5,
            worstRating: 1,
            reviewCount: product.reviewsCount,
          },
        }
      : {}),
  };

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
