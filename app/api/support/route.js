import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// ارسال پیام مشتری
export async function POST(request) {
  try {
    const { conversationId, name, phone, message } = await request.json();

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

    let conversation;

    // اگر گفتگو از قبل وجود دارد، همان را استفاده می‌کنیم
    if (conversationId) {
      const { data, error } = await supabaseAdmin
        .from("support_conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (error || !data) {
        return Response.json(
          { success: false, error: "گفتگو پیدا نشد" },
          { status: 404 }
        );
      }

      conversation = data;

      // آپدیت زمان آخرین فعالیت
      await supabaseAdmin
        .from("support_conversations")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversation.id);
    } else {
      // اولین پیام مشتری → ساخت گفتگو
      const { data, error } = await supabaseAdmin
        .from("support_conversations")
        .insert({
          customer_name: name || "وارد نشده",
          customer_phone: phone || "وارد نشده",
        })
        .select()
        .single();

      if (error) {
        console.error("Conversation error:", error);

        return Response.json(
          { success: false, error: "ساخت گفتگو ناموفق بود" },
          { status: 500 }
        );
      }

      conversation = data;
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

👤 نام: ${conversation.customer_name}
📱 شماره تماس: ${conversation.customer_phone}

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

    // ذخیره ID پیام تلگرام
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


// دریافت پیام‌های یک گفتگو
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return Response.json(
        {
          success: false,
          error: "شناسه گفتگو ارسال نشده است",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Get messages error:", error);

      return Response.json(
        {
          success: false,
          error: "دریافت پیام‌ها ناموفق بود",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      messages: data || [],
    });
  } catch (error) {
    console.error("Support GET error:", error);

    return Response.json(
      {
        success: false,
        error: "خطای سرور",
      },
      { status: 500 }
    );
  }
}
