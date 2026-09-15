import ShopContent from "@/components/ShopContent";
import { getProducts } from "@/lib/products";
import { getCategoriesWithOverrides } from "@/lib/categorySettings";

export const metadata = {
  title: "خرید کارتریج پاد | قیمت و مشخصات کارتریج | دیجی هیز",
  description:
    "خرید کارتریج پاد با بررسی مشخصات، برند، مدل و قیمت. مشاهده انواع کارتریج و محصولات مرتبط در دیجی هیز.",
  alternates: {
    canonical: "https://digihaze.ir/shop/cartridge",
  },
};

export default async function CartridgePage({ searchParams }) {
  const params = await searchParams;
  const sub = params?.sub || "";

  const products = await getProducts();
  const categories = await getCategoriesWithOverrides();

  return (
    <ShopContent
      products={products}
      categories={categories}
      initialCategory="cartridge"
      initialSearch=""
      initialSub={sub}
    />
  );
}
