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

    if (!/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        {
          error: "شماره موبایل معتبر نیست",
        },
        { status: 400 }
      );
    }

    /*
     * جلوگیری از درخواست‌های پشت سر هم
     */
    const { data: recentOtp } = await supabaseAdmin
      .from("otp_codes")
      .select("created_at")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOtp) {
      const lastTime = new Date(recentOtp.created_at).getTime();
      const now = Date.now();

      if (now - lastTime < 60 * 1000) {
        return NextResponse.json(
          {
            error: "لطفاً یک دقیقه صبر کن و دوباره درخواست بده.",
          },
          { status: 429 }
        );
      }
    }

    /*
     * برخلاف ملی‌پیامک، sms.ir خودش کد تولید نمی‌کند —
     * کد تایید را خودمان اینجا می‌سازیم و به‌عنوان پارامتر قالب
     * به sms.ir می‌دهیم تا فقط پیامکش را ارسال کند.
     */
    const code = String(Math.floor(10000 + Math.random() * 90000)); // ۵ رقمی

    const response = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": process.env.SMS_IR_API_KEY,
      },
      body: JSON.stringify({
        mobile: phone,
        templateId: Number(process.env.SMS_IR_TEMPLATE_ID),
        parameters: [{ name: "CONTANCS", value: code }],
      }),
      cache: "no-store",
    });

    const smsData = await response.json();

    /*
     * قرارداد sms.ir: status === 1 یعنی موفق؛ هر عدد دیگر یعنی خطا
     * (لیست کامل کدهای خطا در مستندات REST API سایت sms.ir هست)
     */
    if (!response.ok || smsData.status !== 1) {
      console.error("SMS.ir error:", smsData);

      return NextResponse.json(
        {
          error: smsData.message || "ارتباط با سرویس sms.ir برقرار نشد.",
        },
        { status: 502 }
      );
    }

    /*
     * فقط Hash کد را ذخیره می‌کنیم
     */
    const codeHash = hashCode(code);

    /*
     * اعتبار کد: 2 دقیقه
     */
    const expiresAt = new Date(
      Date.now() + 2 * 60 * 1000
    ).toISOString();

    /*
     * OTPهای قبلی این شماره را حذف می‌کنیم
     */
    await supabaseAdmin
      .from("otp_codes")
      .delete()
      .eq("phone", phone);

    /*
     * OTP جدید را ذخیره می‌کنیم
     */
    const { error: insertError } = await supabaseAdmin
      .from("otp_codes")
      .insert({
        phone,
        code_hash: codeHash,
        expires_at: expiresAt,
        attempts: 0,
      });

    if (insertError) {
      console.error("OTP DB error:", insertError);

      return NextResponse.json(
        {
          error: "خطا در ذخیره کد تایید.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "کد تایید ارسال شد.",
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);

    return NextResponse.json(
      {
        error: "خطایی در ارسال کد تایید رخ داد.",
      },
      { status: 500 }
    );
  }
}
