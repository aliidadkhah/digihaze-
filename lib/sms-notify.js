// پیامک اطلاع‌رسانی داخلی (سفارش جدید / پیام پشتیبانی) به شماره ادمین
// از همون قالب تایید‌شده‌ی OTP استفاده می‌کنه تا نیاز به خط تبلیغاتی/مدرک نباشه.
export async function notifyAdminSms(label) {
  const apiKey = process.env.SMS_IR_API_KEY;
  const templateId = process.env.SMS_IR_TEMPLATE_ID;
  const adminPhone = process.env.ADMIN_NOTIFY_PHONE;

  if (!apiKey || !templateId || !adminPhone) {
    console.log("SMS notify environment variables are missing.");
    return;
  }

  try {
    const response = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        mobile: adminPhone,
        templateId: Number(templateId),
        parameters: [{ name: "CONTANCS", value: label }],
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
