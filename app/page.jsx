import HomeContent from "@/components/HomeContent";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
} from "@/lib/site";

export const metadata = {
  title: `${SITE_NAME} | خرید پاد، ویپ، سالت نیکوتین و کارتریج`,

  description:
    "دیجی هیز فروشگاه آنلاین پاد، ویپ، سالت نیکوتین، کارتریج و لوازم جانبی ویپینگ. مشاهده قیمت، مشخصات و خرید محصولات با ارسال به سراسر کشور.",

  keywords: [
    "دیجی هیز",
    "خرید پاد",
    "خرید ویپ",
    "خرید سالت نیکوتین",
    "خرید کارتریج",
    "قیمت پاد",
    "قیمت ویپ",
    "قیمت سالت نیکوتین",
    "قیمت کارتریج",
    "فروشگاه پاد",
    "فروشگاه ویپ",
    "فروشگاه سالت",
    "لوازم ویپینگ",
  ],

  alternates: {
    canonical: SITE_URL,
  },

  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: SITE_URL,
    siteName: SITE_NAME,

    title:
      `${SITE_NAME} | خرید پاد، ویپ، سالت نیکوتین و کارتریج`,

    description:
      "خرید پاد، ویپ، سالت نیکوتین، کارتریج و لوازم جانبی ویپینگ از دیجی هیز.",

    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} | فروشگاه پاد و ویپ`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      `${SITE_NAME} | خرید پاد، ویپ، سالت نیکوتین و کارتریج`,

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

export default function HomePage() {
  return (
    <>
      <HomeContent />

      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",

            "@id": `${SITE_URL}/#organization`,

            name: SITE_NAME,
            url: SITE_URL,

            logo: {
              "@type": "ImageObject",
              url: `${SITE_URL}/og-image.jpg`,
            },

            description: SITE_DESCRIPTION,
          }),
        }}
      />

      {/* WebSite Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",

            "@id": `${SITE_URL}/#website`,

            name: SITE_NAME,
            url: SITE_URL,
            description: SITE_DESCRIPTION,

            publisher: {
              "@id": `${SITE_URL}/#organization`,
            },
          }),
        }}
      />
    </>
  );
}
