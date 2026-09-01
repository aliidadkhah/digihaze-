import PostListPage from "@/components/PostListPage";
import { getPosts } from "@/lib/posts";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

const TITLE = "راهنمای خرید";
const DESCRIPTION =
  "راهنمای انتخاب و خرید پاد، ویپ، سالت نیکوتین و کارتریج مناسب، برای انتخاب درست و آگاهانه.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/buying-guide` },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: `${SITE_URL}/buying-guide`,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${TITLE}`,
    description: DESCRIPTION,
    images: [
      { url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: TITLE },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${TITLE}`,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og-image.jpg`],
  },
  robots: { index: true, follow: true },
};

export default async function BuyingGuidePage() {
  const posts = await getPosts({ type: "guide" });

  return (
    <PostListPage
      title={TITLE}
      description={DESCRIPTION}
      posts={posts}
      basePath="/buying-guide"
    />
  );
}
