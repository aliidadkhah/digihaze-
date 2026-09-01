import ShopContent from "@/components/ShopContent";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: `خرید سالت نیکوتین | قیمت و مشخصات سالت | ${SITE_NAME}`,
  description:
    "خرید سالت نیکوتین با بررسی مشخصات، حجم، برند و قیمت. مشاهده انواع سالت نیکوتین و محصولات مرتبط در دیجی هیز.",
  alternates: {
    canonical: "https://digihaze.ir/shop/salt",
  },
};

export default function SaltPage() {
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
          خرید سالت نیکوتین
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
          مشاهده انواع سالت نیکوتین با اطلاعات محصول، برند،
          حجم، قیمت و وضعیت موجودی.
        </p>
      </div>

      <ShopContent
        initialCategory="salt"
        initialSearch=""
        initialSub=""
      />
    </>
  );
}
