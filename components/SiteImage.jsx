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
 *
 * برای گوشی می‌تونی یه عکس مجزا (سبک‌تر/برش‌خورده) بدی که فقط زیر
 * ۷۶۸px بارگذاری می‌شه، نه هر دو عکس:
 * <SiteImage src="/slider.jpg" mobileSrc="/slider-mobile.jpg" priority ... />
 */
export default function SiteImage({
  src,
  mobileSrc,
  alt = "",
  priority = false,
  loading,
  fetchPriority,
  ...rest
}) {
  // آدرس نهایی را همان لحظه‌ی render مشخص کن تا مرورگر بتواند
  // تصویر مهم را از HTML اولیه سریع‌تر discover کند.
  const resolvedSrc = getStorageImageUrl(src);
  const resolvedMobileSrc = mobileSrc
    ? getStorageImageUrl(mobileSrc)
    : null;

  const [current, setCurrent] = useState(resolvedSrc);
  // اگه نسخه‌ی موبایل هم لود نشد (مثلا هنوز آپلود نشده)، دیگه
  // سراغش نریم و همون نسخه‌ی دسکتاپ/پیش‌فرض رو نشون بدیم.
  const [mobileFailed, setMobileFailed] = useState(false);

  useEffect(() => {
    setCurrent(getStorageImageUrl(src));
    setMobileFailed(false);
  }, [src, mobileSrc]);

  const imageLoading =
    loading ?? (priority ? "eager" : undefined);

  const imageFetchPriority =
    fetchPriority ?? (priority ? "high" : undefined);

  const img = (
    <img
      {...rest}
      src={current}
      alt={alt}
      loading={imageLoading}
      fetchPriority={imageFetchPriority}
      decoding="async"
      onError={() => {
        // اگر نسخه‌ی آپلودشده در Storage وجود نداشت (چه دسکتاپ چه موبایل)،
        // به عکس پیش‌فرض داخل public برگرد.
        if (current !== src) {
          setCurrent(src);
        } else {
          setMobileFailed(true);
        }
      }}
    />
  );

  // اگه عکس موبایل داده شده، با <picture> فقط همون سایزی که لازمه
  // دانلود می‌شه (نه هر دو تا)؛ این یعنی سرعت بیشتر روی گوشی.
  if (resolvedMobileSrc && !mobileFailed) {
    return (
      <picture>
        <source
          media="(max-width: 768px)"
          srcSet={resolvedMobileSrc}
        />
        {img}
      </picture>
    );
  }

  return img;
}
