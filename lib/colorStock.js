// توابع کمکی موجودی رنگ‌ها (بدون وابستگی به سرور؛ هم توی کلاینت هم سرور قابل استفاده‌ان)
//
// stock روی هر رنگ:
//   - null / undefined  => موجودی نامحدود (ثبت نشده)
//   - عدد >= 1          => همون تعداد موجوده
//   - 0                 => ناموجود

export function isColorSoldOut(color) {
  if (!color) return false;
  if (color.stock === null || color.stock === undefined) return false;
  return Number(color.stock) <= 0;
}

// اولین رنگ موجود (برای انتخاب پیش‌فرض)؛ اگه همه تموم شده باشن، اولین رنگ
export function firstAvailableColor(colors) {
  if (!Array.isArray(colors) || colors.length === 0) return null;
  return colors.find((c) => !isColorSoldOut(c)) || colors[0];
}
