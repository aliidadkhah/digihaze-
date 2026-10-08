import InventoryApp from "@/components/InventoryApp";

export const metadata = {
  title: "انبار دیجی‌هیز",
  manifest: "/inventory.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "انبار", statusBarStyle: "black-translucent" },
};

export const viewport = {
  themeColor: "#000410",
};

export default function InventoryPage() {
  return <InventoryApp />;
}
