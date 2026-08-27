import { notFound } from "next/navigation";
import ProductContent from "@/components/ProductContent";
import {
  PRODUCTS,
  getProductById,
  getRelated,
  money,
  discountedPrice,
} from "@/lib/data";

// این تابع در زمان build صفحه‌ی هر محصول رو از قبل می‌سازه
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) return { title: "محصول پیدا نشد" };

  const priceText = money(discountedPrice(product));
  const description = `${product.description} قیمت: ${priceText}`.slice(0, 160);

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: [{ url: product.images[0] }],
      type: "website",
    },
    alternates: {
      canonical: `/product/${product.id}`,
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;

  const product = getProductById(id);

  if (!product) notFound();

  const related = getRelated(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "IRR",
      price: discountedPrice(product),
      availability: "https://schema.org/InStock",
    },
    aggregateRating: product.reviewsCount
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.reviewsCount,
        }
      : undefined,
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
