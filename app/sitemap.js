import { getProducts } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

export default async function sitemap() {
  const PRODUCTS = await getProducts();

  // صفحات اصلی سایت
  const staticPages = [
    {
      path: "",
      priority: 1,
      changeFrequency: "daily",
    },
    {
      path: "/shop",
      priority: 0.9,
      changeFrequency: "daily",
    },
    {
      path: "/about",
      priority: 0.6,
      changeFrequency: "monthly",
    },
    {
      path: "/contact",
      priority: 0.6,
      changeFrequency: "monthly",
    },
  ];

  // صفحات دسته‌بندی اصلی
  const categoryPages = [
    {
      path: "/shop/pod",
      priority: 0.9,
      changeFrequency: "daily",
    },
    {
      path: "/shop/salt",
      priority: 0.9,
      changeFrequency: "daily",
    },
    {
      path: "/shop/device",
      priority: 0.9,
      changeFrequency: "daily",
    },
    {
      path: "/shop/cartridge",
      priority: 0.9,
      changeFrequency: "daily",
    },
  ];

  const pages = [
    ...staticPages,
    ...categoryPages,
  ].map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // صفحات محصولات
  const productPages = PRODUCTS.map((product) => ({
    url: `${SITE_URL}/product/${product.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    ...pages,
    ...productPages,
  ];
}
