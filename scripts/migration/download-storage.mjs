// =====================================================
// download-storage.mjs  —  اجرا روی «خود سرور»
//
// همه‌ی فایل‌های دو باکت site-images و product-images رو از Supabase Storage
// می‌گیره و توی /var/lib/digihaze-uploads/<باکت>/... ذخیره می‌کنه.
//   - اتصال سرور به Supabase ناپایداره: هر فایل چند ده بار دوباره امتحان می‌شه
//   - اندازه‌ی هر فایل با اندازه‌ی ثبت‌شده توی Supabase مقایسه می‌شه
//   - فایل‌های کامل‌شده دفعه‌ی بعد رد می‌شن (می‌شه چند بار اجراش کرد)
//
// اجرا:
//   cd /root/digihaze
//   set -a; . ./.env.local; set +a
//   node scripts/migration/download-storage.mjs
// =====================================================
import fs from "node:fs";
import path from "node:path";

const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const OUT = process.argv[2] || "/var/lib/digihaze-uploads";
const BUCKETS = ["site-images", "product-images"];
const TIMEOUT_MS = Number(process.env.DL_TIMEOUT_MS || 30000);
const TRIES = 60;

if (!url || !key) {
  console.error("SUPABASE_URL یا SUPABASE_SERVICE_ROLE_KEY پیدا نشد.");
  console.error("اول بزن:  set -a; . ./.env.local; set +a");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const auth = { apikey: key, Authorization: `Bearer ${key}` };
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");

async function retry(label, fn) {
  for (let i = 1; i <= TRIES; i++) {
    try {
      return await fn();
    } catch (e) {
      if (e.fatal) throw e;
      process.stdout.write(".");
      await sleep(400);
    }
  }
  throw new Error(`بعد از ${TRIES} تلاش نشد: ${label}`);
}

// فهرست همه‌ی فایل‌ها (با ورود به پوشه‌ها)
async function listAll(bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const items = await retry(`list ${bucket}/${prefix}`, async () => {
      const res = await fetch(`${url}/storage/v1/object/list/${bucket}`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix,
          limit: 1000,
          offset,
          sortBy: { column: "name", order: "asc" },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.status >= 400 && res.status < 500) {
        throw Object.assign(new Error(`HTTP ${res.status}: ${await res.text()}`), { fatal: true });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });

    for (const it of items) {
      if (it.id === null || it.id === undefined) {
        // پوشه
        files.push(...(await listAll(bucket, `${prefix}${it.name}/`)));
      } else {
        files.push({ name: `${prefix}${it.name}`, size: it.metadata?.size ?? null });
      }
    }
    if (items.length < 1000) break;
  }
  return files;
}

async function download(bucket, f) {
  const dest = path.join(OUT, bucket, ...f.name.split("/"));

  if (fs.existsSync(dest) && (f.size === null || fs.statSync(dest).size === f.size)) {
    return "skip";
  }

  const buf = await retry(`${bucket}/${f.name}`, async () => {
    const res = await fetch(`${url}/storage/v1/object/${bucket}/${enc(f.name)}`, {
      headers: auth,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status >= 400 && res.status < 500) {
      throw Object.assign(new Error(`HTTP ${res.status}`), { fatal: true });
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const b = Buffer.from(await res.arrayBuffer());
    if (f.size !== null && b.length !== f.size) throw new Error("اندازه نمی‌خونه");
    return b;
  });

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.tmp`;
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, dest);
  return "ok";
}

let total = 0, got = 0, skipped = 0, failed = 0;

for (const bucket of BUCKETS) {
  console.log(`\n=== ${bucket}: در حال گرفتن فهرست...`);
  const files = await listAll(bucket);
  console.log(`${files.length} فایل`);
  total += files.length;

  let i = 0;
  for (const f of files) {
    i++;
    try {
      const r = await download(bucket, f);
      if (r === "skip") skipped++; else got++;
      if (i % 20 === 0) process.stdout.write(` [${i}/${files.length}] `);
    } catch (e) {
      failed++;
      console.log(`\n✗ ${bucket}/${f.name}: ${e.message}`);
    }
  }
}

console.log(`\n\n=== خلاصه ===\nکل: ${total}  | تازه گرفته شد: ${got}  | از قبل بود: ${skipped}  | ناموفق: ${failed}`);
console.log(`مسیر: ${OUT}`);
if (failed > 0) {
  console.log("بعضی فایل‌ها نیومدن؛ همین دستور رو دوباره بزن (ادامه می‌ده).");
  process.exit(2);
}
