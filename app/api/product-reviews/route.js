import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function mapRow(row) {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    rating: row.rating,
    text: row.content,
    createdAt: row.created_at,
  };
}

// =====================================================
// دریافت نظرات یک محصول
// =====================================================
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const productId = String(searchParams.get("productId") || "").trim();

  if (!productId) {
    return NextResponse.json(
      { error: "شناسه محصول ارسال نشده است" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("PRODUCT REVIEWS FETCH ERROR:", error);
    return NextResponse.json({ reviews: [] });
  }

  return NextResponse.json({ reviews: (data || []).map(mapRow) });
}

// =====================================================
// ثبت نظر جدید (عمومی - بدون نیاز به ورود)
// =====================================================
export async function POST(request) {
  try {
    const body = await request.json();

    const productId = String(body.productId || "").trim();
    const name = String(body.name || "").trim().slice(0, 60);
    const content = String(body.text ?? body.content ?? "").trim().slice(0, 1000);

    let rating = Math.round(Number(body.rating));
    if (!Number.isFinite(rating)) rating = 5;
    rating = Math.min(5, Math.max(1, rating));

    if (!productId) {
      return NextResponse.json(
        { error: "شناسه محصول ارسال نشده است" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json({ error: "نام را وارد کنید" }, { status: 400 });
    }

    if (content.length < 2) {
      return NextResponse.json(
        { error: "متن نظر خیلی کوتاه است" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("product_reviews")
      .insert({ product_id: productId, name, rating, content })
      .select()
      .single();

    if (error) {
      console.error("PRODUCT REVIEW CREATE ERROR:", error);
      return NextResponse.json(
        { error: "ثبت نظر ناموفق بود. کمی بعد دوباره تلاش کن." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, review: mapRow(data) });
  } catch (error) {
    console.error("PRODUCT REVIEW POST ERROR:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
