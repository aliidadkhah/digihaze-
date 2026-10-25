import { createClient } from "@supabase/supabase-js";
import { resolveCategoryId } from "@/lib/data";
import { createFetchWithTimeout } from "./fetchWithTimeout";
import { cached } from "./serverCache";
import {
  FLAVORS,
  NICOTINE_LEVELS,
  TAXONOMY_CATEGORIES,
  TAXONOMY_TYPES,
  hasTaxonomyValue,
} from "@/lib/taxonomy";

const timeoutFetch = createFetchWithTimeout(4000, { readRetries: 4 });

// مدت اعتبار کش منو؛ بعد از هر تغییر محصول از پنل ادمین کش خودکار پاک می‌شه.
const MENU_TTL_MS = 60_000;

// =====================================================
// منوی بالای سایت: گروه‌های «قدرت نیکوتین» و «طعم»
//
// فقط ترکیب‌هایی که حداقل یک محصول دارن نشون داده می‌شن
// (صفحه‌ی خالی ۴۰۴ می‌ده، پس لینکش هم نباید توی منو باشه).
//
// خروجی:
// {
//   "salt-nicotine": [
//     { title: "بر اساس قدرت نیکوتین", links: [{ label, href }] },
//     { title: "بر اساس طعم", links: [...] },
//   ]
// }
// اگه ستون‌ها هنوز توی Supabase ساخته نشده باشن یا خطایی بیاد،
// خروجی خالیه و منو مثل قبل کار می‌کنه.
// =====================================================

async function buildTaxonomyMenu() {
  {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) return {};

    const supabase = createClient(url, key, {
      global: {
        fetch: (input, init) =>
          timeoutFetch(input, { ...init, cache: "no-store" }),
      },
    });

    const { data, error } = await supabase
      .from("products")
      .select("category, flavor, nicotine");

    // خطا پرتاب می‌شه تا نتیجه‌ی خالیِ ناشی از خطا کش نشه
    if (error || !data) throw error || new Error("taxonomy menu: no data");

    const menu = {};

    for (const category of TAXONOMY_CATEGORIES) {
      const rows = data.filter(
        (p) => resolveCategoryId(p.category) === category
      );

      const groups = [
        {
          title: "بر اساس قدرت نیکوتین",
          type: "nicotine",
          items: NICOTINE_LEVELS,
        },
        { title: "بر اساس طعم", type: "flavor", items: FLAVORS },
      ]
        .map((g) => ({
          title: g.title,
          links: Object.values(g.items)
            .filter((item) =>
              rows.some((p) => hasTaxonomyValue(p, g.type, item.id))
            )
            .map((item) => ({
              label: item.label,
              href: `/shop/${category}/${TAXONOMY_TYPES[g.type].segment}/${item.id}`,
            })),
        }))
        .filter((g) => g.links.length > 0);

      if (groups.length > 0) menu[category] = groups;
    }

    return menu;
  }
}

export async function getTaxonomyMenu() {
  try {
    return await cached("taxonomy:menu", MENU_TTL_MS, buildTaxonomyMenu);
  } catch (e) {
    console.error("getTaxonomyMenu error:", e);
    return {};
  }
}
