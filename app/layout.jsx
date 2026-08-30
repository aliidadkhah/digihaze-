import "./globals.css";

import Providers from "@/components/Providers";
import ProductsProvider from "@/components/ProductsProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportWidget from "@/components/SupportWidget";
import { ScrollMorphBackground } from "@/components/visuals";

import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
} from "@/lib/site";

// =====================================================
// Global SEO Metadata
// =====================================================

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

    title: `${SITE_NAME} | فروشگاه پاد، ویپ، سالت و کارتریج`,

    description: SITE_DESCRIPTION,

    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} | فروشگاه آنلاین ویپینگ`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: `${SITE_NAME} | فروشگاه پاد، ویپ، سالت و کارتریج`,

    description: SITE_DESCRIPTION,

    images: ["/og-image.jpg"],
  },

  category: "shopping",
};

// =====================================================
// Root Layout
// =====================================================

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Providers>
          <ProductsProvider>
            <ScrollMorphBackground />

            <Navbar />

            <main>{children}</main>

            <Footer />

            <SupportWidget />
          </ProductsProvider>
        </Providers>
      </body>
    </html>
  );
}
