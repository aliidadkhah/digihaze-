import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyNewOrder } from "@/lib/telegram";
import {
  PRODUCTS,
  discountedPrice,
} from "@/lib/data";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const phone = searchParams
      .get("phone")
      ?.trim();

    if (!phone) {
      return NextResponse.json(
        {
          error:
            "شماره موبایل ارسال نشده است",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: orders,
      error,
    } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("customer_phone", phone)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "ORDERS FETCH ERROR:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      orders: orders || [],
    });
  } catch (error) {
    console.error(
      "API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "خطای سرور",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      customer,
      payment,
      items,
    } = body;

    // =========================
    // بررسی مشتری
    // =========================

    if (
      !customer?.name ||
      !customer?.phone ||
      !customer?.address
    ) {
      return NextResponse.json(
        {
          error:
            "اطلاعات مشتری کامل نیست",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // بررسی سبد
    // =========================

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "سبد خرید خالی است",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // بررسی کد پیگیری
    // =========================

    if (
      !payment?.trackingCode?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "کد پیگیری تراکنش وارد نشده است",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // محاسبه مبلغ
    // =========================

    let total = 0;

    const orderItems = [];

    for (const item of items) {
      const product =
        PRODUCTS.find(
          (p) =>
            p.id === item.productId
        );

      if (!product) {
        return NextResponse.json(
          {
            error:
              "محصول پیدا نشد",
          },
          {
            status: 400,
          }
        );
      }

      const qty = Number(
        item.qty
      );

      if (
        !Number.isInteger(qty) ||
        qty <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "تعداد محصول نامعتبر است",
          },
          {
            status: 400,
          }
        );
      }

      const price =
        discountedPrice(product);

      total +=
        price * qty;

      orderItems.push({
        product_id:
          product.id,

        product_name:
          product.name,

        qty,

        price,
      });
    }

    // =========================
    // ثبت سفارش
    // =========================

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name:
          customer.name.trim(),

        customer_phone:
          customer.phone.trim(),

        customer_address:
          customer.address.trim(),

        address:
          customer.address.trim(),

        total,

        status:
          "pending",

        payment_tracking_code:
          payment.trackingCode.trim(),

        payment_transaction_time:
          payment?.transactionTime?.trim() ||
          "",

        payment_method:
          "card_to_card",
      })
      .select()
      .single();

    if (orderError) {
      console.error(
        "ORDER ERROR:",
        orderError
      );

      return NextResponse.json(
        {
          error:
            orderError.message,
        },
        {
          status: 500,
        }
      );
    }

    // =========================
    // ثبت محصولات سفارش
    // =========================

    const rows =
      orderItems.map(
        (item) => ({
          order_id:
            order.id,

          product_id:
            item.product_id,

          qty: item.qty,

          price: item.price,
        })
      );

    const {
      error: itemsError,
    } = await supabaseAdmin
      .from("order_items")
      .insert(rows);

    if (itemsError) {
      console.error(
        "ITEM ERROR:",
        itemsError
      );

      return NextResponse.json(
        {
          error:
            itemsError.message,
        },
        {
          status: 500,
        }
      );
    }

    // =========================
    // ارسال تلگرام
    // =========================

    try {
      await notifyNewOrder({
        ...order,

        // برای تلگرام
        phone:
          order.customer_phone,

        address:
          order.customer_address,

        tracking_code:
          order.payment_tracking_code,

        transaction_time:
          order.payment_transaction_time,

        items: orderItems,
      });
    } catch (telegramError) {
      console.error(
        "Telegram error:",
        telegramError
      );
    }

    // =========================
    // پاسخ
    // =========================

    return NextResponse.json({
      success: true,

      order,
    });
  } catch (error) {
    console.error(
      "API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "خطای سرور",
      },
      {
        status: 500,
      }
    );
  }
}
