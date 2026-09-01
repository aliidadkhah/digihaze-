import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// بررسی توکن ادمین (Bearer token که از Supabase Auth میاد)
async function verifyAdmin(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) return null;

  return data.user;
}

// ساخت اسلاگ از روی عنوان (در صورتی که کاربر اسلاگ ندهد)
function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// دریافت همه‌ی پست‌ها برای پنل ادمین (منتشرشده و پیش‌نویس)
export async function GET(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  let query = supabaseAdmin
    .from("posts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data: posts, error } = await query;

  if (error) {
    console.error("ADMIN POSTS FETCH ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: posts || [] });
}

function buildRow(body) {
  return {
    type: body.type === "guide" ? "guide" : "blog",
    title: body.title?.trim() || "",
    slug: slugify(body.slug?.trim() || body.title || ""),
    excerpt: body.excerpt?.trim() || "",
    content: body.content || "",
    cover_image: body.coverImage?.trim() || "",
    category: body.category?.trim() || "",
    tags: Array.isArray(body.tags)
      ? body.tags.map((t) => String(t).trim()).filter(Boolean)
      : [],
    author: body.author?.trim() || "دیجی هیز",
    published: body.published !== false,
    seo_title: body.seoTitle?.trim() || "",
    seo_description: body.seoDescription?.trim() || "",
  };
}

// ایجاد پست جدید
export async function POST(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "عنوان پست الزامی است" },
        { status: 400 }
      );
    }

    const row = buildRow(body);

    if (!row.slug) {
      return NextResponse.json(
        { error: "اسلاگ (نشانی) پست نامعتبر است" },
        { status: 400 }
      );
    }

    const { data: maxRow } = await supabaseAdmin
      .from("posts")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    row.sort_order = (maxRow?.sort_order ?? 0) + 1;

    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .insert(row)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "این اسلاگ قبلاً استفاده شده، یک اسلاگ دیگر انتخاب کن" },
          { status: 409 }
        );
      }
      console.error("ADMIN POST CREATE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("ADMIN POST POST ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

// ویرایش پست
export async function PATCH(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "شناسه پست ارسال نشده است" },
        { status: 400 }
      );
    }

    const row = buildRow(body);

    if (!row.slug) {
      return NextResponse.json(
        { error: "اسلاگ (نشانی) پست نامعتبر است" },
        { status: 400 }
      );
    }

    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .update(row)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "این اسلاگ قبلاً استفاده شده، یک اسلاگ دیگر انتخاب کن" },
          { status: 409 }
        );
      }
      console.error("ADMIN POST UPDATE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("ADMIN POST PATCH ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

// حذف پست
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
        { error: "شناسه پست ارسال نشده است" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("posts").delete().eq("id", id);

    if (error) {
      console.error("ADMIN POST DELETE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN POST DELETE ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
