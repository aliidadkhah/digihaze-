import { SITE_URL } from "@/lib/site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",

        disallow: [
          "/cart",
          "/auth",
          "/admin",
          "/checkout",
        ],
      },
    ],

    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
