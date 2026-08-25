export async function notifyNewOrder(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("Telegram environment variables are missing");
    return;
  }

  const items = (order.items || [])
    .map(
      (item) =>
        `• ${item.product_id} × ${item.qty} — ${Number(
          item.price
        ).toLocaleString("fa-IR")} تومان`
    )
    .join("\n");

  const text = `
🛒 سفارش جدید

🔢 شماره سفارش:
${order.id}

👤 نام مشتری:
${order.customer_name || "ثبت نشده"}

📱 شماره موبایل:
${order.customer_phone || "ثبت نشده"}

📍 آدرس:
${order.customer_address || order.address || "ثبت نشده"}

💰 مبلغ سفارش:
${Number(order.total || 0).toLocaleString("fa-IR")} تومان

💳 روش پرداخت:
کارت به کارت

🔢 کد پیگیری تراکنش:
${order.payment_tracking_code || "ثبت نشده"}

🕐 ساعت تراکنش:
${order.payment_transaction_time || "ثبت نشده"}

📦 محصولات:

${items || "محصولی ثبت نشده"}

━━━━━━━━━━━━━━
`;

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

  const data = await response.json();

  if (!response.ok || !data.ok) {
    console.error("Telegram API error:", data);
  }

  return data;
}
