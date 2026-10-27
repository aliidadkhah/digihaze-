import { NextResponse } from "next/server";
import { getRawProducts } from "@/lib/products";

// لیست محصولات برای مرورگرها (جایگزین خوندن مستقیم از Supabase).
// همون داده‌ای که قبلاً با کلید anon عمومی خونده می‌شد؛ پس چیز جدیدی لو نمی‌ره.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getRawProducts();
    return NextResponse.json(rows, {
      headers: { "Cache-Control": "public, max-age=10" },
    });
  } catch (e) {
    console.error("products-raw error:", e?.message || e);
    return NextResponse.json(
      { error: "Products temporarily unavailable" },
      { status: 503 }
    );
  }
}
