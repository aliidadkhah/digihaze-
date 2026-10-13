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

const unauthorized = () =>
  NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });

function cleanItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .slice(0, 20)
    .map((it) => ({
      url: String(it?.url || "").trim(),
      link: String(it?.link || "").trim().slice(0, 300),
    }))
    .filter((it) => it.url)
    .map((it) => ({
      ...it,
      // لینک فقط مسیر داخلی سایت یا آدرس http(s) باشه
      link: /^(\/|https?:\/\/)/i.test(it.link) ? it.link : "",
    }));
}

export async function GET(request) {
  if (!(await verifyAdmin(request))) return unauthorized();

  const { data, error } = await supabaseAdmin
    .from("story_groups")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("ADMIN STORIES FETCH ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ groups: data || [] });
}

export async function POST(request) {
  if (!(await verifyAdmin(request))) return unauthorized();

  try {
    const body = await request.json();
    const title = String(body.title || "").trim().slice(0, 40);

    if (!title) {
      return NextResponse.json({ error: "عنوان گروه را وارد کن" }, { status: 400 });
    }

    // گروه جدید بالای لیست قرار بگیره
    const { data: first } = await supabaseAdmin
      .from("story_groups")
      .select("sort_order")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabaseAdmin
      .from("story_groups")
      .insert({
        title,
        cover_url: String(body.cover_url || "").trim() || null,
        items: cleanItems(body.items),
        active: body.active !== false,
        sort_order: (first?.sort_order ?? 0) - 1,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ group: data });
  } catch (error) {
    console.error("ADMIN STORIES POST ERROR:", error);
    return NextResponse.json({ error: error.message || "خطای سرور" }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!(await verifyAdmin(request))) return unauthorized();

  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "شناسه گروه ارسال نشده" }, { status: 400 });
    }

    const patch = {};

    if (body.title !== undefined) {
      const title = String(body.title || "").trim().slice(0, 40);
      if (!title) {
        return NextResponse.json({ error: "عنوان گروه را وارد کن" }, { status: 400 });
      }
      patch.title = title;
    }
    if (body.cover_url !== undefined) {
      patch.cover_url = String(body.cover_url || "").trim() || null;
    }
    if (body.items !== undefined) patch.items = cleanItems(body.items);
    if (body.active !== undefined) patch.active = !!body.active;
    if (body.sort_order !== undefined) patch.sort_order = Math.trunc(Number(body.sort_order)) || 0;

    const { data, error } = await supabaseAdmin
      .from("story_groups")
      .update(patch)
      .eq("id", body.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ group: data });
  } catch (error) {
    console.error("ADMIN STORIES PATCH ERROR:", error);
    return NextResponse.json({ error: error.message || "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await verifyAdmin(request))) return unauthorized();

  const id = new URL(request.url).searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "شناسه گروه ارسال نشده" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("story_groups").delete().eq("id", id);

  if (error) {
    console.error("ADMIN STORIES DELETE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
