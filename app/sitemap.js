import { getProducts } from "@/lib/products";
import { getPosts } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

export default async function sitemap() {
  const products = await getProducts();
  const blogPosts = await getPosts({ type: "blog" });
  const guidePosts = await getPosts({ type: "guide" });

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
      path: "/blog",
      priority: 0.7,
      changeFrequency: "daily",
    },
    {
      path: "/buying-guide",
      priority: 0.7,
      changeFrequency: "weekly",
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
      path: "/shop/pod-system",
      priority: 0.9,
      changeFrequency: "daily",
    },
    {
      path: "/shop/salt-nicotine",
      priority: 0.9,
      changeFrequency: "daily",
    },
    {
      path: "/shop/disposable-pod",
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
      url: `${SITE_URL}/product/${product.category || "shop"}/${product.slug || product.id}`,

      lastModified: product.updated_at
        ? new Date(product.updated_at)
        : new Date(),

      changeFrequency: "weekly",

      priority: 0.8,
    }));

  // ============================================
  // URL پست‌های بلاگ و راهنمای خرید
  // ============================================

  const blogUrls = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const guideUrls = guidePosts.map((post) => ({
    url: `${SITE_URL}/buying-guide/${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // ============================================
  // Sitemap نهایی
  // ============================================

  return [
    ...staticUrls,
    ...productUrls,
    ...blogUrls,
    ...guideUrls,
  ];
}
