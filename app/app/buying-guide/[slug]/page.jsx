import { notFound } from "next/navigation";
import PostDetail from "@/components/PostDetail";
import { getPostBySlug, getRelatedPosts } from "@/lib/posts";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug, "guide");

  if (!post) {
    return {
      title: "مطلب پیدا نشد",
      robots: { index: false, follow: false },
    };
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || SITE_NAME;
  const url = `${SITE_URL}/buying-guide/${post.slug}`;
  const image = post.coverImage || `${SITE_URL}/og-image.jpg`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "fa_IR",
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export default async function BuyingGuidePostPage({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug, "guide");

  if (!post) notFound();

  const related = await getRelatedPosts(post, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [post.coverImage] : undefined,
    author: { "@type": "Organization", name: post.author || SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    datePublished: post.createdAt || undefined,
    dateModified: post.updatedAt || post.createdAt || undefined,
    mainEntityOfPage: `${SITE_URL}/buying-guide/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostDetail
        post={post}
        basePath="/buying-guide"
        backLabel="بازگشت به راهنمای خرید"
        related={related}
      />
    </>
  );
}
