import ShopContent from "@/components/ShopContent";

export const metadata = {
  title: "فروشگاه",
  description:
    "خرید سالت، پاد و لوازم جانبی اورجینال با ارسال سریع و تخفیف‌های ویژه.",
};

export default async function ShopPage({ searchParams }) {
  const params = await searchParams;

  const category = params?.category || "all";
  const search = params?.search || "";
  const sub = params?.sub || "";

  return (
    <ShopContent
      initialCategory={category}
      initialSearch={search}
      initialSub={sub}
    />
  );
}
