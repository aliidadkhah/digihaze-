import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    const update = await request.json();

    const message = update?.message;

    // فقط پیام‌هایی که Reply هستند
    if (!message?.reply_to_message) {
      return Response.json({ ok: true });
    }

    // فقط پیام متنی
    const replyText = message.text?.trim();

    if (!replyText) {
      return Response.json({ ok: true });
    }

    // فقط پیام‌های چت ادمین
    const adminChatId = process.env.TELEGRAM_CHAT_ID;

    if (
      !adminChatId ||
      message.chat?.id?.toString() !== adminChatId.toString()
    ) {
      return Response.json({ ok: true });
    }

    // ID پیام اصلی مشتری در تلگرام
    const originalTelegramMessageId =
      message.reply_to_message.message_id;

    // پیدا کردن پیام مشتری در Supabase
    const { data: originalMessage, error: findError } =
      await supabaseAdmin
        .from("support_messages")
        .select("id, conversation_id")
        .eq("telegram_message_id", originalTelegramMessageId)
        .maybeSingle();

    if (findError) {
      console.error("Find original message error:", findError);

      return Response.json(
        { ok: false, error: "خطا در پیدا کردن گفتگو" },
        { status: 500 }
      );
    }

    // اگر پیام Reply مربوط به سایت نبود
    if (!originalMessage) {
      return Response.json({ ok: true });
    }

    // ذخیره پاسخ پشتیبانی
    const { error: insertError } = await supabaseAdmin
      .from("support_messages")
      .insert({
        conversation_id: originalMessage.conversation_id,
        sender: "support",
        message: replyText,
        telegram_message_id: message.message_id,
      });

    if (insertError) {
      console.error("Insert support reply error:", insertError);

      return Response.json(
        { ok: false, error: "ذخیره پاسخ ناموفق بود" },
        { status: 500 }
      );
    }

    // به‌روزرسانی زمان آخرین فعالیت گفتگو
    await supabaseAdmin
      .from("support_conversations")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", originalMessage.conversation_id);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);

    return Response.json(
      { ok: false, error: "خطای Webhook" },
      { status: 500 }
    );
  }
}
