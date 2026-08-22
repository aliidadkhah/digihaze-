import ShopContent from "@/components/ShopContent";

export const metadata = {
  title: "فروشگاه",
  description: "خرید مایع ویپ، دستگاه ویپ، پاد و لوازم جانبی اورجینال با ارسال سریع و تخفیف‌های ویژه.",
};

export default function ShopPage({ searchParams }) {
  const category = searchParams?.category || "all";
  const search = searchParams?.search || "";
  return <ShopContent initialCategory={category} initialSearch={search} />;
}
