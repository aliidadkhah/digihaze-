import fs from "node:fs";
import fsp from "node:fs/promises";
import { Readable } from "node:stream";
import {
  resolveUploadPath,
  extOf,
  CONTENT_TYPES,
  sniffContentType,
} from "@/lib/uploadStore";

export const dynamic = "force-dynamic";

function decode(part) {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

export async function GET(request, { params }) {
  const { path: parts = [] } = await params;
  const [bucket, ...rest] = parts.map(decode);

  const file = resolveUploadPath(bucket, rest.join("/"));
  if (!file) return new Response("Not found", { status: 404 });

  let st;
  try {
    st = await fsp.stat(file);
    if (!st.isFile()) throw new Error("not a file");
  } catch {
    return new Response("Not found", { status: 404 });
  }

  let type = CONTENT_TYPES[extOf(file)];
  if (!type) {
    // فایل بدون پسوند: از بایت‌های اولش نوع رو تشخیص بده
    try {
      const fd = await fsp.open(file, "r");
      const buf = Buffer.alloc(64);
      const { bytesRead } = await fd.read(buf, 0, 64, 0);
      await fd.close();
      type = sniffContentType(buf.subarray(0, bytesRead));
    } catch {}
  }
  if (!type) return new Response("Not found", { status: 404 });
  const headers = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
    "Last-Modified": st.mtime.toUTCString(),
    "X-Content-Type-Options": "nosniff",
    // فایل آپلودی هیچ‌وقت نباید بتونه اسکریپت اجرا کنه (مثلاً SVG)
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  };

  const since = request.headers.get("if-modified-since");
  if (since && new Date(since).getTime() >= Math.floor(st.mtimeMs / 1000) * 1000) {
    return new Response(null, { status: 304, headers });
  }

  // پشتیبانی از Range (برای پخش و جلو/عقب بردن ویدیو، مخصوصاً توی سافاری)
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? parseInt(range[1], 10) : st.size - parseInt(range[2], 10);
    let end = range[1] && range[2] ? parseInt(range[2], 10) : st.size - 1;
    start = Math.max(0, start);
    end = Math.min(end, st.size - 1);

    if (start > end || start >= st.size) {
      return new Response(null, {
        status: 416,
        headers: { ...headers, "Content-Range": `bytes */${st.size}` },
      });
    }

    return new Response(Readable.toWeb(fs.createReadStream(file, { start, end })), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${st.size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }

  return new Response(Readable.toWeb(fs.createReadStream(file)), {
    status: 200,
    headers: { ...headers, "Content-Length": String(st.size) },
  });
}
