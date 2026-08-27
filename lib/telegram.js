export async function notifyNewOrder(order) {
  const token =
    process.env.TELEGRAM_BOT_TOKEN;

  const chatId =
    process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log(
      "Telegram environment variables are missing."
    );

    return;
  }

  const items =
    (order.items || [])
      .map(
        (item) =>
          `• ${
            item.product_name ||
            item.product_id
          } × ${item.qty} — ${Number(
            item.price
          ).toLocaleString(
            "fa-IR"
          )} تومان`
      )
      .join("\n");

  const text = `
🛒 سفارش جدید

🔢 شماره سفارش:
${order.id}

👤 مشتری:
${order.customer_name || "ثبت نشده"}

📱 موبایل:
${
  order.customer_phone ||
  order.phone ||
  "ثبت نشده"
}

📍 آدرس:
${
  order.customer_address ||
  order.address ||
  "ثبت نشده"
}

💰 مبلغ:
${Number(
  order.total || 0
).toLocaleString(
  "fa-IR"
)} تومان

📦 محصولات:

${items}

🚚 روش ارسال:
${order.shipping_label || order.shipping_method || "ثبت نشده"}

💳 روش پرداخت:
${order.payment_label || "کارت به کارت"}

🔢 کد پیگیری واریز:
${
  order.payment_tracking_code ||
  order.tracking_code ||
  "ثبت نشده"
}

🕐 ساعت تراکنش:
${
  order.payment_transaction_time ||
  order.transaction_time ||
  "ثبت نشده"
}

📌 وضعیت:
${order.status || "pending"}

برای تایید سفارش وارد پنل مدیریت سایت شو.
`;

  const response =
    await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      }
    );

  if (!response.ok) {
    const result =
      await response.text();

    console.error(
      "Telegram API error:",
      result
    );
  }
}
