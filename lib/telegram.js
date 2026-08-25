```javascript
// lib/telegram.js

export async function notifyNewOrder(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error(
      "TELEGRAM_BOT_TOKEN یا TELEGRAM_CHAT_ID در Environment Variables وجود ندارد."
    );
    return;
  }

  const itemsText =
    (order.items || [])
      .map((item) => {
        return `• ${item.product_id} × ${item.qty} — ${Number(
          item.price
        ).toLocaleString("fa-IR")} تومان`;
      })
      .join("\n") || "اطلاعاتی ثبت نشده";

  const customer = order.customer || {};
  const payment = order.payment || {};

  const text =
    `🛒 سفارش جدید\n\n` +
    `━━━━━━━━━━━━━━\n` +
    `🔢 شماره سفارش:\n${order.id}\n\n` +
    `👤 نام مشتری:\n${customer.name || "ثبت نشده"}\n\n` +
    `📱 شماره موبایل:\n${customer.phone || "ثبت نشده"}\n\n` +
    `📍 آدرس:\n${customer.address || "ثبت نشده"}\n` +
    `━━━━━━━━━━━━━━\n\n` +
    `📦 محصولات:\n${itemsText}\n\n` +
    `━━━━━━━━━━━━━━\n` +
    `💰 مبلغ نهایی:\n${Number(
      order.total || 0
    ).toLocaleString("fa-IR")} تومان\n\n` +
    `💳 روش پرداخت:\n${payment.method || "کارت به کارت"}\n\n` +
    `🔑 کد پیگیری:\n${payment.trackingCode || "ثبت نشده"}\n\n` +
    `🕐 ساعت تراکنش:\n${
      payment.transactionTime || "ثبت نشده"
    }\n` +
    `━━━━━━━━━━━━━━`;

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

    const result = await response.json();

    if (!result.ok) {
      console.error(
        "Telegram API error:",
        result
      );
    }
  } catch (error) {
    console.error(
      "خطا در ارسال پیام تلگرام:",
      error?.message || error
    );
  }
}
```
