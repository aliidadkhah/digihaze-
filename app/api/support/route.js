import { env } from "cloudflare:workers";

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

    if (!env.DB) {
      return Response.json(
        { success: false, error: "اتصال دیتابیس برقرار نیست" },
        { status: 500 }
      );
    }

    // ساخت شناسه اختصاصی برای این گفتگو
    const conversationId =
      "DH-" + crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

    const now = Date.now();

    // ثبت گفتگو در D1
    await env.DB.prepare(
      `INSERT INTO conversations
       (id, customer_name, customer_phone, created_at)
       VALUES (?, ?, ?, ?)`
    )
      .bind(
        conversationId,
        name || "وارد نشده",
        phone || "وارد نشده",
        now
      )
      .run();

    // ثبت پیام مشتری
    const messageResult = await env.DB.prepare(
      `INSERT INTO messages
       (conversation_id, sender, text, created_at)
       VALUES (?, ?, ?, ?)`
    )
      .bind(conversationId, "customer", message.trim(), now)
      .run();

    const text = `
📩 پیام جدید پشتیبانی سایت

🆔 گفتگو: ${conversationId}

👤 نام: ${name || "وارد نشده"}
📱 شماره تماس: ${phone || "وارد نشده"}

💬 پیام:
${message.trim()}

↩️ برای پاسخ، روی همین پیام Reply کنید.
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

      // اگر ارسال تلگرام شکست خورد، اطلاعات ناقص را پاک می‌کنیم
      await env.DB.prepare(
        `DELETE FROM messages WHERE id = ?`
      )
        .bind(messageResult.meta.last_row_id)
        .run();

      await env.DB.prepare(
        `DELETE FROM conversations WHERE id = ?`
      )
        .bind(conversationId)
        .run();

      return Response.json(
        {
          success: false,
          error: "ارسال پیام به تلگرام ناموفق بود",
        },
        { status: 500 }
      );
    }

    // ذخیره ID پیام تلگرام
    await env.DB.prepare(
      `UPDATE messages
       SET telegram_message_id = ?
       WHERE id = ?`
    )
      .bind(
        telegramData.result.message_id,
        messageResult.meta.last_row_id
      )
      .run();

    return Response.json({
      success: true,
      conversationId,
      messageId: messageResult.meta.last_row_id,
    });
  } catch (error) {
    console.error("Support API error:", error);

    return Response.json(
      {
        success: false,
        error: "خطای سرور",
      },
      { status: 500 }
    );
  }
}
