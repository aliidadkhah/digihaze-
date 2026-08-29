"use client";

import { Mail, Phone } from "lucide-react";
import { Badge, Reveal } from "./ui";

const SECTIONS = [
  {
    title: "مقررات عمومی",
    paragraphs: [
      "فعالیت سایت دیجی‌هیز در چارچوب قوانین و مقررات جاری جمهوری اسلامی ایران، از جمله قانون تجارت الکترونیکی و مقررات مربوط به حمایت از حقوق مصرف‌کنندگان انجام می‌شود.",
      "چنانچه در آینده تغییری در قوانین، نحوه ارائه خدمات یا رویه‌های سایت ایجاد شود، نسخه جدید مقررات در همین صفحه قرار خواهد گرفت و ادامه استفاده از سایت پس از به‌روزرسانی، به منزله پذیرش تغییرات خواهد بود.",
    ],
  },
  {
    title: "حریم خصوصی و امنیت اطلاعات کاربران",
    paragraphs: [
      "حفظ حریم خصوصی کاربران برای ما اهمیت ویژه‌ای دارد و اطلاعاتی که هنگام استفاده از سایت در اختیار ما قرار می‌دهید، با رعایت اصول امنیتی نگهداری خواهد شد.",
      "اطلاعاتی مانند شماره تلفن، ایمیل و نشانی، صرفاً در مواردی مانند ثبت و پیگیری سفارش، ارائه خدمات، پشتیبانی و ارسال اطلاع‌رسانی‌های مرتبط مورد استفاده قرار می‌گیرد و اطلاعات کاربران بدون مجوز قانونی یا رضایت مربوطه در اختیار اشخاص یا مجموعه‌های غیرمرتبط قرار نخواهد گرفت.",
    ],
  },
  {
    title: "ایجاد حساب کاربری و ثبت اطلاعات",
    list: [
      "هر کاربر مسئول نگهداری و محافظت از اطلاعات ورود و حساب کاربری خود است.",
      "اطلاعاتی که هنگام ثبت‌نام یا ثبت سفارش وارد می‌کنید باید صحیح، کامل و متعلق به خودتان باشد.",
      "در صورت وارد کردن اطلاعات نادرست یا ناقص، مسئولیت مشکلات احتمالی در روند سفارش، ارائه خدمات یا پشتیبانی بر عهده کاربر خواهد بود.",
      "کاربران موظف‌اند در صورت تغییر اطلاعات تماس خود، اطلاعات حسابشان را در اولین فرصت به‌روزرسانی کنند.",
    ],
  },
  {
    title: "حقوق مالکیت محتوا",
    paragraphs: [
      "کلیه مطالب، تصاویر، ویدئوها، طراحی‌های گرافیکی، لوگو، عناصر بصری و سایر محتوای منتشرشده در وب‌سایت digihaze.ir متعلق به این مجموعه است، مگر آنکه خلاف آن به‌صورت مشخص اعلام شده باشد.",
      "هرگونه کپی، بازنشر، استخراج، تغییر، انتشار یا استفاده تجاری از محتوای سایت بدون دریافت اجازه کتبی از مالک آن، مجاز نبوده و می‌تواند مطابق قوانین مربوطه مورد پیگیری قرار گیرد.",
    ],
  },
];

export default function TermsContent() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "60px 20px 80px" }}>
      <Reveal>
        <Badge bg="#2F86FF">قوانین سایت</Badge>

        <h1
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 30,
            margin: "18px 0 20px",
          }}
        >
          قوانین و شرایط استفاده از سایت دیجی‌هیز
        </h1>

        <p
          style={{
            color: "var(--text-lo)",
            fontSize: 15,
            lineHeight: 2.1,
            marginBottom: 40,
          }}
        >
          کاربر محترم، از اینکه سایت دیجی‌هیز را برای استفاده از خدمات و محصولات انتخاب کرده‌اید، سپاسگزاریم. ورود و
          استفاده از این وب‌سایت، ایجاد حساب کاربری و همچنین ثبت سفارش یا خرید، به منزله مطالعه، آگاهی و پذیرش شرایط و
          مقررات درج‌شده در این صفحه است. توصیه می‌شود پیش از استفاده از خدمات سایت، قوانین زیر را با دقت مطالعه کنید.
        </p>
      </Reveal>

      {SECTIONS.map((section, i) => (
        <Reveal key={section.title} delay={0.06 * (i + 1)}>
          <section style={{ marginBottom: 34 }}>
            <h2
              style={{
                fontFamily: "Vazirmatn",
                fontWeight: 800,
                fontSize: 19,
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22E5C9",
                  flexShrink: 0,
                }}
              />
              {section.title}
            </h2>

            {section.paragraphs?.map((p, idx) => (
              <p
                key={idx}
                style={{
                  color: "var(--text-lo)",
                  fontSize: 14.5,
                  lineHeight: 2.1,
                  marginBottom: 12,
                }}
              >
                {p}
              </p>
            ))}

            {section.list && (
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {section.list.map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      color: "var(--text-lo)",
                      fontSize: 14.5,
                      lineHeight: 2.1,
                    }}
                  >
                    <span
                      style={{
                        marginTop: 9,
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "var(--text-faint)",
                        flexShrink: 0,
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Reveal>
      ))}

      <Reveal delay={0.3}>
        <section
          style={{
            background: "var(--surface)",
            borderRadius: 16,
            padding: "26px 24px",
          }}
        >
          <h2
            style={{
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              fontSize: 19,
              marginBottom: 12,
            }}
          >
            پشتیبانی و راه‌های ارتباطی
          </h2>

          <p
            style={{
              color: "var(--text-lo)",
              fontSize: 14.5,
              lineHeight: 2.1,
              marginBottom: 18,
            }}
          >
            برای دریافت پشتیبانی، طرح سوال، ارسال پیشنهاد یا ثبت درخواست و شکایت، لطفاً تنها از اطلاعات تماس و
            راه‌های ارتباطی معرفی‌شده در بخش «تماس با ما» استفاده کنید.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            
              href="mailto:info@digihaze.ir"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--surface2)",
                borderRadius: 12,
                padding: "12px 16px",
                textDecoration: "none",
                color: "var(--text-hi)",
                fontSize: 13.5,
                fontWeight: 700,
              }}
            >
              <Mail size={16} color="#22E5C9" />
              info@digihaze.ir
            </a>

            
              href="tel:09020951384"
              dir="ltr"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--surface2)",
                borderRadius: 12,
                padding: "12px 16px",
                textDecoration: "none",
                color: "var(--text-hi)",
                fontSize: 13.5,
                fontWeight: 700,
              }}
            >
              <Phone size={16} color="#22E5C9" />
              09020951384
            </a>
          </div>

          <p
            style={{
              color: "var(--text-faint)",
              fontSize: 12.5,
              lineHeight: 2,
              marginTop: 18,
            }}
          >
            اطلاعات و راه‌های ارتباطی رسمی سایت ممکن است در طول زمان تغییر کند؛ بنابراین برای اطمینان، آخرین
            اطلاعات درج‌شده در وب‌سایت را ملاک قرار دهید.
          </p>
        </section>
      </Reveal>
    </div>
  );
}
