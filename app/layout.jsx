import "./globals.css";

import Providers from "@/components/Providers";
import ProductsProvider from "@/components/ProductsProvider";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportWidget from "@/components/SupportWidget";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { ScrollMorphBackground } from "@/components/visuals";
import { getCategoriesWithOverrides } from "@/lib/categorySettings";

import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
} from "@/lib/site";

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${SITE_NAME} | فروشگاه پاد، ویپ، سالت و کارتریج`,
    template: `%s | ${SITE_NAME}`,
  },

  description: SITE_DESCRIPTION,

  keywords: SITE_KEYWORDS,

  applicationName: SITE_NAME,

  authors: [
    {
      name: SITE_NAME,
      url: SITE_URL,
    },
  ],

  creator: SITE_NAME,

  publisher: SITE_NAME,

  alternates: {
    canonical: SITE_URL,
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

  openGraph: {
    type: "website",

    locale: "fa_IR",

    url: SITE_URL,

    siteName: SITE_NAME,

    title:
      `${SITE_NAME} | فروشگاه پاد، ویپ، سالت و کارتریج`,

    description: SITE_DESCRIPTION,

    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt:
          `${SITE_NAME} | فروشگاه پاد و ویپ`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      `${SITE_NAME} | فروشگاه پاد، ویپ، سالت و کارتریج`,

    description: SITE_DESCRIPTION,

    images: [
      `${SITE_URL}/og-image.jpg`,
    ],
  },

  category: "shopping",
};

const websiteSchema = {
  "@context": "https://schema.org",

  "@type": "WebSite",

  "@id": `${SITE_URL}#website`,

  url: SITE_URL,

  name: SITE_NAME,

  description: SITE_DESCRIPTION,

  inLanguage: "fa-IR",

  publisher: {
    "@id": `${SITE_URL}#organization`,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",

  "@type": "Organization",

  "@id": `${SITE_URL}#organization`,

  name: SITE_NAME,

  url: SITE_URL,

  description: SITE_DESCRIPTION,

  logo: {
    "@type": "ImageObject",

    url: `${SITE_URL}/digihaze.svg`,
  },
};

export default async function RootLayout({
  children,
}) {
  const categories = await getCategoriesWithOverrides();

  return (
    <html
      lang="fa"
      dir="rtl"
    >
      <body>

        {/* این دو اسکریپت قبلاً توی یه <head> دستی بودن که با
            تزریق خودکار متادیتای Next.js (title/description/OG که
            از generateMetadata میاد) روی دیپلوی Cloudflare/vinext
            تداخل داشت و باعث می‌شد بقیه‌ی متاتگ‌ها رندر نشن.
            چون این‌ها فقط داده‌ی JSON-LD هستن (نه چیزی که نیاز به
            جای خاصی داشته باشه)، بردنشون به body مشکلی ایجاد
            نمی‌کنه. */}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              websiteSchema
            ),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              organizationSchema
            ),
          }}
        />

        <GoogleAnalytics />

        <Providers>

          <ProductsProvider>

            <ScrollMorphBackground />

            <AnnouncementBar />

            <Navbar categories={categories} />

            {children}

            <Footer />

            <SupportWidget />

          </ProductsProvider>

        </Providers>

      </body>
    </html>
  );
}
