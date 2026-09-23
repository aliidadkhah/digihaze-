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

// دریافت همه‌ی کدهای تخفیف برای پنل ادمین
export async function GET(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const { data: discountCodes, error } = await supabaseAdmin
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("ADMIN DISCOUNT CODES FETCH ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ discountCodes: discountCodes || [] });
}

function buildRow(body) {
  const type = body.type === "fixed" ? "fixed" : "percent";
  let value = Math.round(Number(body.value)) || 0;

  if (type === "percent") {
    // درصد تخفیف بین ۱ تا ۱۰۰
    value = Math.min(100, Math.max(0, value));
  } else {
    value = Math.max(0, value);
  }

  const maxUsesRaw = body.maxUses;
  const hasMaxUses =
    maxUsesRaw !== undefined && maxUsesRaw !== null && String(maxUsesRaw).trim() !== "";
  const maxUses = hasMaxUses ? Math.max(0, Math.floor(Number(maxUsesRaw))) : null;

  const minOrderTotal = Math.max(0, Math.round(Number(body.minOrderTotal)) || 0);

  const expiresAt = body.expiresAt ? new Date(body.expiresAt).toISOString() : null;

  return {
    code: String(body.code || "").trim().toUpperCase(),
    type,
    value,
    max_uses: maxUses,
    min_order_total: minOrderTotal,
    active: body.active !== false,
    expires_at: expiresAt,
  };
}

// ایجاد کد تخفیف جدید
export async function POST(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.code?.trim()) {
      return NextResponse.json(
        { error: "کد تخفیف الزامی است" },
        { status: 400 }
      );
    }

    const row = buildRow(body);

    if (row.value <= 0) {
      return NextResponse.json(
        { error: "مقدار تخفیف باید بیشتر از صفر باشد" },
        { status: 400 }
      );
    }

    row.id = crypto.randomUUID();
    row.used_count = 0;

    const { data: discountCode, error } = await supabaseAdmin
      .from("discount_codes")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("ADMIN DISCOUNT CODE CREATE ERROR:", error);

      if (error.code === "23505") {
        return NextResponse.json(
          { error: "این کد تخفیف قبلاً ثبت شده است" },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, discountCode });
  } catch (error) {
    console.error("ADMIN DISCOUNT CODE POST ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

// ویرایش کد تخفیف (شامل فعال/غیرفعال کردن سریع)
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
        { error: "شناسه کد تخفیف ارسال نشده است" },
        { status: 400 }
      );
    }

    // تغییر سریع فقط وضعیت فعال/غیرفعال (بدون فرستادن بقیه فیلدها)
    if (body.toggleActive !== undefined) {
      const { data: discountCode, error } = await supabaseAdmin
        .from("discount_codes")
        .update({ active: !!body.toggleActive })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("ADMIN DISCOUNT CODE TOGGLE ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, discountCode });
    }

    const row = buildRow(body);

    if (row.value <= 0) {
      return NextResponse.json(
        { error: "مقدار تخفیف باید بیشتر از صفر باشد" },
        { status: 400 }
      );
    }

    const { data: discountCode, error } = await supabaseAdmin
      .from("discount_codes")
      .update(row)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("ADMIN DISCOUNT CODE UPDATE ERROR:", error);

      if (error.code === "23505") {
        return NextResponse.json(
          { error: "این کد تخفیف قبلاً ثبت شده است" },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, discountCode });
  } catch (error) {
    console.error("ADMIN DISCOUNT CODE PATCH ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

// حذف کد تخفیف
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
        { error: "شناسه کد تخفیف ارسال نشده است" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("discount_codes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("ADMIN DISCOUNT CODE DELETE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN DISCOUNT CODE DELETE ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
