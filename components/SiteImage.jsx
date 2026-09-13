"use client";

import { useEffect, useState } from "react";
import { getStorageImageUrl } from "@/lib/images";

/**
 * جایگزین <img> عادی.
 *
 * نکته مهم برای Performance:
 * آدرس Supabase از همان render اول ساخته می‌شود و منتظر useEffect نمی‌مانیم.
 * این کار جلوی درخواست اولیه‌ی 404 به /public و سپس تعویض src را می‌گیرد.
 *
 * برای تصویر LCP می‌توانی priority را true کنی:
 * <SiteImage src="/slider.jpg" priority ... />
 */
export default function SiteImage({
  src,
  alt = "",
  priority = false,
  loading,
  fetchPriority,
  ...rest
}) {
  // آدرس نهایی را همان لحظه‌ی render مشخص کن تا مرورگر بتواند
  // تصویر مهم را از HTML اولیه سریع‌تر discover کند.
  const resolvedSrc = getStorageImageUrl(src);
  const [current, setCurrent] = useState(resolvedSrc);

  useEffect(() => {
    setCurrent(getStorageImageUrl(src));
  }, [src]);

  const imageLoading =
    loading ?? (priority ? "eager" : undefined);

  const imageFetchPriority =
    fetchPriority ?? (priority ? "high" : undefined);

  return (
    <img
      {...rest}
      src={current}
      alt={alt}
      loading={imageLoading}
      fetchPriority={imageFetchPriority}
      decoding="async"
      onError={() => {
        // اگر نسخه‌ی آپلودشده در Storage وجود نداشت،
        // به عکس پیش‌فرض داخل public برگرد.
        if (current !== src) setCurrent(src);
      }}
    />
  );
}
