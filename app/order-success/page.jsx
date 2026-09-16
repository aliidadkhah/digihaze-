"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/data";
import { Truck, Package, ExternalLink } from "lucide-react";

const SHIPPING_LABELS = {
  post: "پست",
  tipax: "تیپاکس (پس‌کرایه)",
  chapar: "چاپار (پس‌کرایه)",
};

export default function OrderSuccessPage() {
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("invoice");
  const pollRef = useRef(null);

  useEffect(() => {
    // حالت اول: سفارش کارت‌به‌کارت — بلافاصله بعد از ثبت
    // سفارش در همین تب توی sessionStorage ذخیره شده
    try {
      const savedOrder = sessionStorage.getItem("completedOrder");

      if (savedOrder) {
        setOrder(JSON.parse(savedOrder));
        sessionStorage.removeItem("completedOrder");
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("Order success error:", error);
    }

    // حالت دوم: بازگشت از درگاه پرداخت زیبال — سفارش با
    // شناسه‌ای که در callback زیبال به این صفحه اضافه شده واکشی می‌شود
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order");

    if (!orderId) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders?id=${encodeURIComponent(orderId)}`)
      .then((res) => res.json())
      .then((data) => {
        const fetchedOrder = (data.orders || [])[0];
        if (fetchedOrder) {
          setOrder(fetchedOrder);
        }
      })
      .catch((error) => {
        console.error("Order fetch error:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (
      !order ||
      order.payment_method !== "card_to_card" ||
      order.status !== "pending"
    ) {
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/orders?phone=${encodeURIComponent(order.customer_phone)}`
        );

        const data = await res.json();

        const fresh = (data.orders || []).find(
          (o) => String(o.id) === String(order.id)
        );

        if (fresh && fresh.status !== "pending") {
          setOrder(fresh);
          clearInterval(pollRef.current);
        }
      } catch (e) {
        console.error("POLL ERROR:", e);
      }
    }, 8000);

    return () => clearInterval(pollRef.current);
  }, [order]);

  if (loading) {
    return (
      <div
        style={{
          padding: "80px 20px",
          textAlign: "center",
          fontFamily: "Vazirmatn",
        }}
      >
        در حال بارگذاری...
      </div>
    );
  }

  if (!order) {
    return (
      <div
        style={{
          maxWidth: 650,
          margin: "0 auto",
          padding: "80px 20px",
          textAlign: "center",
          fontFamily: "Vazirmatn",
        }}
      >
        <h1 style={{ fontWeight: 900, marginBottom: 15 }}>
          اطلاعات سفارش پیدا نشد
        </h1>

        <button
          onClick={() => router.push("/shop")}
          style={{
            background: "#9B5CFF",
            border: "none",
            borderRadius: 12,
            padding: "12px 28px",
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          بازگشت به فروشگاه
        </button>
      </div>
    );
  }

  const isPendingConfirmation =
    order.payment_method === "card_to_card" &&
    order.status === "pending";

  const isConfirmed = order.status === "paid";

  const isGatewayFailed =
    order.payment_method === "gateway" &&
    order.status === "failed";

  if (isGatewayFailed) {
    return (
      <div
        dir="rtl"
        style={{
          maxWidth: 650,
          margin: "0 auto",
          padding: "80px 20px",
          textAlign: "center",
          fontFamily: "Vazirmatn",
        }}
      >
        <h1 style={{ fontWeight: 900, marginBottom: 15 }}>
          پرداخت ناموفق بود
        </h1>

        <p
          style={{
            color: "var(--text-mut)",
            fontSize: 14,
            marginBottom: 25,
          }}
        >
          تراکنش شما در درگاه پرداخت تکمیل نشد یا لغو شد.
          مبلغی از حساب شما کسر نشده است. می‌توانید دوباره
          تلاش کنید.
        </p>

        <button
          onClick={() => router.push("/checkout")}
          style={{
            background: "#9B5CFF",
            border: "none",
            borderRadius: 12,
            padding: "12px 28px",
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          بازگشت به تسویه‌حساب
        </button>
      </div>
    );
  }

  const trackingLinks = [
    {
      key: "post",
      label: "رهگیری پست",
      url: order.tracking_url_post,
    },
    {
      key: "tipax",
      label: "رهگیری تیپاکس",
      url: order.tracking_url_tipax,
    },
    {
      key: "chapar",
      label: "رهگیری چاپار",
      url: order.tracking_url_chapar,
    },
  ];

  return (
    <main
      dir="rtl"
      aria-labelledby="order-success-title"
      style={{
        maxWidth: 700,
        margin: "0 auto",
        padding: "50px 20px 100px",
        fontFamily: "Vazirmatn",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 22,
          padding: 30,
        }}
      >
        {/* SUCCESS */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 26,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 72,
              height: 72,
              margin: "0 auto 18px",
              borderRadius: "50%",
              background: "#9B5CFF20",
              color: "#9B5CFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              fontWeight: 900,
            }}
          >
            ✓
          </div>

          <h1
            id="order-success-title"
            style={{
              fontSize: 25,
              fontWeight: 900,
              color: "var(--text-hi)",
              marginBottom: 10,
            }}
          >
            {isConfirmed
              ? "خرید شما ثبت شد"
              : "سفارش شما با موفقیت ثبت شد"}
          </h1>

          <p
            style={{
              color: "var(--text-mut)",
              fontSize: 14,
              margin: 0,
            }}
          >
            {isPendingConfirmation
              ? "پس از تایید واریزی توسط ادمین، فاکتور نهایی برای شما صادر می‌شود."
              : "اطلاعات سفارش شما با موفقیت دریافت شد."}
          </p>
        </div>

        {/* TABS */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => setTab("invoice")}
            style={{
              ...tabBtnStyle,
              ...(tab === "invoice" ? tabBtnActive : {}),
            }}
          >
            <Package
              size={14}
              style={{
                verticalAlign: "-2px",
                marginLeft: 5,
              }}
            />
            فاکتور سفارش
          </button>

          <button
            onClick={() => setTab("tracking")}
            style={{
              ...tabBtnStyle,
              ...(tab === "tracking" ? tabBtnActive : {}),
            }}
          >
            <Truck
              size={14}
              style={{
                verticalAlign: "-2px",
                marginLeft: 5,
              }}
            />
            پیگیری سفارش
          </button>
        </div>

        {/* INVOICE */}
        {tab === "invoice" && (
          <>
            <div style={boxStyle}>
              <div style={rowStyle}>
                <span>شماره سفارش</span>

                <strong>
                  #{String(order.id).slice(0, 8)}
                </strong>
              </div>
            </div>

            <div style={boxStyle}>
              <h2 style={titleStyle}>اطلاعات گیرنده</h2>

              <div style={rowStyle}>
                <span>نام و نام خانوادگی</span>
                <strong>{order.customer_name}</strong>
              </div>

              <div style={rowStyle}>
                <span>شماره موبایل</span>
                <strong dir="ltr">
                  {order.customer_phone}
                </strong>
              </div>

              <div style={rowStyle}>
                <span>استان و شهر</span>
                <strong>
                  {order.customer_province} -{" "}
                  {order.customer_city}
                </strong>
              </div>

              <div style={rowStyle}>
                <span>کد پستی</span>
                <strong dir="ltr">
                  {order.customer_postal_code}
                </strong>
              </div>

              <div
                style={{
                  paddingTop: 12,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    color: "var(--text-mut)",
                    marginBottom: 6,
                  }}
                >
                  آدرس
                </div>

                <strong
                  style={{
                    lineHeight: 1.8,
                  }}
                >
                  {order.customer_address}
                </strong>
              </div>
            </div>

            <div style={boxStyle}>
              <h2 style={titleStyle}>
                اطلاعات ارسال و پرداخت
              </h2>

              <div style={rowStyle}>
                <span>روش ارسال</span>

                <strong>
                  {SHIPPING_LABELS[order.shipping_method] ||
                    order.shipping_method}
                </strong>
              </div>

              <div style={rowStyle}>
                <span>هزینه ارسال</span>

                <strong>
                  {order.shipping_cost > 0
                    ? money(Number(order.shipping_cost))
                    : "پس‌کرایه"}
                </strong>
              </div>

              <div style={rowStyle}>
                <span>مبلغ سفارش</span>

                <strong>
                  {money(Number(order.total))}
                </strong>
              </div>

              <div style={rowStyle}>
                <span>روش پرداخت</span>

                <strong>
                  {order.payment_method === "gateway"
                    ? "درگاه شاپرک"
                    : "کارت به کارت"}
                </strong>
              </div>

              {order.payment_method === "card_to_card" && (
                <div style={rowStyle}>
                  <span>کد پیگیری واریز</span>

                  <strong>
                    {order.payment_tracking_code ||
                      "ثبت نشده"}
                  </strong>
                </div>
              )}
            </div>

            <div
              style={{
                background: isPendingConfirmation
                  ? "#FF7A1F15"
                  : "#9B5CFF15",
                border: `1px solid ${
                  isPendingConfirmation
                    ? "#FF7A1F40"
                    : "#9B5CFF40"
                }`,
                borderRadius: 14,
                padding: 15,
                textAlign: "center",
                color: isPendingConfirmation
                  ? "#FF7A1F"
                  : "#9B5CFF",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              {isPendingConfirmation
                ? "سفارش شما در انتظار بررسی و تایید واریزی است."
                : "پرداخت شما تایید شد و سفارش برای پردازش ارسال شد."}
            </div>
          </>
        )}

        {/* TRACKING */}
        {tab === "tracking" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {trackingLinks.map((t) => (
              <div key={t.key} style={boxStyle}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 8,
                    color: "var(--text-hi)",
                  }}
                >
                  {t.label}
                </div>

                {t.url ? (
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#9B5CFF",
                      fontSize: 13,
                      textDecoration: "none",
                      wordBreak: "break-all",
                    }}
                  >
                    <ExternalLink size={14} />
                    {t.url}
                  </a>
                ) : (
                  <span
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-mut)",
                    }}
                  >
                    هنوز ثبت نشده
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => router.push("/shop")}
          style={{
            width: "100%",
            background: "#9B5CFF",
            color: "#061014",
            border: "none",
            borderRadius: 12,
            padding: "14px",
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          بازگشت به فروشگاه
        </button>
      </div>
    </main>
  );
}

const boxStyle = {
  background: "var(--bg)",
  borderRadius: 14,
  padding: 18,
  marginBottom: 15,
};

const titleStyle = {
  marginTop: 0,
  marginBottom: 15,
  fontSize: 16,
  fontWeight: 800,
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 15,
  padding: "10px 0",
  fontSize: 13,
  borderBottom: "1px solid var(--surface2)",
};

const tabBtnStyle = {
  flex: 1,
  background: "var(--bg)",
  border: "1px solid var(--surface2)",
  borderRadius: 12,
  padding: "10px 0",
  fontFamily: "Vazirmatn",
  fontWeight: 700,
  fontSize: 12.5,
  color: "var(--text-mut)",
  cursor: "pointer",
};

const tabBtnActive = {
  background: "#9B5CFF15",
  borderColor: "#9B5CFF55",
  color: "#9B5CFF",
};
