// پیامک اطلاع‌رسانی داخلی (سفارش جدید / پیام پشتیبانی) به شماره ادمین
// جدا از sms.ir OTP که برای ورود مشتری‌هاست.
export async function notifyAdminSms(text) {
  const apiKey = process.env.SMS_IR_API_KEY;
  const lineNumber = process.env.SMS_IR_NOTIFY_LINE;
  const adminPhone = process.env.ADMIN_NOTIFY_PHONE;

  if (!apiKey || !lineNumber || !adminPhone) {
    console.log("SMS notify environment variables are missing.");
    return;
  }

  try {
    const response = await fetch("https://api.sms.ir/v1/send/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        lineNumber: Number(lineNumber),
        messageText: text,
        mobiles: [adminPhone],
        sendDateTime: null,
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.status !== 1) {
      console.error("SMS notify error:", response.status, data);
    }
  } catch (e) {
    console.error("SMS notify send error:", e);
  }
}
