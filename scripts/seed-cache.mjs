// =====================================================
// seed-cache.mjs  —  اجرا روی «خود سرور» (توی پوشه‌ی پروژه)
//
//   cd /root/digihaze
//   set -a; . ./.env; set +a
//   node scripts/seed-cache.mjs
//
// لیست محصولات رو با درخواست‌های «کوچیک» (صفحه‌های ۸تایی) و تلاش مجدد زیاد از
// Supabase می‌گیره (چون درخواست بزرگ از این سرور معمولاً گیر می‌کنه) و مستقیم
// توی کش دیسکی سایت می‌ذاره (/tmp/digihaze-cache). بعدش سایت حتی وقتی اتصال
// به Supabase خرابه، با این داده بالا میاد.
//
// آدرس و کلید رو از .env می‌خونه؛ یا می‌شه دستی داد:
//   node scripts/seed-cache.mjs https://XXXX.supabase.co ANON_KEY [پوشه‌ی خروجی]
// =====================================================
import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";

const [, , URL_ARG, KEY_ARG, OUT_ARG] = process.argv;
const OUT_DIR =
  OUT_ARG ||
  process.env.CACHE_SNAPSHOT_DIR ||
  path.join(os.tmpdir(), "digihaze-cache");
const PAGE = 8;            // تعداد محصول در هر درخواست
const TRY_PER_PAGE = 40;   // تلاش مجدد برای هر صفحه
const TIMEOUT_MS = 15000;  // مهلت هر تلاش
const url = (URL_ARG || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = KEY_ARG || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!url || !key) {
  console.error("آدرس یا کلید پیدا نشد. اول این رو بزن:  set -a; . ./.env; set +a");
  process.exit(1);
}

// دقیقاً همون mapRow سایت (lib/products.js)
function mapRow(row) {
  // ---------------------------------------------------
  // نظرات
  // ---------------------------------------------------

  const reviews = Array.isArray(row.reviews)
    ? row.reviews.filter(Boolean)
    : [];

  // ---------------------------------------------------
  // تعداد نظرات
  // ---------------------------------------------------

  const reviewsCount =
    Number(row.reviews_count) || reviews.length;

  // ---------------------------------------------------
  // امتیاز
  // ---------------------------------------------------

  const rating =
    Number(row.rating) || 0;

  // ---------------------------------------------------
  // slug
  // ---------------------------------------------------

  const slug =
    typeof row.slug === "string" &&
    row.slug.trim()
      ? row.slug.trim()
      : null;

  // ===================================================
  // خروجی
  // ===================================================

  return {
    // =================================================
    // اطلاعات اصلی
    // =================================================

    id: row.id,

    name: row.name || "",

    slug,

    category: row.category || "",

    brand: row.brand || "",

    // طعم و قدرت نیکوتین (برای صفحات لندینگ taxonomy)
    flavor: row.flavor || "",

    nicotine: row.nicotine || "",

    updated_at:
      row.updated_at || null,

    // =================================================
    // قیمت
    // =================================================

    price:
      Number(row.price) || 0,

    discount:
      Number(row.discount) || 0,

    // قیمت نهایی دقیقی که ادمین ثبت کرده (منبع اصلی قیمت با تخفیف)
    finalPrice:
      Number(row.final_price) || 0,

    // =================================================
    // امتیاز و نظرات
    // =================================================

    rating,

    reviewsCount,

    reviews,

    // =================================================
    // ظاهر
    // =================================================

    // اگر رنگی برای محصول ثبت نشده باشد (مثلا محصولات قدیمی)، یک رنگ پیش‌فرض
    // استفاده می‌شود تا برچسب و هاور کارت بی‌رنگ نمانند
    color:
      row.color || "#0A84FF",

    badge:
      row.badge || "",

    // =================================================
    // موجودی
    // =================================================

    available:
      row.available !== false,

    // =================================================
    // تصاویر
    // =================================================

    images:
      Array.isArray(row.images)
        ? row.images.filter(Boolean)
        : [],

    // =================================================
    // رنگ‌های محصول
    // =================================================

    colors:
      Array.isArray(row.colors)
        ? row.colors.map((c, i) => ({
            id:
              c?.id ||
              `${row.id}-color-${i}`,

            name:
              c?.name || "",

            hex:
              c?.hex || "#000000",

            // موجودی این رنگ؛ null یعنی نامحدود
            stock:
              c?.stock === null ||
              c?.stock === undefined
                ? null
                : Number(c.stock),
          }))
        : [],

    // =================================================
    // توضیحات
    // =================================================

    description:
      row.description || "",

    // =================================================
    // مشخصات فنی
    // =================================================

    specs:
      Array.isArray(row.specs)
        ? row.specs
        : [],

    // =================================================
    // ویژگی‌های مهم (خلاصه‌ای که زیر دکمه افزودن به سبد نشون داده می‌شه)
    // =================================================

    features:
      Array.isArray(row.features)
        ? row.features.filter(Boolean)
        : [],

    // =================================================
    // برچسب‌ها (تگ‌ها)
    // =================================================

    tags:
      Array.isArray(row.tags)
        ? row.tags.filter(Boolean)
        : [],

    // =================================================
    // اطلاعات برند
    // =================================================

    brandDescription:
      row.brand_description || "",

    brandImage:
      row.brand_image || "",

    // =================================================
    // پرسش و پاسخ
    // =================================================

    qa:
      Array.isArray(row.qa)
        ? row.qa
        : [],
  };
}

async function fetchPage(order, offset) {
  for (let i = 1; i <= TRY_PER_PAGE; i++) {
    try {
      const res = await fetch(
        `${url}/rest/v1/products?select=*&order=${order}&limit=${PAGE}&offset=${offset}`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return await res.json();
    } catch (e) {
      process.stdout.write(".");
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`صفحه‌ی ${offset} بعد از ${TRY_PER_PAGE} تلاش نیومد`);
}

async function fetchRows(order) {
  const all = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await fetchPage(order, offset);
    all.push(...page);
    process.stdout.write(`+${page.length} `);
    if (page.length < PAGE) break;
  }
  console.log();
  return all;
}

// دو کش: «products:all» برای صفحه‌های سرور و «products:raw» برای مرورگر (/api/products-raw)
console.log("در حال گرفتن محصولات (هر نقطه = یه تلاش ناموفق، طبیعیه)...");
const rowsAll = await fetchRows("available.desc,sort_order.asc,id.asc");
const rowsRaw = await fetchRows("available.desc,created_at.desc,sort_order.asc,id.asc");

fs.mkdirSync(OUT_DIR, { recursive: true });

function save(cacheKey, value) {
  const name = crypto.createHash("sha1").update(cacheKey).digest("hex") + ".json";
  fs.writeFileSync(path.join(OUT_DIR, name), JSON.stringify(cacheKey) + "\n" + JSON.stringify(value));
  console.log(`✓ ${cacheKey}: ${value.length} محصول -> ${path.join(OUT_DIR, name)}`);
}

save("products:all", rowsAll.map(mapRow));
save("products:raw", rowsRaw);
