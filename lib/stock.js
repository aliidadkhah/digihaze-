import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { redeemDiscountCode, releaseDiscountCode } from "@/lib/discount";

// ⚠️ فقط توی Route Handler ها (سمت سرور) ایمپورت بشه.

// سفارش‌هایی که موجودی رو نگه می‌دارن (رزرو کردن). failed/cancelled موجودی رو آزاد می‌کنن.
const ACTIVE_STATUSES = ["pending", "paid"];
export const VALID_STATUSES = ["pending", "paid", "failed", "cancelled"];

const isActive = (status) => ACTIVE_STATUSES.includes(status);

async function adjust(item, delta) {
  const { data, error } = await supabaseAdmin.rpc("adjust_color_stock", {
    p_product_id: String(item.product_id),
    p_color_name: item.variant || "",
    p_delta: delta,
  });

  if (error) {
    console.error("STOCK RPC ERROR:", error);
    return { ok: false, reason: "rpc_error" };
  }

  return data || { ok: false, reason: "empty" };
}

function reserveErrorMessage(item, result) {
  const label = item.product_name
    ? `«${item.product_name}»${item.variant ? ` (${item.variant})` : ""}`
    : item.variant
    ? `رنگ «${item.variant}»`
    : "این محصول";

  switch (result.reason) {
    case "insufficient":
      return result.stock > 0
        ? `موجودی ${label} فقط ${result.stock} عدد است`
        : `${label} ناموجود شده است`;
    case "color_not_found":
      return `رنگ انتخاب‌شده برای ${label} معتبر نیست`;
    case "not_found":
      return "محصول پیدا نشد";
    default:
      return "خطا در بررسی موجودی، لطفاً دوباره تلاش کنید";
  }
}

// موجودی همه‌ی آیتم‌ها رو کم می‌کنه. اگه یکی‌شون کافی نبود،
// اونایی که قبلاً کم شدن رو برمی‌گردونه و خطا می‌ده.
export async function reserveStock(items) {
  const done = [];

  for (const item of items) {
    const result = await adjust(item, -item.qty);

    if (!result.ok) {
      await restoreStock(done);
      return { ok: false, error: reserveErrorMessage(item, result) };
    }

    done.push(item);
  }

  return { ok: true };
}

// موجودی رو برمی‌گردونه. هیچوقت throw نمی‌کنه (فقط لاگ می‌گیره)
export async function restoreStock(items) {
  for (const item of items || []) {
    try {
      const result = await adjust(item, item.qty);
      if (!result.ok) {
        console.error("STOCK RESTORE FAILED:", item, result);
      }
    } catch (e) {
      console.error("STOCK RESTORE ERROR:", e);
    }
  }
}

// تغییر وضعیت سفارش + هماهنگ کردن موجودی:
//   pending/paid  -> failed/cancelled : موجودی برمی‌گرده
//   failed/cancelled -> pending/paid  : موجودی دوباره کم می‌شه
// force=true یعنی پول قبلاً دریافت شده (مثلاً تایید درگاه)، پس حتی اگه
// موجودی کافی نبود، وضعیت رو عوض کن.
export async function changeOrderStatus(
  orderId,
  newStatus,
  extra = {},
  { force = false } = {}
) {
  const { data: current, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("status, discount_code")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError || !current) {
    return { ok: false, status: 404, error: "سفارش پیدا نشد" };
  }

  const wasActive = isActive(current.status);
  const willBeActive = isActive(newStatus);

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_id, variant, qty")
    .eq("order_id", orderId);

  let reservedAgain = false;

  if (!wasActive && willBeActive) {
    const reserved = await reserveStock(items || []);

    if (reserved.ok) {
      reservedAgain = true;
    } else if (!force) {
      return { ok: false, status: 409, error: reserved.error };
    } else {
      console.error("FORCED STATUS CHANGE WITHOUT STOCK:", orderId, reserved.error);
    }
  }

  // فقط اگه وضعیت هنوز همونی باشه که خوندیم آپدیت می‌کنیم (جلوگیری از دوبار برگردوندن موجودی)
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .update({ ...extra, status: newStatus })
    .eq("id", orderId)
    .eq("status", current.status)
    .select("*, order_items(*)")
    .maybeSingle();

  if (error || !order) {
    if (reservedAgain) await restoreStock(items || []);
    return {
      ok: false,
      status: 500,
      error: error?.message || "وضعیت سفارش هم‌زمان تغییر کرد، دوباره تلاش کنید",
    };
  }

  if (wasActive && !willBeActive) {
    await restoreStock(items || []);
    if (current.discount_code) await releaseDiscountCode(current.discount_code);
  }

  if (!wasActive && willBeActive && current.discount_code) {
    // برگردوندن سفارشی که قبلاً failed/cancelled شده به pending/paid
    // (مثلاً اصلاح دستی توسط ادمین) — شمارنده‌ی کد تخفیف دوباره بالا می‌ره.
    // اگه سقف استفاده پر شده باشه هم جلوی تغییر وضعیت سفارش رو نمی‌گیریم،
    // فقط لاگ می‌کنیم (این مسیر نادره و نباید سفارش رو گیر بندازه).
    const redeemed = await redeemDiscountCode(current.discount_code);
    if (!redeemed.ok) {
      console.error("DISCOUNT RE-REDEEM FAILED ON STATUS CHANGE:", orderId, current.discount_code);
    }
  }

  return { ok: true, order, previousStatus: current.status };
}
