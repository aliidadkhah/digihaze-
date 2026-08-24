import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

    // ساخت گفتگو در Supabase
    const { data: conversation, error: conversationError } =
      await supabaseAdmin
        .from("support_conversations")
        .insert({
          customer_name: name || "وارد نشده",
          customer_phone: phone || "وارد نشده",
        })
        .select()
        .single();

    if (conversationError) {
      console.error("Conversation error:", conversationError);

      return Response.json(
        { success: false, error: "ساخت گفتگو ناموفق بود" },
        { status: 500 }
      );
    }

    // ذخیره پیام مشتری
    const { data: customerMessage, error: messageError } =
      await supabaseAdmin
        .from("support_messages")
        .insert({
          conversation_id: conversation.id,
          sender: "customer",
          message: message.trim(),
        })
        .select()
        .single();

    if (messageError) {
      console.error("Message error:", messageError);

      return Response.json(
        { success: false, error: "ذخیره پیام ناموفق بود" },
        { status: 500 }
      );
    }

    const text = `
📩 پیام جدید پشتیبانی سایت

🆔 گفتگو: ${conversation.id}

👤 نام: ${name || "وارد نشده"}
📱 شماره تماس: ${phone || "وارد نشده"}

💬 پیام:
${message.trim()}

↩️ برای پاسخ، روی همین پیام Reply کنید.
`;

    // ارسال پیام به تلگرام
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
        {
          success: false,
          error: "ارسال پیام به تلگرام ناموفق بود",
        },
        { status: 500 }
      );
    }

    // ذخیره شناسه پیام تلگرام
    await supabaseAdmin
      .from("support_messages")
      .update({
        telegram_message_id: telegramData.result.message_id,
      })
      .eq("id", customerMessage.id);

    return Response.json({
      success: true,
      conversationId: conversation.id,
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
