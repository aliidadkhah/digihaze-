import { getProducts } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

export default async function sitemap() {
  const PRODUCTS = await getProducts();

  const staticPages = ["", "/shop", "/about", "/contact"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const productPages = PRODUCTS.map((p) => ({
    url: `${SITE_URL}/product/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
