import ContactContent from "@/components/ContactContent";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "تماس با دیجی هیز | پشتیبانی و ارتباط با ما",

  description:
    "راه‌های ارتباط با دیجی هیز؛ تماس با پشتیبانی، ارسال پیام و دریافت اطلاعات تماس فروشگاه پاد، ویپ، سالت نیکوتین و کارتریج.",

  alternates: {
    canonical: `${SITE_URL}/contact`,
  },

  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: `${SITE_URL}/contact`,
    siteName: SITE_NAME,
    title: "تماس با دیجی هیز | پشتیبانی و ارتباط با ما",
    description:
      "راه‌های ارتباط با دیجی هیز و تماس با پشتیبانی فروشگاه.",
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
    title: "تماس با دیجی هیز | پشتیبانی و ارتباط با ما",
    description:
      "راه‌های ارتباط با دیجی هیز و تماس با پشتیبانی فروشگاه.",
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

export default function ContactPage() {
  return <ContactContent />;
}
