// این فایل هم توی کلاینت (صفحه checkout) و هم توی API روی سرور
// (app/api/orders/route.js) ایمپورت می‌شه، تا هزینه‌ی هر روش ارسال
// فقط در یک جا تعریف بشه و سرور همیشه از روی همین لیست قیمت واقعی
// رو حساب کنه، نه از روی چیزی که کلاینت توی درخواست فرستاده.

export const SHIPPING_METHODS = [
  {
    id: "tipax",
    label: "ارسال با تیپاکس (پس‌کرایه)",
    desc: "۲ الی ۳ روز کاری — هزینه در مقصد از گیرنده دریافت می‌شود",
    cost: 0,
  },
  {
    id: "post",
    label: "ارسال با پست",
    desc: "۳ الی ۵ روز کاری",
    cost: 179000,
  },
  {
    id: "chapar",
    label: "ارسال با چاپار (پس‌کرایه)",
    desc: "۲ الی ۳ روز کاری — هزینه در مقصد از گیرنده دریافت می‌شود",
    cost: 0,
  },
];

export function getShippingCost(methodId) {
  const method = SHIPPING_METHODS.find((m) => m.id === methodId);
  return method ? method.cost : null;
}
