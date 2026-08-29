import "./globals.css";
import Providers from "@/components/Providers";
import ProductsProvider from "@/components/ProductsProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportWidget from "@/components/SupportWidget";
import { ScrollMorphBackground } from "@/components/visuals";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | فروشگاه پاد، سالت و کارتریج`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | فروشگاه پاد، سالت و کارتریج`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
     <body>
  <Providers>
    <ProductsProvider>
      <ScrollMorphBackground />
      <Navbar />
      {children}
      <Footer />
      <SupportWidget />
    </ProductsProvider>
  </Providers>
</body>
    </html>
  );
}
