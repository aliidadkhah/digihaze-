import ShopContent from "@/components/ShopContent";
import { getProducts } from "@/lib/products";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "فروشگاه",

  description:
    "مشاهده محصولات و مشخصات آن‌ها در فروشگاه دیجی هیز.",

  alternates: {
    canonical: `${SITE_URL}/shop`,
  },

  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: `${SITE_URL}/shop`,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | فروشگاه`,
    description:
      "مشاهده محصولات و مشخصات آن‌ها در فروشگاه دیجی هیز.",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} | فروشگاه`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | فروشگاه`,
    description:
      "مشاهده محصولات و مشخصات آن‌ها در فروشگاه دیجی هیز.",
    images: [`${SITE_URL}/og-image.jpg`],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default async function ShopPage({
  searchParams,
}) {
  const params = await searchParams;

  const category = params?.category || "all";
  const search = params?.search || "";
  const sub = params?.sub || "";

  /*
   * مهم:
   * محصولات روی Server دریافت می‌شوند.
   * بنابراین محصولات در HTML اولیه صفحه وجود خواهند داشت.
   */
  const products = await getProducts();

  return (
    <main
      dir="rtl"
      aria-labelledby="shop-page-title"
    >
      <h1
        id="shop-page-title"
        style={{
          fontFamily: "Vazirmatn",
          fontWeight: 800,
          fontSize: 28,
          maxWidth: 1180,
          margin: "0 auto",
          padding: "40px 20px 0",
        }}
      >
        فروشگاه
      </h1>

      <ShopContent
        products={products}
        initialCategory={category}
        initialSearch={search}
        initialSub={sub}
      />
    </main>
  );
}
