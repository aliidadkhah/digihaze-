import {
  buildCategoryMetadata,
  CategoryPageBody,
} from "@/lib/shopCategoryPage";

// =====================================================
// Metadata
// =====================================================

export async function generateMetadata({ params }) {
  const { category: rawCategory } = await params;
  return buildCategoryMetadata(rawCategory);
}

// =====================================================
// Category Page (با زیردسته) — آدرس تمیز /shop/دسته/زیردسته
// =====================================================

export default async function CategorySubShopPage({ params }) {
  const { category: rawCategory, sub } = await params;

  return <CategoryPageBody rawCategory={rawCategory} sub={sub || ""} />;
}
