import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyPassword } from "@/lib/passwordAuth";

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const GENERIC_ERROR = "شماره موبایل یا رمز عبور اشتباه است";

export async function POST(request) {
  try {
    const body = await request.json();

    const phone = normalizePhone(body.phone);
    const password = String(body.password || "");

    if (!/^09\d{9}$/.test(phone) || !password) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    const { data: customer, error } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (error) {
      console.error("LOGIN PASSWORD FETCH ERROR:", error);
      return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
    }

    if (!customer || !customer.password_hash) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    if (customer.locked_until && new Date(customer.locked_until).getTime() > Date.now()) {
      return NextResponse.json(
        { error: `به‌خاطر تلاش‌های ناموفق زیاد، چند دقیقه دیگر دوباره امتحان کن` },
        { status: 429 }
      );
    }

    const ok = verifyPassword(password, customer.password_salt, customer.password_hash);

    if (!ok) {
      const attempts = (customer.login_attempts || 0) + 1;
      const patch = { login_attempts: attempts };

      if (attempts >= MAX_ATTEMPTS) {
        patch.login_attempts = 0;
        patch.locked_until = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString();
      }

      await supabaseAdmin.from("customers").update(patch).eq("phone", phone);

      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    // ورود موفق: شمارنده تلاش ناموفق ریست بشه
    await supabaseAdmin
      .from("customers")
      .update({ login_attempts: 0, locked_until: null })
      .eq("phone", phone);

    return NextResponse.json({
      success: true,
      user: {
        name: customer.name,
        contact: phone,
        province: customer.province,
        city: customer.city,
        address: customer.address,
        postalCode: customer.postal_code,
        howHeard: customer.how_heard,
      },
    });
  } catch (error) {
    console.error("LOGIN PASSWORD ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
