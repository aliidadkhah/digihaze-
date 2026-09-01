"use client";

import { useEffect, useState } from "react";
import { getStorageImageUrl } from "@/lib/images";

/**
 * جایگزین <img> عادی.
 * اول سعی می‌کنه عکس رو از Supabase Storage (که از پنل ادمین آپلود شده) بگیره،
 * اگه پیدا نشد (یعنی هنوز کسی عکس رو عوض نکرده) خودکار برمی‌گرده به فایل محلی داخل public/
 *
 * استفاده دقیقا مثل <img> عادیه:
 * <SiteImage src="/pod-koko-tenet.jpg" alt="..." style={{...}} />
 */
export default function SiteImage({ src, alt = "", ...rest }) {
  const [current, setCurrent] = useState(src);

  useEffect(() => {
    setCurrent(getStorageImageUrl(src));
  }, [src]);

  return (
    <img
      {...rest}
      src={current}
      alt={alt}
      onError={() => {
        // اگه نسخه‌ی آپلودشده در Storage پیدا نشد، برگرد به عکس پیش‌فرض سایت
        if (current !== src) setCurrent(src);
      }}
    />
  );
}
