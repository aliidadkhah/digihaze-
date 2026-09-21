import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { generateVerifyToken, hashToken } from "@/lib/passwordAuth";

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
     * اگه قبلاً مشتری با این شماره ثبت شده (نام/آدرس/رمز عبور)،
     * پروفایلش رو برمی‌گردونیم تا دیگه مجبور نباشه دوباره اطلاعاتش رو وارد کنه.
     */
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select(
        "name, province, city, address, postal_code, how_heard, password_hash"
      )
      .eq("phone", phone)
      .maybeSingle();

    /*
     * یک توکن کوتاه‌مدت (۳۰ دقیقه) صادر می‌کنیم؛ این توکن اجازه می‌ده
     * کاربر بلافاصله بعد از این تایید، رمز عبور برای حساب خودش تعیین/تغییر بده
     * بدون این‌که کس دیگه‌ای فقط با دونستن شماره موبایلش بتونه این کار رو بکنه.
     */
    const verifyToken = generateVerifyToken();
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await supabaseAdmin.from("phone_verify_tokens").delete().eq("phone", phone);
    await supabaseAdmin.from("phone_verify_tokens").insert({
      phone,
      token_hash: hashToken(verifyToken),
      expires_at: tokenExpiresAt,
    });

    return NextResponse.json({
      success: true,
      verifyToken,
      user: {
        name: customer?.name || `کاربر ${phone.slice(-4)}`,
        contact: phone,
        province: customer?.province || "",
        city: customer?.city || "",
        address: customer?.address || "",
        postalCode: customer?.postal_code || "",
        howHeard: customer?.how_heard || "",
      },
      hasPassword: !!customer?.password_hash,
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
