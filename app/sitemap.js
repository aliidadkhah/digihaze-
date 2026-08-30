import { getProducts } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

export default async function sitemap() {
  const products = await getProducts();

  // ============================================
  // صفحات اصلی سایت
  // ============================================

  const staticPages = [
    {
      path: "",
      priority: 1.0,
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
    {
      path: "/privacy",
      priority: 0.4,
      changeFrequency: "yearly",
    },
    {
      path: "/terms",
      priority: 0.4,
      changeFrequency: "yearly",
    },
    {
      path: "/return-policy",
      priority: 0.4,
      changeFrequency: "yearly",
    },
  ];

  // ============================================
  // صفحات دسته‌بندی
  // ============================================

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

  // ============================================
  // URL صفحات ثابت
  // ============================================

  const staticUrls = [
    ...staticPages,
    ...categoryPages,
  ].map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // ============================================
  // URL محصولات
  // ============================================

  const productUrls = products
    .filter((product) => {
      // محصول باید ID داشته باشد
      if (!product?.id) {
        return false;
      }

      // محصول حذف‌شده وارد Sitemap نشود
      if (product.deleted === true) {
        return false;
      }

      // محصولات ناموجود هم فعلاً در Sitemap باقی می‌مانند
      // چون صفحه محصول همچنان می‌تواند برای SEO ارزش داشته باشد

      return true;
    })
    .map((product) => ({
      url: `${SITE_URL}/product/${product.id}`,

      lastModified: product.updated_at
        ? new Date(product.updated_at)
        : new Date(),

      changeFrequency: "weekly",

      priority: 0.8,
    }));

  // ============================================
  // Sitemap نهایی
  // ============================================

  return [
    ...staticUrls,
    ...productUrls,
  ];
}
