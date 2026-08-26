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

    const apiUrl = process.env.MELIPAYAMAK_OTP_URL;

    if (!apiUrl) {
      return NextResponse.json(
        {
          error: "MELIPAYAMAK_OTP_URL در تنظیمات سرور وجود ندارد",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * درخواست به API اختصاصی OTP ملی پیامک
     *
     * طبق پنل ملی پیامک:
     *
     * {
     *   "to": "09123456789"
     * }
     */

    const smsResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
      }),
      cache: "no-store",
    });

    const smsData = await smsResponse.json().catch(() => null);

    if (!smsResponse.ok) {
      console.error("Melipayamak error:", smsData);

      return NextResponse.json(
        {
          error: "ارسال کد تایید انجام نشد",
        },
        {
          status: 502,
        }
      );
    }

    /*
     * طبق پاسخ پنل ملی پیامک:
     *
     * {
     *   "code": "374137414",
     *   "status": "شرح خطا در صورت بروز"
     * }
     *
     * کد دریافت‌شده را در دیتابیس به‌صورت هش ذخیره می‌کنیم.
     */

    const code = String(smsData?.code || "").trim();

    if (!code) {
      console.error("Invalid OTP response:", smsData);

      return NextResponse.json(
        {
          error: "کد تایید از سرویس پیامکی دریافت نشد",
        },
        {
          status: 502,
        }
      );
    }

    const codeHash = hashCode(code);

    const expiresAt = new Date(
      Date.now() + 2 * 60 * 1000
    ).toISOString();

    const { error: dbError } = await supabaseAdmin
      .from("otp_codes")
      .upsert(
        {
          phone,
          code_hash: codeHash,
          expires_at: expiresAt,
          attempts: 0,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "phone",
        }
      );

    if (dbError) {
      console.error("OTP database error:", dbError);

      return NextResponse.json(
        {
          error: "ذخیره کد تایید انجام نشد",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "کد تایید ارسال شد",
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);

    return NextResponse.json(
      {
        error: "خطایی در ارسال کد تایید رخ داد",
      },
      {
        status: 500,
      }
    );
  }
}
