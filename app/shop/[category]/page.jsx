import ShopContent from "@/components/ShopContent";
import { CATEGORIES } from "@/lib/data";
import { notFound } from "next/navigation";

const CATEGORY_SEO = {
  pod: {
    title: "خرید پاد ویپ | قیمت و مشخصات انواع پاد",
    description:
      "خرید انواع پاد ویپ با بررسی مشخصات، قیمت و محصولات موجود در دیجی هیز. مشاهده و مقایسه پادهای مختلف.",
  },

  salt: {
    title: "خرید سالت نیکوتین | قیمت انواع سالت ویپ",
    description:
      "خرید سالت نیکوتین با تنوع طعم و برند. مشاهده قیمت، مشخصات و محصولات موجود سالت ویپ در دیجی هیز.",
  },

  device: {
    title: "خرید دستگاه ویپ | قیمت و مشخصات دستگاه ویپ",
    description:
      "خرید دستگاه ویپ با مشاهده مشخصات، قیمت و مدل‌های مختلف. انتخاب و مقایسه انواع دستگاه ویپ در دیجی هیز.",
  },

  cartridge: {
    title: "خرید کارتریج ویپ | قیمت و مشخصات کارتریج",
    description:
      "خرید انواع کارتریج ویپ با مشاهده قیمت و مشخصات محصولات. بررسی مدل‌های مختلف کارتریج در دیجی هیز.",
  },
};

export async function generateMetadata({ params }) {
  const { category } = await params;

  const seo = CATEGORY_SEO[category];

  if (!seo) {
    return {
      title: "فروشگاه | دیجی هیز",
      description:
        "فروشگاه دیجی هیز؛ مشاهده محصولات و دسته‌بندی‌های فروشگاه.",
    };
  }

  return {
    title: seo.title,
    description: seo.description,

    alternates: {
      canonical: `https://digihaze.ir/shop/${category}`,
    },

    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `https://digihaze.ir/shop/${category}`,
      siteName: "دیجی هیز",
      locale: "fa_IR",
      type: "website",
    },
  };
}

export default async function CategoryShopPage({ params }) {
  const { category } = await params;

  const exists = CATEGORIES.some(
    (item) => item.id === category
  );

  if (!exists) {
    notFound();
  }

  return (
    <ShopContent
      initialCategory={category}
      initialSearch=""
      initialSub=""
    />
  );
}
