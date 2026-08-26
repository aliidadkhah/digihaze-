import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function hashCode(code) {
  return crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
}

export async function POST(request) {
  try {
    const body = await request.json();

    const phone = normalizePhone(body.phone);
    const code = String(body.code || "").trim();

    if (!/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        {
          error: "شماره موبایل معتبر نیست.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{4,10}$/.test(code)) {
      return NextResponse.json(
        {
          error: "کد تایید معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const { data: otp, error } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("OTP lookup error:", error);

      return NextResponse.json(
        {
          error: "خطا در بررسی کد تایید.",
        },
        { status: 500 }
      );
    }

    if (!otp) {
      return NextResponse.json(
        {
          error: "کد تاییدی برای این شماره پیدا نشد.",
        },
        { status: 400 }
      );
    }

    /*
     * انقضای کد
     */
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      await supabaseAdmin
        .from("otp_codes")
        .delete()
        .eq("id", otp.id);

      return NextResponse.json(
        {
          error: "کد تایید منقضی شده. دوباره درخواست کد کن.",
        },
        { status: 400 }
      );
    }

    /*
     * محدودیت تعداد تلاش
     */
    if (otp.attempts >= 5) {
      await supabaseAdmin
        .from("otp_codes")
        .delete()
        .eq("id", otp.id);

      return NextResponse.json(
        {
          error: "تعداد تلاش‌ها بیش از حد مجاز است. دوباره کد بگیر.",
        },
        { status: 429 }
      );
    }

    const codeHash = hashCode(code);

    /*
     * بررسی کد
     */
    if (codeHash !== otp.code_hash) {
      await supabaseAdmin
        .from("otp_codes")
        .update({
          attempts: otp.attempts + 1,
        })
        .eq("id", otp.id);

      return NextResponse.json(
        {
          error: "کد تایید اشتباه است.",
        },
        { status: 400 }
      );
    }

    /*
     * کد درست است.
     * بعد از استفاده حذف می‌شود.
     */
    await supabaseAdmin
      .from("otp_codes")
      .delete()
      .eq("id", otp.id);

    /*
     * فعلاً اطلاعات کاربر را برمی‌گردانیم.
     * مرحله بعد می‌توانیم Session واقعی و Cookie امن هم اضافه کنیم.
     */
    return NextResponse.json({
      success: true,
      user: {
        name: `کاربر ${phone.slice(-4)}`,
        contact: phone,
      },
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return NextResponse.json(
      {
        error: "خطایی در بررسی کد تایید رخ داد.",
      },
      { status: 500 }
    );
  }
}
