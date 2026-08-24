import { env } from "cloudflare:workers";

export async function POST(request) {
  try {
    const update = await request.json();

    const message = update?.message;

    // فقط پیام‌هایی را بررسی می‌کنیم که Reply باشند
    if (!message?.reply_to_message) {
      return Response.json({ ok: true });
    }

    const reply = message.reply_to_message;
    const replyText = message.text;

    if (!replyText || !replyText.trim()) {
      return Response.json({ ok: true });
    }

    // فقط پاسخ‌های خودت را قبول کن
    if (message.from?.id?.toString() !== "754456465") {
      return Response.json({ ok: true });
    }

    // پیام اصلی که مشتری فرستاده
    const originalTelegramMessageId = reply.message_id;

    // پیدا کردن پیام مشتری در D1
    const original = await env.DB.prepare(
      `SELECT id, conversation_id
       FROM messages
       WHERE telegram_message_id = ?
       LIMIT 1`
    )
      .bind(originalTelegramMessageId)
      .first();

    if (!original) {
      console.error(
        "Original customer message not found:",
        originalTelegramMessageId
      );

      return Response.json({ ok: true });
    }

    // ذخیره پاسخ پشتیبانی
    await env.DB.prepare(
      `INSERT INTO messages
       (conversation_id, sender, text, created_at, telegram_message_id)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        original.conversation_id,
        "support",
        replyText.trim(),
        Date.now(),
        message.message_id
      )
      .run();

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);

    return Response.json(
      { ok: false, error: "Webhook error" },
      { status: 500 }
    );
  }
}
