import { NextResponse } from "next/server";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  resolveUploadPath,
  extOf,
  CONTENT_TYPES,
  ALLOWED_TYPES,
} from "@/lib/uploadStore";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

// بررسی توکن ادمین (مثل بقیه‌ی مسیرهای ادمین)
async function verifyAdmin(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

const unauthorized = () =>
  NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });

// آپلود: multipart با فیلدهای bucket, filename, upsert, file
export async function POST(request) {
  if (!(await verifyAdmin(request))) return unauthorized();

  try {
    const form = await request.formData();
    const bucket = String(form.get("bucket") || "");
    const filename = String(form.get("filename") || "");
    const upsert = form.get("upsert") === "1";
    const file = form.get("file");

    const target = resolveUploadPath(bucket, filename);
    if (!target) {
      return NextResponse.json({ error: "مسیر فایل نامعتبره" }, { status: 400 });
    }
    if (!file || typeof file.stream !== "function") {
      return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });
    }

    // نوع فایل: از پسوند؛ و اگه پسوند نداشت (مثل لوگوی برندها) از نوعی که مرورگر
    // اعلام کرده. فقط عکس و ویدیوی مجاز پذیرفته می‌شه.
    const ext = extOf(filename);
    const type = ext ? CONTENT_TYPES[ext] : ALLOWED_TYPES.has(file.type) ? file.type : null;
    if (!type) {
      return NextResponse.json({ error: "نوع فایل مجاز نیست" }, { status: 400 });
    }

    const isVideo = type.startsWith("video/");
    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      return NextResponse.json({ error: "حجم فایل زیاده" }, { status: 413 });
    }

    if (!upsert && fs.existsSync(target)) {
      return NextResponse.json(
        { error: "فایلی با این اسم already exists" },
        { status: 409 }
      );
    }

    await fsp.mkdir(path.dirname(target), { recursive: true });

    // اول توی فایل موقت، بعد جابه‌جایی؛ تا فایل نیمه‌کاره هیچ‌وقت سرو نشه
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    try {
      await pipeline(Readable.fromWeb(file.stream()), fs.createWriteStream(tmp));
      await fsp.rename(tmp, target);
    } catch (e) {
      await fsp.rm(tmp, { force: true });
      throw e;
    }

    return NextResponse.json({ ok: true, path: filename });
  } catch (e) {
    console.error("ADMIN STORAGE UPLOAD ERROR:", e);
    return NextResponse.json({ error: "آپلود ناموفق بود" }, { status: 500 });
  }
}

// حذف: JSON با bucket و filenames (آرایه)
export async function DELETE(request) {
  if (!(await verifyAdmin(request))) return unauthorized();

  try {
    const body = await request.json();
    const bucket = String(body?.bucket || "");
    const names = Array.isArray(body?.filenames) ? body.filenames.slice(0, 100) : [];

    for (const name of names) {
      const target = resolveUploadPath(bucket, String(name || ""));
      if (target) await fsp.rm(target, { force: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("ADMIN STORAGE DELETE ERROR:", e);
    return NextResponse.json({ error: "حذف ناموفق بود" }, { status: 500 });
  }
}
