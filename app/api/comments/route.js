import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// بررسی توکن ادمین (Bearer token که از Supabase Auth میاد) - همون الگوی بقیه‌ی روت‌های ادمین
async function verifyAdmin(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) return null;

  return data.user;
}

function mapRow(row) {
  return {
    id: row.id,
    postId: row.post_id,
    name: row.name,
    content: row.content,
    createdAt: row.created_at,
  };
}

// =====================================================
// دریافت نظرات یک پست
// =====================================================
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json(
      { error: "شناسه پست ارسال نشده است" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("COMMENTS FETCH ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: (data || []).map(mapRow) });
}

// =====================================================
// ثبت نظر جدید (عمومی - بدون نیاز به ورود)
// =====================================================
export async function POST(request) {
  try {
    const body = await request.json();

    const postId = String(body.postId || "").trim();
    const name = String(body.name || "").trim().slice(0, 60);
    const content = String(body.content || "").trim().slice(0, 1000);

    if (!postId) {
      return NextResponse.json(
        { error: "شناسه پست ارسال نشده است" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "نام را وارد کنید" },
        { status: 400 }
      );
    }

    if (content.length < 2) {
      return NextResponse.json(
        { error: "متن نظر خیلی کوتاه است" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("post_comments")
      .insert({ post_id: postId, name, content })
      .select()
      .single();

    if (error) {
      console.error("COMMENT CREATE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, comment: mapRow(data) });
  } catch (error) {
    console.error("COMMENT POST ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

// =====================================================
// حذف نظر (فقط ادمین - برای پاک کردن نظرات توهین‌آمیز)
// =====================================================
export async function DELETE(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "شناسه نظر ارسال نشده است" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("post_comments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("COMMENT DELETE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("COMMENT DELETE ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
