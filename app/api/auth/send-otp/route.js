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

// کد ۵ رقمی با تولیدکننده‌ی تصادفی امن (به‌جای Math.random)
function generateCode() {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return String(10000 + (buf[0] % 90000));
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
     * بررسی تنظیمات sms.ir قبل از هر کاری.
     * اگر SMS_IR_API_KEY یا SMS_IR_TEMPLATE_ID روی سرور (Cloudflare) ست نشده باشه،
     * علت دقیق توی لاگ سرور نوشته می‌شه و به کاربر فقط یک پیام عمومی نشون داده می‌شه.
     */
    const apiKey = String(process.env.SMS_IR_API_KEY || "").trim();
    const templateIdRaw = String(process.env.SMS_IR_TEMPLATE_ID || "").trim();
    const templateId = Number(templateIdRaw);

    if (!apiKey || !Number.isInteger(templateId) || templateId <= 0) {
      console.error("SEND OTP CONFIG ERROR: تنظیمات sms.ir ناقص است", {
        hasApiKey: !!apiKey,
        templateIdValue: templateIdRaw || "(خالی)",
      });

      return NextResponse.json(
        {
          error:
            "سرویس پیامک موقتاً در دسترس نیست. کمی بعد دوباره تلاش کن یا با رمز عبور وارد شو.",
        },
        { status: 503 }
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
    const code = generateCode();

    const response = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        mobile: phone,
        templateId,
        parameters: [{ name: "CONTANCS", value: code }],
      }),
      cache: "no-store",
    });

    const smsData = await response.json().catch(() => ({}));

    /*
     * قرارداد sms.ir: status === 1 یعنی موفق؛ هر عدد دیگر یعنی خطا
     * (لیست کامل کدهای خطا در مستندات REST API سایت sms.ir هست)
     * پیام خام sms.ir فقط توی لاگ سرور ثبت می‌شه، نه برای کاربر.
     */
    if (!response.ok || smsData.status !== 1) {
      console.error("SMS.ir error:", response.status, smsData);

      return NextResponse.json(
        {
          error: "ارسال پیامک ناموفق بود. کمی بعد دوباره تلاش کن.",
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
