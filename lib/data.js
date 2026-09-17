// نگاشت شناسه‌های قدیمی دسته‌بندی
// تا زمانی که دسته‌بندی‌های قدیمی در Supabase وجود دارند،
// این نگاشت باعث می‌شود URLها و فیلترهای قدیمی همچنان به
// دسته‌بندی جدید هدایت منطقی شوند.
export const LEGACY_CATEGORY_MAP = {
  pod: "pod-system",
  device: "disposable-pod",
  salt: "salt-nicotine",
};

// تبدیل شناسه دسته‌بندی قدیمی به شناسه جدید
export function resolveCategoryId(categoryId) {
  return LEGACY_CATEGORY_MAP[categoryId] || categoryId;
}

// دسته‌بندی‌های اصلی فروشگاه
export const CATEGORIES = [
  {
    id: "pod-system",
    label: "پاد سیستم",
    color: "#22E5C9",
    image: "/category-pod-system.jpg",
    banner: "/category-banner-pod-system.jpg",

    // برندهای قابل فیلتر در دسته‌بندی پاد سیستم
    subcategories: [
      {
        id: "nova",
        label: "Nova",
        nameFa: "",
        logo: null,
      },
      {
        id: "uwell",
        label: "Uwell",
        nameFa: "",
        logo: null,
      },
      {
        id: "oxva",
        label: "Oxva",
        nameFa: "",
        logo: null,
      },
      {
        id: "vaporesso",
        label: "Vaporesso",
        nameFa: "",
        logo: null,
      },
      {
        id: "geekvape",
        label: "Geek Vape",
        nameFa: "",
        logo: null,
      },
    ],
  },

  {
    id: "salt-nicotine",
    label: "سالت نیکوتین",
    color: "#2F86FF",
    image: "/category-salt-nicotine.jpg",
    banner: "/category-banner-salt-nicotine.jpg",

    // برندهای قابل فیلتر در دسته‌بندی سالت نیکوتین
    subcategories: [
      {
        id: "oxva",
        label: "Oxva",
        nameFa: "",
        logo: null,
      },
      {
        id: "cloudberry",
        label: "CloudBerry",
        nameFa: "",
        logo: null,
      },
      {
        id: "brand3",
        label: "Brand 3",
        nameFa: "",
        logo: null,
      },
      {
        id: "brand4",
        label: "Brand 4",
        nameFa: "",
        logo: null,
      },
    ],
  },

  {
    id: "disposable-pod",
    label: "پاد یکبار مصرف",
    color: "#FF8A3D",
    image: "/category-disposable-pod.jpg",
    banner: "/category-banner-disposable-pod.jpg",

    // برندهای قابل فیلتر در دسته‌بندی پاد یکبار مصرف
    subcategories: [
      {
        id: "caliburn",
        label: "Caliburn",
        nameFa: "",
        logo: null,
      },
      {
        id: "vaporlab",
        label: "VaporLab",
        nameFa: "",
        logo: null,
      },
      {
        id: "vozol",
        label: "Vozol",
        nameFa: "",
        logo: null,
      },
      {
        id: "maxgo",
        label: "MaxGo",
        nameFa: "",
        logo: null,
      },
    ],
  },

  {
    id: "cartridge",
    label: "کارتریج",
    color: "#C6FF3D",
    image: "/category-cartridge.jpg",
    banner: "/category-banner-cartridge.jpg",

    // برندهای قابل فیلتر در دسته‌بندی کارتریج
    subcategories: [
      {
        id: "carryon",
        label: "CarryOn",
        nameFa: "",
        logo: null,
      },
      {
        id: "purplefog",
        label: "PurpleFog",
        nameFa: "",
        logo: null,
      },
      {
        id: "brand3",
        label: "Brand 3",
        nameFa: "",
        logo: null,
      },
      {
        id: "brand4",
        label: "Brand 4",
        nameFa: "",
        logo: null,
      },
    ],
  },
];

// اعمال تنظیمات زیردسته‌ها که از پنل ادمین ذخیره شده‌اند.
//
// ساختار overrides در Supabase:
// {
//   "pod-system": [{ id, label }, ...],
//   "salt-nicotine": [{ id, label }, ...],
//   ...
// }
export function applySubcategoryOverrides(overrides) {
  if (!overrides || typeof overrides !== "object") {
    return CATEGORIES;
  }

  return CATEGORIES.map((cat) => {
    const override = overrides[cat.id];

    return Array.isArray(override)
      ? {
          ...cat,
          subcategories: override,
        }
      : cat;
  });
}

// نمایش قیمت به فرمت فارسی
export const money = (n) =>
  Number(n || 0).toLocaleString("fa-IR") + " تومان";

// محاسبه قیمت نهایی محصول
//
// اگر finalPrice در Supabase ثبت شده باشد، همان قیمت دقیق استفاده می‌شود.
// در غیر این صورت قیمت بر اساس درصد تخفیف محاسبه خواهد شد.
//
// نکته:
// discount صرفاً برای نمایش درصد تخفیف استفاده می‌شود و اگر finalPrice
// وجود داشته باشد، دوباره از روی درصد تخفیف قیمت محاسبه نمی‌کنیم.
export const discountedPrice = (p) => {
  if (
    p?.finalPrice &&
    Number(p.finalPrice) > 0
  ) {
    return Math.round(Number(p.finalPrice));
  }

  const price = Number(p?.price || 0);
  const discount = Number(p?.discount || 0);

  return Math.round(
    price * (1 - discount / 100)
  );
};
