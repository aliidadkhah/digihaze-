import ShopContent from "@/components/ShopContent";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "فروشگاه پاد، ویپ، سالت و کارتریج",

  description:
    "خرید پاد، ویپ، سالت نیکوتین، کارتریج و لوازم جانبی ویپینگ با قیمت مناسب از دیجی هیز. مشاهده مشخصات، قیمت و محصولات موجود.",

  keywords: [
    "خرید پاد",
    "خرید ویپ",
    "خرید سالت نیکوتین",
    "خرید کارتریج",
    "قیمت پاد",
    "قیمت ویپ",
    "قیمت سالت نیکوتین",
    "لوازم ویپینگ",
    "فروشگاه ویپ",
    "فروشگاه پاد",
    "دیجی هیز",
  ],

  alternates: {
    canonical: `${SITE_URL}/shop`,
  },

  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: `${SITE_URL}/shop`,
    siteName: SITE_NAME,

    title:
      `${SITE_NAME} | فروشگاه پاد، ویپ، سالت و کارتریج`,

    description:
      "خرید پاد، ویپ، سالت نیکوتین، کارتریج و لوازم جانبی ویپینگ از دیجی هیز.",

    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt:
          "فروشگاه دیجی هیز | پاد، ویپ، سالت و کارتریج",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      `${SITE_NAME} | فروشگاه پاد، ویپ، سالت و کارتریج`,

    description:
      "خرید پاد، ویپ، سالت نیکوتین، کارتریج و لوازم جانبی ویپینگ از دیجی هیز.",

    images: [`${SITE_URL}/og-image.jpg`],
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

export default async function ShopPage({
  searchParams,
}) {
  const params = await searchParams;

  const category =
    params?.category || "all";

  const search =
    params?.search || "";

  const sub =
    params?.sub || "";

  return (
    <main
      dir="rtl"
      aria-labelledby="shop-page-title"
    >
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
        فروشگاه پاد، ویپ، سالت نیکوتین و کارتریج
      </h1>

      <ShopContent
        initialCategory={category}
        initialSearch={search}
        initialSub={sub}
      />
    </main>
  );
}
