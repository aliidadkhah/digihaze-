```javascript
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyNewOrder } from "@/lib/telegram";
import { PRODUCTS, discountedPrice } from "@/lib/data";

function getUserClient(token) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

export async function POST(req) {
  try {
    /*
     * ============================
     * 1. دریافت اطلاعات درخواست
     * ============================
     */

    const body = await req.json();

    const {
      items,
      customer,
      payment,
    } = body;

    /*
     * ============================
     * 2. بررسی سبد خرید
     * ============================
     */

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error: "سبد خرید خالی است",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ============================
     * 3. بررسی اطلاعات مشتری
     * ============================
     */

    if (!customer?.name?.trim()) {
      return NextResponse.json(
        {
          error: "نام مشتری وارد نشده است",
        },
        {
          status: 400,
        }
      );
    }

    if (!customer?.phone?.trim()) {
      return NextResponse.json(
        {
          error: "شماره موبایل وارد نشده است",
        },
        {
          status: 400,
        }
      );
    }

    if (!customer?.address?.trim()) {
      return NextResponse.json(
        {
          error: "آدرس وارد نشده است",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ============================
     * 4. بررسی اطلاعات پرداخت
     * ============================
     */

    if (!payment?.trackingCode?.trim()) {
      return NextResponse.json(
        {
          error: "کد پیگیری تراکنش وارد نشده است",
        },
        {
          status: 400,
        }
      );
    }

    if (!payment?.transactionTime?.trim()) {
      return NextResponse.json(
        {
          error: "ساعت تراکنش وارد نشده است",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ============================
     * 5. دریافت کاربر در صورت ورود
     * ============================
     *
     * این قسمت اختیاری است.
     * مشتری برای ثبت سفارش مجبور نیست
     * حتماً وارد حساب کاربری شده باشد.
     */

    const authHeader = req.headers.get("authorization") || "";

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    let userId = null;

    if (token) {
      try {
        const userClient = getUserClient(token);

        const {
          data: userData,
          error: userErr,
        } = await userClient.auth.getUser();

        if (!userErr && userData?.user) {
          userId = userData.user.id;
        }
      } catch (error) {
        console.error("خطا در بررسی کاربر:", error);
      }
    }

    /*
     * ============================
     * 6. محاسبه قیمت سمت سرور
     * ============================
     */

    let total = 0;

    const orderItems = [];

    for (const item of items) {
      const product = PRODUCTS.find(
        (p) => p.id === item.productId
      );

      if (!product) {
        return NextResponse.json(
          {
            error: "محصول نامعتبر در سبد خرید",
          },
          {
            status: 400,
          }
        );
      }

      const qty = Number(item.qty);

      if (!Number.isInteger(qty) || qty <= 0) {
        return NextResponse.json(
          {
            error: "تعداد محصول نامعتبر است",
          },
          {
            status: 400,
          }
        );
      }

      const unitPrice = discountedPrice(product);

      total += unitPrice * qty;

      orderItems.push({
        product_id: product.id,
        qty,
        price: unitPrice,
      });
    }

    /*
     * ============================
     * 7. ساخت سفارش
     * ============================
     */

    const orderData = {
      user_id: userId,
      total,
      status: "pending",

      customer_name: customer.name.trim(),
      customer_phone: customer.phone.trim(),
      customer_address: customer.address.trim(),

      payment_tracking_code:
        payment.trackingCode.trim(),

      payment_transaction_time:
        payment.transactionTime.trim(),

      payment_method: "card_to_card",
    };

    const {
      data: order,
      error: orderErr,
    } = await supabaseAdmin
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderErr) {
      console.error(
        "خطای ایجاد سفارش:",
        orderErr
      );

      return NextResponse.json(
        {
          error:
            "ثبت سفارش در پایگاه داده انجام نشد: " +
            orderErr.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ============================
     * 8. ذخیره محصولات سفارش
     * ============================
     */

    const rows = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const {
      error: itemsErr,
    } = await supabaseAdmin
      .from("order_items")
      .insert(rows);

    if (itemsErr) {
      console.error(
        "خطای ثبت اقلام سفارش:",
        itemsErr
      );

      return NextResponse.json(
        {
          error:
            "ثبت محصولات سفارش انجام نشد: " +
            itemsErr.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ============================
     * 9. ارسال سفارش به تلگرام
     * ============================
     */

    await notifyNewOrder({
      ...order,
      items: orderItems,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
      },
      payment: {
        trackingCode:
          payment.trackingCode.trim(),

        transactionTime:
          payment.transactionTime.trim(),

        method: "کارت به کارت",
      },
    });

    /*
     * ============================
     * 10. پاسخ موفق
     * ============================
     */

    return NextResponse.json(
      {
        success: true,

        order: {
          ...order,
          items: orderItems,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "خطای کلی API سفارش:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "خطایی هنگام ثبت سفارش رخ داد",
      },
      {
        status: 500,
      }
    );
  }
}
```
