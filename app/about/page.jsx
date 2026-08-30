import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "درباره دیجی هیز | فروشگاه پاد و ویپ",

  description:
    "درباره دیجی هیز؛ فروشگاه آنلاین پاد، ویپ، سالت نیکوتین، کارتریج و لوازم جانبی ویپینگ.",

  alternates: {
    canonical: `${SITE_URL}/about`,
  },

  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: `${SITE_URL}/about`,
    siteName: SITE_NAME,
    title: "درباره دیجی هیز | فروشگاه پاد و ویپ",
    description:
      "آشنایی با دیجی هیز و خدمات فروشگاه آنلاین پاد، ویپ، سالت و کارتریج.",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "درباره دیجی هیز",
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutPage() {
  return (
    <main>
      {/* محتوای فعلی صفحه درباره ما را اینجا نگه دار */}
    </main>
  );
}
