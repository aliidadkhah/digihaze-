import PrivacyContent from "@/components/PrivacyContent";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "حریم خصوصی | دیجی هیز",

  description:
    "سیاست حریم خصوصی دیجی هیز درباره نحوه جمع‌آوری، استفاده و حفاظت از اطلاعات کاربران، اطلاعات تماس و سفارش‌ها.",

  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },

  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: `${SITE_URL}/privacy`,
    siteName: SITE_NAME,
    title: "حریم خصوصی | دیجی هیز",
    description:
      "سیاست حریم خصوصی دیجی هیز و نحوه جمع‌آوری، استفاده و حفاظت از اطلاعات کاربران و سفارش‌ها.",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "حریم خصوصی دیجی هیز",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "حریم خصوصی | دیجی هیز",
    description:
      "سیاست حریم خصوصی دیجی هیز و نحوه حفاظت از اطلاعات کاربران.",
    images: [`${SITE_URL}/og-image.jpg`],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
