import ShopContent from "@/components/ShopContent";

export const metadata = {
  title: "فروشگاه پاد، ویپ، سالت و کارتریج",

  description:
    "خرید پاد، ویپ، سالت نیکوتین، کارتریج و لوازم جانبی ویپینگ با قیمت مناسب و ضمانت اصالت کالا از دیجی هیز.",

  keywords: [
    "خرید پاد",
    "خرید ویپ",
    "خرید سالت نیکوتین",
    "خرید کارتریج",
    "قیمت پاد",
    "قیمت ویپ",
    "قیمت سالت",
    "لوازم ویپینگ",
    "فروشگاه ویپ",
    "دیجی هیز",
  ],

  alternates: {
    canonical: "https://digihaze.ir/shop",
  },

  openGraph: {
    title: "فروشگاه پاد، ویپ، سالت و کارتریج | دیجی هیز",

    description:
      "خرید پاد، ویپ، سالت نیکوتین، کارتریج و لوازم جانبی ویپینگ از دیجی هیز.",

    url: "https://digihaze.ir/shop",

    siteName: "دیجی هیز",

    locale: "fa_IR",

    type: "website",
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
    <ShopContent
      initialCategory={category}
      initialSearch={search}
      initialSub={sub}
    />
  );
}
