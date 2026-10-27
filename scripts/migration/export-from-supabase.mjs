// =====================================================
// export-from-supabase.mjs  —  اجرا روی «خود سرور»
//
// همه‌ی جدول‌ها رو از Supabase می‌گیره و توی پوشه‌ی /root/migration/data
// به‌صورت JSON ذخیره می‌کنه. چون اتصال این سرور به Supabase ناپایداره:
//   - داده با درخواست‌های کوچیک (صفحه‌صفحه) و تلاش مجدد زیاد گرفته می‌شه
//   - تعداد ردیف‌ها با تعداد واقعی توی Supabase مقایسه می‌شه
//   - اگه وسط کار قطع شد، دوباره اجرا کن؛ جدول‌های تموم‌شده رد می‌شن
//
// اجرا:
//   cd /root/digihaze
//   set -a; . ./.env.local; set +a
//   node scripts/migration/export-from-supabase.mjs
//
// خروجی‌ها اطلاعات مشتری و سفارش دارن؛ فقط برای root قابل‌خوندنه (۶۰۰).
// =====================================================
import fs from "node:fs";
import path from "node:path";

const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const OUT = process.argv[2] || "/root/migration/data";

if (!url || !key) {
  console.error("SUPABASE_URL یا SUPABASE_SERVICE_ROLE_KEY پیدا نشد.");
  console.error("اول بزن:  set -a; . ./.env.local; set +a");
  process.exit(1);
}

const TIMEOUT_MS = Number(process.env.EXPORT_TIMEOUT_MS || 20000);
const TRIES = 80;

// ترتیب با کلید اصلی؛ اندازه‌ی صفحه با حجم ردیف‌ها تنظیم شده
const TABLES = [
  { name: "customers", order: "id", page: 25 },
  { name: "discount_codes", order: "id", page: 25 },
  { name: "orders", order: "id", page: 20 },
  { name: "order_items", order: "id", page: 30 },
  { name: "otp_codes", order: "phone", page: 25 },
  { name: "page_views", order: "id", page: 40 },
  { name: "phone_verify_tokens", order: "id", page: 25 },
  { name: "posts", order: "id", page: 2 },
  { name: "post_comments", order: "id", page: 25 },
  { name: "product_questions", order: "id", page: 25 },
  { name: "product_reviews", order: "id", page: 25 },
  { name: "products", order: "id", page: 6 },
  { name: "profiles", order: "id", page: 25 },
  { name: "settings", order: "id", page: 5 },
  { name: "story_groups", order: "id", page: 5 },
  { name: "support_conversations", order: "id", page: 25 },
  { name: "support_messages", order: "id", page: 25 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function tryRequest(query, extraHeaders = {}) {
  for (let i = 1; i <= TRIES; i++) {
    try {
      const res = await fetch(`${url}/rest/v1/${query}`, {
        headers: { ...headers, ...extraHeaders },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        const body = await res.text();
        // خطای واقعی (مثل نبودن جدول) تکرار نمی‌شه
        if (res.status >= 400 && res.status < 500) {
          throw Object.assign(new Error(`HTTP ${res.status}: ${body}`), { fatal: true });
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const range = res.headers.get("content-range");
      const data = await res.json();
      return { data, range };
    } catch (e) {
      if (e.fatal) throw e;
      process.stdout.write(".");
      await sleep(300);
    }
  }
  throw new Error(`بعد از ${TRIES} تلاش جواب نیومد: ${query}`);
}

async function countRows(table) {
  const { range } = await tryRequest(`${table}?select=*&limit=1`, { Prefer: "count=exact" });
  const total = Number(String(range || "").split("/")[1]);
  if (!Number.isFinite(total)) throw new Error(`تعداد ردیف‌های ${table} معلوم نشد (range=${range})`);
  return total;
}

fs.mkdirSync(OUT, { recursive: true, mode: 0o700 });
const summary = [];

for (const t of TABLES) {
  const file = path.join(OUT, `${t.name}.json`);
  process.stdout.write(`${t.name}: `);

  const expected = await countRows(t.name);

  // اگه قبلاً کامل گرفته شده، رد شو
  if (fs.existsSync(file)) {
    try {
      const old = JSON.parse(fs.readFileSync(file, "utf8"));
      if (Array.isArray(old) && old.length === expected) {
        console.log(`قبلاً گرفته شده (${expected} ردیف)`);
        summary.push([t.name, expected, expected]);
        continue;
      }
    } catch {}
  }

  const rows = [];
  for (let offset = 0; offset < expected; offset += t.page) {
    const { data } = await tryRequest(
      `${t.name}?select=*&order=${t.order}.asc&limit=${t.page}&offset=${offset}`
    );
    rows.push(...data);
    process.stdout.write("+");
  }

  if (rows.length !== expected) {
    console.log(`\n✗ ${t.name}: انتظار ${expected} ردیف، گرفتم ${rows.length}. دوباره اجرا کن.`);
    process.exit(2);
  }

  fs.writeFileSync(file, JSON.stringify(rows), { mode: 0o600 });
  console.log(` ✓ ${rows.length} ردیف`);
  summary.push([t.name, expected, rows.length]);
}

console.log("\n=== خلاصه (جدول / انتظار / گرفته‌شده) ===");
for (const [n, e, g] of summary) console.log(`${n.padEnd(24)} ${String(e).padStart(6)} ${String(g).padStart(6)}`);
console.log(`\nهمه‌چیز توی ${OUT} ذخیره شد.`);
