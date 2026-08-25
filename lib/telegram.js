// lib/telegram.js

export async function notifyNewOrder(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("Telegram env missing");
    return;
  }


  const itemsText = (order.items || [])
    .map((item) => {
      return `- ${item.product_id} x ${item.qty} - ${Number(
        item.price
      ).toLocaleString("fa-IR")} تومان`;
    })
    .join("\n");


  const text =
    `🛒 سفارش جدید DigiHaze\n\n` +
    `شماره سفارش: ${order.id}\n` +
    `مبلغ کل: ${Number(order.total).toLocaleString("fa-IR")} تومان\n\n` +
    `مشخصات مشتری:\n` +
    `نام: ${order.customer?.name || "-"}\n` +
    `تلفن: ${order.customer?.phone || "-"}\n` +
    `آدرس: ${order.customer?.address || "-"}\n\n` +
    `محصولات:\n${itemsText}`;


  try {

    await fetch(
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


  } catch (error) {

    console.error(
      "Telegram error:",
      error.message
    );

  }
}
