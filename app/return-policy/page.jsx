import ReturnPolicyContent from "@/components/ReturnPolicyContent";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "شرایط مرجوعی کالا | دیجی هیز",

  description:
    "شرایط و نحوه مرجوعی کالا در دیجی هیز، شامل مغایرت کالا، ایراد محصول، هزینه بازگشت و نحوه ثبت درخواست مرجوعی.",

  alternates: {
    canonical: `${SITE_URL}/return-policy`,
  },

  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: `${SITE_URL}/return-policy`,
    siteName: SITE_NAME,
    title: "شرایط مرجوعی کالا | دیجی هیز",
    description:
      "شرایط و قوانین مرجوعی کالا، مغایرت محصول و نحوه ثبت درخواست بازگشت در فروشگاه دیجی هیز.",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "شرایط مرجوعی کالا در دیجی هیز",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "شرایط مرجوعی کالا | دیجی هیز",
    description:
      "شرایط مرجوعی کالا و نحوه ثبت درخواست بازگشت محصول در دیجی هیز.",
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

export default function ReturnPolicyPage() {
  return <ReturnPolicyContent />;
}
