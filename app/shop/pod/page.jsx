import ShopContent from "@/components/ShopContent";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: `خرید پاد | قیمت و مشخصات انواع پاد | ${SITE_NAME}`,
  description:
    "خرید پاد با بررسی مشخصات، قیمت و مدل‌های مختلف. مشاهده انواع پاد و محصولات مرتبط در دیجی هیز.",
  alternates: {
    canonical: "https://digihaze.ir/shop/pod",
  },
};

export default function PodPage() {
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
          خرید پاد
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
          مشاهده انواع پاد و محصولات مرتبط با ویپینگ همراه با
          مشخصات، قیمت و وضعیت موجودی.
        </p>
      </div>

      <ShopContent
        initialCategory="pod"
        initialSearch=""
        initialSub=""
      />
    </>
  );
}
