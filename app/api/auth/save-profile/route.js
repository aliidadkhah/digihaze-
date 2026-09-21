import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateSalt, hashPassword, hashToken } from "@/lib/passwordAuth";

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

// بررسی توکن کوتاه‌مدتی که بعد از تایید موفق OTP صادر می‌شه
async function verifyPhoneToken(phone, token) {
  if (!token) return false;

  const { data } = await supabaseAdmin
    .from("phone_verify_tokens")
    .select("*")
    .eq("phone", phone)
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (!data) return false;

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return false;
  }

  return true;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const phone = normalizePhone(body.phone);

    if (!/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "شماره موبایل معتبر نیست" },
        { status: 400 }
      );
    }

    const name = String(body.name || "").trim().slice(0, 80);
    const province = String(body.province || "").trim();
    const city = String(body.city || "").trim();
    const address = String(body.address || "").trim().slice(0, 500);
    const postalCode = String(body.postalCode || "").trim();
    const howHeard = String(body.howHeard || "").trim();

    if (!name || !province || !city || !address || !/^\d{10}$/.test(postalCode)) {
      return NextResponse.json(
        { error: "اطلاعات پروفایل کامل نیست" },
        { status: 400 }
      );
    }

    const row = {
      phone,
      name,
      province,
      city,
      address,
      postal_code: postalCode,
      how_heard: howHeard,
      updated_at: new Date().toISOString(),
    };

    /*
     * تعیین/تغییر رمز عبور - اختیاریه، ولی چون یک عملیات حساسه
     * فقط وقتی مجازه که با توکن معتبر (صادر شده بلافاصله بعد از تایید OTP) همراه باشه.
     */
    const password = String(body.password || "");

    if (password) {
      const tokenOk = await verifyPhoneToken(phone, body.verifyToken);

      if (!tokenOk) {
        return NextResponse.json(
          {
            error:
              "برای تعیین رمز عبور باید دوباره با کد تایید پیامکی وارد شوید.",
          },
          { status: 401 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: "رمز عبور باید حداقل ۶ کاراکتر باشد" },
          { status: 400 }
        );
      }

      const salt = generateSalt();
      row.password_hash = hashPassword(password, salt);
      row.password_salt = salt;
      row.login_attempts = 0;
      row.locked_until = null;
    }

    const { data, error } = await supabaseAdmin
      .from("customers")
      .upsert(row, { onConflict: "phone" })
      .select(
        "name, province, city, address, postal_code, how_heard, password_hash"
      )
      .single();

    if (error) {
      console.error("SAVE PROFILE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // بعد از ذخیره موفق، توکن یک‌بارمصرف رو باطل می‌کنیم
    if (password) {
      await supabaseAdmin.from("phone_verify_tokens").delete().eq("phone", phone);
    }

    return NextResponse.json({
      success: true,
      user: {
        name: data.name,
        contact: phone,
        province: data.province,
        city: data.city,
        address: data.address,
        postalCode: data.postal_code,
        howHeard: data.how_heard,
      },
      hasPassword: !!data.password_hash,
    });
  } catch (error) {
    console.error("SAVE PROFILE ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
