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

// دریافت همه‌ی محصولات برای پنل ادمین
export async function GET(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("ADMIN PRODUCTS FETCH ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: products || [] });
}

function buildRow(body) {
  return {
    name: body.name?.trim() || "",
    category: body.category?.trim() || "",
    brand: body.brand?.trim() || "",
    price: Number(body.price) || 0,
    discount: Number(body.discount) || 0,
    rating: Number(body.rating) || 0,
    reviews_count: Number(body.reviewsCount) || 0,
    color: body.color?.trim() || "",
    badge: body.badge?.trim() || "",
    available: !!body.available,
    images: Array.isArray(body.images) ? body.images : [],
    colors: Array.isArray(body.colors) ? body.colors : [],
    description: body.description?.trim() || "",
    specs: Array.isArray(body.specs) ? body.specs : [],
    features: Array.isArray(body.features)
      ? body.features.map((f) => String(f).trim()).filter(Boolean)
      : [],
    tags: Array.isArray(body.tags)
      ? body.tags.map((t) => String(t).trim()).filter(Boolean)
      : [],
    brand_description: body.brandDescription?.trim() || "",
    brand_image: body.brandImage?.trim() || "",
    qa: Array.isArray(body.qa) ? body.qa : [],
  };
}

// ایجاد محصول جدید
export async function POST(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "نام محصول الزامی است" },
        { status: 400 }
      );
    }

    const row = buildRow(body);

    const { data: maxRow } = await supabaseAdmin
      .from("products")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    row.sort_order = (maxRow?.sort_order ?? 0) + 1;

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("ADMIN PRODUCT CREATE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("ADMIN PRODUCT POST ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

// ویرایش محصول
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
        { error: "شناسه محصول ارسال نشده است" },
        { status: 400 }
      );
    }

    const row = buildRow(body);

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .update(row)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("ADMIN PRODUCT UPDATE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("ADMIN PRODUCT PATCH ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

// حذف محصول
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
        { error: "شناسه محصول ارسال نشده است" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("ADMIN PRODUCT DELETE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN PRODUCT DELETE ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
