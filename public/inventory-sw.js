// سرویس‌ورکر ساده؛ فقط برای قابل‌نصب بودن اپ. هیچ چیزی کش نمی‌کند،
// چون موجودی انبار باید همیشه تازه و مستقیم از سرور بیاد.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
