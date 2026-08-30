"use client";

import { Mail, Phone } from "lucide-react";
import { Badge, Reveal } from "./ui";

const SECTIONS = [
  {
    title: "۱. مغایرت کالا با سفارش",
    paragraphs: [
      "چنانچه کالای دریافت‌شده با محصولی که در سایت سفارش داده‌اید مغایرت داشته باشد، می‌توانید درخواست مرجوعی ثبت کنید. در این شرایط، کالا نباید استفاده یا باز شده باشد و باید در وضعیت اولیه خود قرار داشته باشد.",
    ],
  },
  {
    title: "۲. وجود ایراد یا آسیب‌دیدگی",
    paragraphs: [
      "در صورتی که محصول هنگام تحویل دارای آسیب‌دیدگی، شکستگی، نشتی یا ایراد ظاهری باشد، لازم است موضوع را در سریع‌ترین زمان ممکن به پشتیبانی دیجی‌هیز اطلاع دهید و در صورت درخواست، تصاویر و ویدئوی مربوط به وضعیت کالا را ارسال کنید.",
    ],
  },
  {
    title: "۳. شرایط پذیرش مرجوعی",
    paragraphs: ["برای پذیرش کالا، رعایت موارد زیر الزامی است:"],
    list: [
      "کالا باید در وضعیت اولیه و قابل فروش باشد.",
      "بسته‌بندی اصلی محصول، در صورت وجود، حفظ شده باشد.",
      "کالا استفاده، تست یا دستکاری نشده باشد؛ مگر در مواردی که ایراد محصول پس از باز کردن بسته‌بندی مشخص شود.",
      "تمامی متعلقات، لوازم جانبی و اقلام همراه کالا باید بازگردانده شوند.",
      "درخواست مرجوعی باید حداکثر تا ۲۴ ساعت پس از دریافت سفارش به پشتیبانی اطلاع داده شود.",
    ],
  },
  {
    title: "۴. کالاهای غیرقابل مرجوعی",
    paragraphs: [
      "به دلیل ماهیت برخی محصولات، کالاهایی که پس از تحویل باز شده، استفاده شده یا بسته‌بندی آن‌ها مخدوش شده باشد، ممکن است امکان مرجوعی نداشته باشند؛ مگر اینکه کالا دارای ایراد یا مغایرت با سفارش باشد.",
    ],
  },
  {
    title: "۵. هزینه بازگشت کالا",
    paragraphs: [
      "در صورتی که مرجوعی به دلیل اشتباه دیجی‌هیز، مغایرت کالا یا وجود ایراد تأییدشده باشد، هزینه بازگشت کالا بر عهده دیجی‌هیز خواهد بود.",
      "در صورتی که مرجوعی به دلایلی غیر از موارد فوق و مطابق شرایط اعلام‌شده در سایت انجام شود، هزینه ارسال و بازگشت کالا بر عهده مشتری خواهد بود.",
    ],
  },
  {
    title: "۶. بررسی و تأیید مرجوعی",
    paragraphs: [
      "پس از دریافت کالا، محصول توسط تیم دیجی‌هیز بررسی می‌شود. در صورت تأیید شرایط مرجوعی، فرآیند تعویض کالا یا بازپرداخت وجه انجام خواهد شد.",
      "مدت زمان بازپرداخت وجه، پس از تأیید نهایی مرجوعی، با توجه به روش پرداخت و فرآیند بانکی انجام می‌شود.",
    ],
  },
  {
    title: "۷. نحوه ثبت درخواست مرجوعی",
    paragraphs: [
      "برای ثبت درخواست مرجوعی، کافی است از طریق بخش پشتیبانی سایت با ما در ارتباط باشید و اطلاعات سفارش، دلیل مرجوعی و در صورت نیاز تصاویر مربوط به کالا را ارسال کنید.",
      "توجه: ثبت درخواست مرجوعی به منزله تأیید قطعی آن نیست و پذیرش نهایی کالا پس از بررسی شرایط محصول انجام خواهد شد.",
    ],
  },
];

export default function ReturnPolicyContent() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "60px 20px 80px" }}>
      <Reveal>
        <Badge bg="#FF8A3D">مرجوعی و بازگشت کالا</Badge>

        <h1
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 30,
            margin: "18px 0 20px",
          }}
        >
          شرایط مرجوعی کالا در دیجی‌هیز
        </h1>

        <p
          style={{
            color: "var(--text-lo)",
            fontSize: 15,
            lineHeight: 2.1,
            marginBottom: 40,
          }}
        >
          در دیجی‌هیز تلاش می‌کنیم محصولات با کیفیت و مطابق با مشخصات درج‌شده در سایت به دست شما برسد. با این حال، در
          صورت وجود مغایرت یا ایراد در محصول، امکان درخواست مرجوعی طبق شرایط زیر وجود دارد.
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
                  background: "#FF8A3D",
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
            ثبت درخواست مرجوعی
          </h2>

          <p
            style={{
              color: "var(--text-lo)",
              fontSize: 14.5,
              lineHeight: 2.1,
              marginBottom: 18,
            }}
          >
            دیجی‌هیز همواره تلاش می‌کند فرآیند خرید و خدمات پس از فروش را با شفافیت و احترام به حقوق مشتریان انجام
            دهد. برای ثبت درخواست مرجوعی، از طریق راه‌های زیر با پشتیبانی در ارتباط باشید.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <a
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

            <a
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
        </section>
      </Reveal>
    </div>
  );
}
