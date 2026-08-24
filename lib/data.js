export const CATEGORIES = [
  { id: "eliquid", label: "سالت نیکوتین", color: "#2F86FF" },
  { id: "device", label: "پاد دائمی", color: "#FF8A3D" },
  { id: "pod", label: "کارتریج", color: "#22E5C9" },
  { id: "accessory", label: "پاد یکبارمصرف", color: "#C6FF3D" },
];

export const PRODUCTS = [
  {
    id: "p1",
    name: "Caliburn tenet koko",
    category: "device",
    brand: "caliburn",
    price: 480000,
    discount: 0,
    rating: 4.8,
    reviewsCount: 132,
    color: "#2F86FF",
    badge: "پرفروش",
     images: [
  "/پاد کوکو تنت.jpg",
  "https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?q=80&w=800&auto=format&fit=crop",
],
    description:
      "ترکیب خنک توت‌فرنگی تازه با ضربه‌ی یخ در انتهای پاف. نسبت VG/PG پنجاه‌پنجاه برای تعادل بین دود و طعم. مناسب دستگاه‌های پاد و ساب‌اهم.",
    specs: [
      { k: "حجم", v: "30 میلی‌لیتر" },
      { k: "نیکوتین", v: "3 / 6 / 12 mg" },
      { k: "نسبت VG/PG", v: "50/50" },
    ],
    reviews: [
      { name: "امیر", rating: 5, text: "طعم واقعا شبیه توت‌فرنگیه، خنکیش هم زیاد نیست." },
      { name: "سارا", rating: 4, text: "خوبه ولی دود کمتر از انتظارم بود." },
    ],
  },
  {
    id: "p2",
    name: "پاد یکبارمصرف 22000 پاف MaxGo",
    category: "accessory",
    brand: "PurpleFog",
    price: 420000,
    discount: 0,
    rating: 4.6,
    reviewsCount: 88,
    color: "#FF8A3D",
    badge: "",
    images: ["https://images.unsplash.com/photo-1618330834871-dbf3673c19f8?q=80&w=800&auto=format&fit=crop"],
    description: "طعم انگور بنفش با ته‌مزه‌ی شیرین ملایم، بدون گزش زیاد در گلو.",
    specs: [
      { k: "حجم", v: "30 میلی‌لیتر" },
      { k: "نیکوتین", v: "0 / 3 / 6 mg" },
      { k: "نسبت VG/PG", v: "70/30" },
    ],
    reviews: [{ name: "رضا", rating: 5, text: "بهترین انگوریه که امتحان کردم." }],
  },
  {
    id: "p3",
    name: "دستگاه ویپ Nova Mesh Kit",
    category: "device",
    brand: "Nova",
    price: 2350000,
    discount: 10,
    rating: 4.9,
    reviewsCount: 210,
    color: "#22E5C9",
    badge: "جدید",
    images: ["https://images.unsplash.com/photo-1560807707-8cc77767d783?q=80&w=800&auto=format&fit=crop"],
    description:
      "کیت تمام‌اتوماتیک با کویل مش، باتری داخلی 1200 میلی‌آمپر و رگولاتور توان هوشمند. برای مصرف روزانه و طعم‌دهی حداکثری طراحی شده.",
    specs: [
      { k: "باتری", v: "1200mAh" },
      { k: "پاور", v: "5 - 40 وات" },
      { k: "مخزن", v: "4 میلی‌لیتر" },
    ],
    reviews: [{ name: "نیما", rating: 5, text: "کیفیت ساختش عالیه، شارژش هم سریعه." }],
  },
  {
    id: "p4",
    name: "پاد یدکی مش کویل 0.6",
    category: "pod",
    brand: "Nova",
    price: 180000,
    discount: 0,
    rating: 4.5,
    reviewsCount: 64,
    color: "#22E5C9",
    badge: "",
    images: ["https://images.unsplash.com/photo-1612194808558-2d0d0b0f8e4e?q=80&w=800&auto=format&fit=crop"],
    description: "پک سه‌عددی پاد یدکی سازگار با کیت‌های Nova Mesh، عمر مفید بالا و طعم‌دهی پایدار.",
    specs: [
      { k: "مقاومت", v: "0.6 اهم" },
      { k: "تعداد", v: "3 عدد" },
    ],
    reviews: [],
  },
  {
    id: "p5",
    name: "مایع ویپ هندوانه یخی",
    category: "eliquid",
    brand: "CloudBerry",
    price: 460000,
    discount: 20,
    rating: 4.7,
    reviewsCount: 156,
    color: "#C6FF3D",
    badge: "تخفیف ویژه",
    images: ["https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800&auto=format&fit=crop"],
    description: "هندوانه‌ی تابستانی با خنکای ملایم، یکی از پرطرفدارترین ترکیب‌های فصل.",
    specs: [
      { k: "حجم", v: "30 میلی‌لیتر" },
      { k: "نیکوتین", v: "3 / 6 mg" },
    ],
    reviews: [{ name: "مهدی", rating: 5, text: "فوق‌العادست، هم خنک هم شیرین." }],
  },
  {
    id: "p6",
    name: "کیف حمل و نگهداری ویپ",
    category: "accessory",
    brand: "CarryOn",
    price: 210000,
    discount: 0,
    rating: 4.3,
    reviewsCount: 40,
    color: "#C6FF3D",
    badge: "",
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop"],
    description: "کیف مقاوم با جاسازی اختصاصی برای دستگاه، پاد یدکی و مایع.",
    specs: [{ k: "جنس", v: "نئوپرن ضدضربه" }],
    reviews: [],
  },
];

export const money = (n) => n.toLocaleString("fa-IR") + " تومان";
export const discountedPrice = (p) => Math.round(p.price * (1 - p.discount / 100));

export function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

export function getRelated(product, limit = 4) {
  return PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, limit);
}
