import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// بررسی توکن ادمین (Bearer token که از Supabase Auth میاد) - همون الگوی بقیه‌ی روت‌های ادمین
async function verifyAdmin(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) return null;

  return data.user;
}

// نوع آیتم → نام جدول
const TABLES = {
  comment: "post_comments", // نظرات بلاگ / راهنمای خرید
  review: "product_reviews", // نظرات محصولات
  question: "product_questions", // سوال‌های محصولات
};

const LIMIT = 300;

function unique(list) {
  return [...new Set(list.filter((v) => v !== null && v !== undefined && v !== ""))];
}

// =====================================================
// دریافت همه‌ی نظرات و سوال‌ها برای پنل ادمین
// =====================================================
export async function GET(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const [commentsRes, reviewsRes, questionsRes] = await Promise.all([
    supabaseAdmin
      .from(TABLES.comment)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabaseAdmin
      .from(TABLES.review)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabaseAdmin
      .from(TABLES.question)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
  ]);

  // اگر مایگریشن SQL هنوز اجرا نشده باشه، جدول وجود نداره؛ خطا رو جداگانه برمی‌گردونیم
  const errors = {};
  if (commentsRes.error) {
    console.error("ADMIN FEEDBACK comments:", commentsRes.error);
    errors.comments = commentsRes.error.message;
  }
  if (reviewsRes.error) {
    console.error("ADMIN FEEDBACK reviews:", reviewsRes.error);
    errors.reviews = reviewsRes.error.message;
  }
  if (questionsRes.error) {
    console.error("ADMIN FEEDBACK questions:", questionsRes.error);
    errors.questions = questionsRes.error.message;
  }

  const comments = commentsRes.data || [];
  const reviews = reviewsRes.data || [];
  const questions = questionsRes.data || [];

  // اسم پست‌ها و محصولات رو جداگانه می‌گیریم (بدون نیاز به relation در دیتابیس)
  const postIds = unique(comments.map((c) => c.post_id));
  const productIds = unique([
    ...reviews.map((r) => r.product_id),
    ...questions.map((q) => q.product_id),
  ]);

  const postsMap = {};
  if (postIds.length > 0) {
    const { data: posts } = await supabaseAdmin
      .from("posts")
      .select("id, title, slug, type")
      .in("id", postIds);

    (posts || []).forEach((p) => {
      postsMap[String(p.id)] = p;
    });
  }

  const productsMap = {};
  if (productIds.length > 0) {
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, category")
      .in("id", productIds);

    (products || []).forEach((p) => {
      productsMap[String(p.id)] = p;
    });
  }

  const productInfo = (productId) => {
    const p = productsMap[String(productId)];
    return {
      id: productId,
      name: p?.name || "محصول حذف‌شده",
      link: p?.slug && p?.category ? `/product/${p.category}/${p.slug}` : "",
    };
  };

  return NextResponse.json({
    errors,
    comments: comments.map((c) => {
      const p = postsMap[String(c.post_id)];
      return {
        id: c.id,
        name: c.name,
        content: c.content,
        createdAt: c.created_at,
        postTitle: p?.title || "پست حذف‌شده",
        link: p?.slug
          ? `/${p.type === "guide" ? "buying-guide" : "blog"}/${p.slug}`
          : "",
      };
    }),
    reviews: reviews.map((r) => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      content: r.content,
      createdAt: r.created_at,
      product: productInfo(r.product_id),
    })),
    questions: questions.map((q) => ({
      id: q.id,
      name: q.name,
      question: q.question,
      answer: q.answer || "",
      answeredAt: q.answered_at || null,
      createdAt: q.created_at,
      product: productInfo(q.product_id),
    })),
  });
}

// =====================================================
// پاسخ دادن (یا ویرایش/پاک کردن پاسخ) به سوال یک محصول
// body: { id, answer }
// =====================================================
export async function PATCH(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const id = String(body.id || "").trim();
    const answer = String(body.answer || "").trim().slice(0, 2000);

    if (!id) {
      return NextResponse.json(
        { error: "شناسه سوال ارسال نشده است" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from(TABLES.question)
      .update({
        answer: answer || null,
        answered_at: answer ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("ADMIN ANSWER ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      answer: data.answer || "",
      answeredAt: data.answered_at || null,
    });
  } catch (error) {
    console.error("ADMIN ANSWER ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

// =====================================================
// حذف نظر یا سوال
// /api/admin/feedback?type=comment|review|question&id=...
// =====================================================
export async function DELETE(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    const table = TABLES[type];

    if (!table || !id) {
      return NextResponse.json(
        { error: "نوع یا شناسه نامعتبر است" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from(table).delete().eq("id", id);

    if (error) {
      console.error("ADMIN FEEDBACK DELETE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN FEEDBACK DELETE ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
