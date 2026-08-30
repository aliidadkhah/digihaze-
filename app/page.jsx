import HomeContent from "@/components/HomeContent";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export const metadata = {
  title: `${SITE_NAME} | خرید پاد، ویپ، سالت نیکوتین و کارتریج`,

  description:
    "خرید پاد، ویپ، سالت نیکوتین، کارتریج و لوازم جانبی ویپینگ از دیجی هیز. مشاهده قیمت، مشخصات و تنوع محصولات با ارسال به سراسر کشور.",

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
      "خرید پاد، ویپ، سالت نیکوتین، کارتریج و لوازم جانبی ویپینگ از دیجی هیز. مشاهده قیمت، مشخصات و تنوع محصولات با ارسال به سراسر کشور.",

    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "دیجی هیز | فروشگاه پاد، ویپ، سالت و کارتریج",
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
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",

    "@id": `${SITE_URL}/#website`,

    name: SITE_NAME,

    url: SITE_URL,

    description: SITE_DESCRIPTION,

    inLanguage: "fa-IR",

    potentialAction: {
      "@type": "SearchAction",

      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
      },

      "query-input":
        "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",

    "@type": "Organization",

    "@id": `${SITE_URL}/#organization`,

    name: SITE_NAME,

    url: SITE_URL,

    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/og-image.jpg`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      <HomeContent />
    </>
  );
}
