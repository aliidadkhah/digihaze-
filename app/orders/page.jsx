import OrdersContent from "@/components/OrdersContent";

export const metadata = {
  title: "سفارش‌های من",
  robots: { index: false, follow: true },
};

export default function OrdersPage() {
  return <OrdersContent />;
}
