import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function getUserClient(token) {
  return createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

async function requireAdmin(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return { error: "وارد نشده‌ای", status: 401 };

  const userClient = getUserClient(token);
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return { error: "نشست نامعتبر است", status: 401 };

  // با کلاینت ادمین چک می‌کنیم که این کاربر واقعاً is_admin باشه
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();

  if (profileErr || !profile?.is_admin) {
    return { error: "دسترسی مدیریتی نداری", status: 403 };
  }

  return { user: userData.user };
}

export async function GET(req) {
  const check = await requireAdmin(req);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function PATCH(req) {
  const check = await requireAdmin(req);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const { orderId, status } = await req.json();
  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}
