// ارسال پیام اطلاع‌رسانی سفارش جدید به تلگرام (نسخه‌ی سرور Next.js)

export async function notifyNewOrder(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const itemsText = (order.items || []).map((i) => `• ${i.product_id} × ${i.qty}`).join("\n");

  const text =
    `🛒 سفارش جدید در ابرفروش\n\n` +
    `شماره سفارش: ${order.id}\n` +
    `مبلغ: ${order.total.toLocaleString("fa-IR")} تومان\n\n` +
    `اقلام:\n${itemsText}`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (e) {
    console.error("خطا در ارسال پیام تلگرام:", e.message);
  }
}
