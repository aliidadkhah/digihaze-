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
  const discountOnly = params?.discount === "1";

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
      {/* عنوان فقط برای سئو/اسکرین‌ریدر؛ روی صفحه نمایش داده نمی‌شود */}
      <h1
        id="shop-page-title"
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
        فروشگاه
      </h1>

      <ShopContent
        products={products}
        initialCategory={category}
        initialSearch={search}
        initialSub={sub}
        initialDiscountOnly={discountOnly}
      />
    </main>
  );
}
