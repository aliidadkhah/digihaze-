import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizePhone(phone) {
  const value = String(phone || "").replace(/\D/g, "");

  if (/^09\d{9}$/.test(value)) {
    return value;
  }

  if (/^989\d{9}$/.test(value)) {
    return "0" + value.slice(2);
  }

  return null;
}

function hashCode(code) {
  return crypto
    .createHash("sha256")
    .update(String(code))
    .digest("hex");
}

export async function POST(request) {
  try {
    const body = await request.json();

    const phone = normalizePhone(body?.phone);
    const code = String(body?.code || "")
      .replace(/\D/g, "")
      .trim();

    if (!phone) {
      return NextResponse.json(
        {
          error: "شماره موبایل معتبر نیست",
        },
        {
          status: 400,
        }
      );
    }

    if (!/^\d{5,9}$/.test(code)) {
      return NextResponse.json(
        {
          error: "کد تایید معتبر نیست",
        },
        {
          status: 400,
        }
      );
    }

    const { data: otp, error: dbError } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (dbError) {
      console.error("OTP lookup error:", dbError);

      return NextResponse.json(
        {
          error: "خطا در بررسی کد تایید",
        },
        {
          status: 500,
        }
      );
    }

    if (!otp) {
      return NextResponse.json(
        {
          error: "برای این شماره کد تاییدی وجود ندارد",
        },
        {
          status: 400,
        }
      );
    }

    if (new Date(otp.expires_at).getTime() < Date.now()) {
      await supabaseAdmin
        .from("otp_codes")
        .delete()
        .eq("phone", phone);

      return NextResponse.json(
        {
          error: "کد تایید منقضی شده است",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * محدودیت تلاش برای جلوگیری از حدس زدن کد
     */

    if (otp.attempts >= 5) {
      await supabaseAdmin
        .from("otp_codes")
        .delete()
        .eq("phone", phone);

      return NextResponse.json(
        {
          error: "تعداد تلاش‌های مجاز تمام شده است. دوباره کد بگیر.",
        },
        {
          status: 429,
        }
      );
    }

    const incomingHash = hashCode(code);

    const isValid = crypto.timingSafeEqual(
      Buffer.from(incomingHash, "hex"),
      Buffer.from(otp.code_hash, "hex")
    );

    if (!isValid) {
      await supabaseAdmin
        .from("otp_codes")
        .update({
          attempts: otp.attempts + 1,
        })
        .eq("phone", phone);

      return NextResponse.json(
        {
          error: "کد تایید اشتباه است",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * کد صحیح است.
     * بعد از استفاده حذفش می‌کنیم.
     */

    await supabaseAdmin
      .from("otp_codes")
      .delete()
      .eq("phone", phone);

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
        error: "خطایی در بررسی کد تایید رخ داد",
      },
      {
        status: 500,
      }
    );
  }
}
