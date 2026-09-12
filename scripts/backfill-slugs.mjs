// =====================================================
// اسکریپت یک‌باره: پر کردن اسلاگ برای محصولاتی که
// الان slug ندارن (URL شون فعلاً p1, p3, یا UUID هست)
//
// اجرا:
//   node --env-file=.env.local scripts/backfill-slugs.mjs
//
// نکته: از SUPABASE_SERVICE_ROLE_KEY استفاده می‌کنه، پس
// این اسکریپت رو فقط لوکال اجرا کن، نه توی کد سمت کلاینت.
// =====================================================

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "SUPABASE_URL یا SUPABASE_SERVICE_ROLE_KEY تنظیم نشده. مطمئن شو .env.local رو با --env-file پاس می‌دی."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

function slugify(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(name, existingSlugs) {
  const base = slugify(name);
  if (!base) return null;

  let candidate = base;
  let counter = 2;

  while (existingSlugs.has(candidate)) {
    candidate = `${base}-${counter}`;
    counter++;
  }

  return candidate;
}

async function main() {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, slug")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("خطا در خواندن محصولات:", error.message);
    process.exit(1);
  }

  const existingSlugs = new Set(
    products.filter((p) => p.slug).map((p) => p.slug)
  );

  const needsSlug = products.filter((p) => !p.slug);

  console.log(`${products.length} محصول کل، ${needsSlug.length} تای اونا اسلاگ ندارن.`);

  for (const product of needsSlug) {
    const slug = await generateUniqueSlug(product.name, existingSlugs);

    if (!slug) {
      console.warn(`⚠️  محصول ${product.id} اسم نداره، رد شد.`);
      continue;
    }

    existingSlugs.add(slug);

    const { error: updateError } = await supabase
      .from("products")
      .update({ slug })
      .eq("id", product.id);

    if (updateError) {
      console.error(`❌ ${product.name} (${product.id}):`, updateError.message);
    } else {
      console.log(`✅ ${product.name} -> ${slug}`);
    }
  }

  console.log("تمام شد.");
}

main();
