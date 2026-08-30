import ContactContent from "@/components/ContactContent";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "تماس با دیجی هیز | ارتباط با فروشگاه",

  description:
    "راه‌های تماس با دیجی هیز شامل تلفن، ایمیل و فرم پیام. برای پرسش درباره محصولات، سفارش و خدمات فروشگاه با ما در ارتباط باشید.",

  alternates: {
    canonical: `${SITE_URL}/contact`,
  },

  openGraph: {
    type: "website",

    locale: "fa_IR",

    url: `${SITE_URL}/contact`,

    siteName: SITE_NAME,

    title: "تماس با دیجی هیز | ارتباط با فروشگاه",

    description:
      "راه‌های تماس با دیجی هیز شامل تلفن، ایمیل و فرم پیام.",

    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "تماس با دیجی هیز",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "تماس با دیجی هیز",

    description:
      "راه‌های ارتباط با فروشگاه دیجی هیز.",

    images: [
      `${SITE_URL}/og-image.jpg`,
    ],
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

export default function ContactPage() {
  return <ContactContent />;
}
