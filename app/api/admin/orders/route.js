export async function POST(request) {
  try {
    const { name, phone, message } = await request.json();

    if (!message || !message.trim()) {
      return Response.json(
        { success: false, error: "پیام خالی است" },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return Response.json(
        { success: false, error: "تنظیمات تلگرام انجام نشده است" },
        { status: 500 }
      );
    }

    const text = `
📩 پیام جدید پشتیبانی سایت

👤 نام: ${name || "وارد نشده"}
📱 شماره تماس: ${phone || "وارد نشده"}

💬 پیام:
${message.trim()}
`;

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
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

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      console.error("Telegram error:", telegramData);

      return Response.json(
        { success: false, error: "ارسال پیام به تلگرام ناموفق بود" },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Support API error:", error);

    return Response.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}
