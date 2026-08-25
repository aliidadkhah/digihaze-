// lib/telegram.js

// ارسال پیام اطلاع‌رسانی سفارش جدید به تلگرام
export async function notifyNewOrder(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("متغیرهای تلگرام تنظیم نشده‌اند.");
    return;
  }

  const itemsText = (order.items || [])
    .map((i) => `• ${i.product_id} × ${i.qty}`)
    .join("\n");

  const text =
    `🛒 سفارش جدید در ابرفروش\n\n` +
    `شماره سفارش: ${order.id}\n` +
    `مبلغ: ${Number(order.total).toLocaleString("fa-IR")} تومان\n\n` +
    `👤 مشتری:\n` +
    `${order.full_name || "-"}\n\n` +
    `📱 موبایل:\n` +
    `${order.phone || "-"}\n\n` +
    `📍 آدرس:\n` +
    `${order.address || "-"}\n\n` +
    `📮 کد پستی:\n` +
    `${order.postal_code || "-"}\n\n` +
    `📦 اقلام:\n` +
    `${itemsText}`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      }
    );

    if (!response.ok) {
      const result = await response.text();
      console.error("خطا از Telegram:", result);
    }
  } catch (e) {
    console.error("خطا در ارسال پیام تلگرام:", e.message);
  }
}


// ارسال اطلاعات پرداخت کارت‌به‌کارت به تلگرام
export async function notifyPayment(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("متغیرهای تلگرام تنظیم نشده‌اند.");
    return;
  }

  const text =
    `💳 پرداخت جدید در ابرفروش\n\n` +
    `🆔 شماره سفارش:\n${order.id}\n\n` +
    `💰 مبلغ:\n${Number(order.total).toLocaleString("fa-IR")} تومان\n\n` +
    `👤 مشتری:\n${order.full_name || "-"}\n\n` +
    `📱 موبایل:\n${order.phone || "-"}\n\n` +
    `📍 آدرس:\n${order.address || "-"}\n\n` +
    `📮 کد پستی:\n${order.postal_code || "-"}\n\n` +
    `🔢 کد پیگیری تراکنش:\n${order.payment_tracking_code || "-"}\n\n` +
    `🕐 ساعت تراکنش:\n${order.payment_time || "-"}\n\n` +
    `⏳ وضعیت:\nدر انتظار بررسی پرداخت`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      }
    );

    if (!response.ok) {
      const result = await response.text();
      console.error("خطا از Telegram:", result);
    }
  } catch (e) {
    console.error("خطا در ارسال پرداخت به تلگرام:", e.message);
  }
}
