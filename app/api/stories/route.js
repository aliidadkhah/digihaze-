import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// لیست عمومی استوری‌ها برای صفحه‌ی اصلی (فقط گروه‌های فعال که حداقل یک ویدیو دارن)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("story_groups")
    .select("id, title, cover_url, items")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  // اگه جدول هنوز ساخته نشده یا خطایی بود، صفحه‌ی اصلی نباید خراب بشه
  if (error) {
    return NextResponse.json({ groups: [] });
  }

  const groups = (data || [])
    .map((g) => ({
      id: g.id,
      title: g.title,
      cover_url: g.cover_url,
      items: (Array.isArray(g.items) ? g.items : []).filter((it) => it?.url),
    }))
    .filter((g) => g.items.length > 0);

  return NextResponse.json({ groups });
}
