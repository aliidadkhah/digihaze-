import ShopContent from "@/components/ShopContent";
import { getProducts } from "@/lib/products";
import { getCategoriesWithOverrides } from "@/lib/categorySettings";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: `خرید کارتریج پاد | قیمت و مشخصات کارتریج | ${SITE_NAME}`,
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
    <>
      <div
        dir="rtl"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "35px 20px 10px",
        }}
      >
        <h1
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 28,
            marginBottom: 10,
          }}
        >
          خرید کارتریج پاد
        </h1>

        <p
          style={{
            color: "var(--text-lo)",
            fontFamily: "Vazirmatn",
            fontSize: 15,
            lineHeight: 2,
            margin: 0,
          }}
        >
          مشاهده انواع کارتریج پاد همراه با مشخصات، برند،
          مدل، قیمت و وضعیت موجودی محصولات.
        </p>
      </div>

      <ShopContent
        products={products}
        categories={categories}
        initialCategory="cartridge"
        initialSearch=""
        initialSub={sub}
      />
    </>
  );
}
