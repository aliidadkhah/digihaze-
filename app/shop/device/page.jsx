import ShopContent from "@/components/ShopContent";
import { getProducts } from "@/lib/products";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: `خرید دستگاه پاد و ویپ | قیمت و مشخصات دستگاه | ${SITE_NAME}`,
  description:
    "خرید دستگاه پاد و ویپ با بررسی مشخصات، مدل، برند و قیمت. مشاهده انواع دستگاه‌های ویپینگ در دیجی هیز.",
  alternates: {
    canonical: "https://digihaze.ir/shop/device",
  },
};

export default async function DevicePage() {
  const products = await getProducts();

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
          خرید دستگاه پاد و ویپ
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
          مشاهده انواع دستگاه پاد و ویپ همراه با مشخصات،
          برند، قیمت و وضعیت موجودی محصولات.
        </p>
      </div>

      <ShopContent
        products={products}
        initialCategory="disposable-pod"
        initialSearch=""
        initialSub=""
      />
    </>
  );
}
