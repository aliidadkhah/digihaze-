import TermsContent from "@/components/TermsContent";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "قوانین و شرایط استفاده | دیجی هیز",

  description:
    "قوانین و شرایط استفاده از سایت دیجی هیز شامل مقررات خرید، ثبت سفارش، پرداخت، ارسال، حساب کاربری، حریم خصوصی و حقوق مالکیت محتوا.",

  alternates: {
    canonical: `${SITE_URL}/terms`,
  },

  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: `${SITE_URL}/terms`,
    siteName: SITE_NAME,
    title: "قوانین و شرایط استفاده | دیجی هیز",
    description:
      "قوانین و شرایط استفاده از فروشگاه آنلاین دیجی هیز، شرایط خرید، ثبت سفارش و استفاده از خدمات سایت.",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "قوانین و شرایط استفاده از دیجی هیز",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "قوانین و شرایط استفاده | دیجی هیز",
    description:
      "قوانین و شرایط خرید و استفاده از خدمات فروشگاه دیجی هیز.",
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

export default function TermsPage() {
  return <TermsContent />;
}
