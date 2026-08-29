// لیست همه‌ی عکس‌های سایت که از پنل ادمین قابل تغییرن
// اگه یه عکس جدید به سایت اضافه کردی و خواستی از پنل قابل تغییر باشه،
// کافیه یه آیتم جدید اینجا اضافه کنی (path باید همون مسیری باشه که توی کد استفاده شده)

export const IMAGE_SLOTS = [
  { group: "هویت سایت", path: "/digihaze.svg", label: "لوگوی سایت" },

  { group: "اسلایدر صفحه اصلی", path: "/slider.jpg", label: "اسلاید شماره ۱" },
  { group: "اسلایدر صفحه اصلی", path: "/slider2+.jpg", label: "اسلاید شماره ۲" },
  { group: "اسلایدر صفحه اصلی", path: "/slider3.jpg", label: "اسلاید شماره ۳" },

  { group: "عکس محصولات", path: "/pod-koko-tenet.jpg", label: "پاد کوکو تنت" },
  { group: "عکس محصولات", path: "/pod-koko-tenet2.jpg", label: "پاد کوکو تنت (تصویر دوم)" },
  { group: "عکس محصولات", path: "/maxgo-22000.jpg", label: "مکس‌گو ۲۲۰۰۰" },
  { group: "عکس محصولات", path: "/salt-oxva.jpg", label: "سالت اکسوا" },
];
