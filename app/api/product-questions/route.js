import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function mapRow(row) {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    question: row.question,
    answer: row.answer || "",
    answeredAt: row.answered_at || null,
    createdAt: row.created_at,
  };
}

// =====================================================
// دریافت سوال‌های یک محصول (به‌همراه پاسخ ادمین)
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
    .from("product_questions")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("PRODUCT QUESTIONS FETCH ERROR:", error);
    return NextResponse.json({ questions: [] });
  }

  return NextResponse.json({ questions: (data || []).map(mapRow) });
}

// =====================================================
// ثبت سوال جدید (عمومی - بدون نیاز به ورود)
// پاسخ‌دادن و حذف فقط از مسیر ادمین (/api/admin/feedback) انجام می‌شه
// =====================================================
export async function POST(request) {
  try {
    const body = await request.json();

    const productId = String(body.productId || "").trim();
    const name = String(body.name || "").trim().slice(0, 60);
    const question = String(body.question || "").trim().slice(0, 1000);

    if (!productId) {
      return NextResponse.json(
        { error: "شناسه محصول ارسال نشده است" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json({ error: "نام را وارد کنید" }, { status: 400 });
    }

    if (question.length < 5) {
      return NextResponse.json(
        { error: "متن سوال خیلی کوتاه است" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("product_questions")
      .insert({ product_id: productId, name, question })
      .select()
      .single();

    if (error) {
      console.error("PRODUCT QUESTION CREATE ERROR:", error);
      return NextResponse.json(
        { error: "ثبت سوال ناموفق بود. کمی بعد دوباره تلاش کن." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, question: mapRow(data) });
  } catch (error) {
    console.error("PRODUCT QUESTION POST ERROR:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
