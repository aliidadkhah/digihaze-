import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyNewOrder } from "@/lib/telegram";
import { PRODUCTS, discountedPrice } from "@/lib/data";


export async function POST(req) {

  try {

    const body = await req.json();


    const {
      customer,
      payment,
      items,
    } = body;



    // بررسی اطلاعات مشتری
    if (
      !customer?.name ||
      !customer?.phone ||
      !customer?.address
    ) {

      return NextResponse.json(
        {
          error: "اطلاعات مشتری کامل نیست"
        },
        {
          status:400
        }
      );

    }



    // بررسی سبد خرید
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {

      return NextResponse.json(
        {
          error:"سبد خرید خالی است"
        },
        {
          status:400
        }
      );

    }




    let total = 0;

    const orderItems = [];



    for (const item of items) {


      const product = PRODUCTS.find(
        p => p.id === item.productId
      );


      if(!product){

        return NextResponse.json(
          {
            error:"محصول پیدا نشد"
          },
          {
            status:400
          }
        );

      }



      const qty = Number(item.qty);



      if(!qty || qty <= 0){

        return NextResponse.json(
          {
            error:"تعداد محصول نامعتبر است"
          },
          {
            status:400
          }
        );

      }



      const price = discountedPrice(product);



      total += price * qty;



      orderItems.push({

        product_id: product.id,

        qty,

        price

      });


    }





    // ثبت سفارش
    const {
      data:order,
      error:orderError

    } = await supabaseAdmin

      .from("orders")

      .insert({

        customer_name: customer.name,

        customer_phone: customer.phone,

        customer_address: customer.address,

        address: customer.address,

        total,

        status:"pending",

        payment_tracking_code:
          payment?.trackingCode || "",

        payment_transaction_time:
          payment?.transactionTime || "",

        payment_method:
          "card_to_card"

      })

      .select()

      .single();





    if(orderError){


      console.error(
        "ORDER ERROR:",
        orderError
      );


      return NextResponse.json(
        {
          error:orderError.message
        },
        {
          status:500
        }
      );


    }





    // ذخیره محصولات سفارش

    const rows = orderItems.map(item => ({

      ...item,

      order_id: order.id

    }));



    const {
      error:itemsError

    } = await supabaseAdmin

      .from("order_items")

      .insert(rows);





    if(itemsError){


      console.error(
        "ITEM ERROR:",
        itemsError
      );


      return NextResponse.json(
        {
          error:itemsError.message
        },
        {
          status:500
        }
      );


    }





    // ارسال تلگرام

    try{

      await notifyNewOrder({

        ...order,

        items:orderItems

      });


    }

    catch(err){

      console.log(
        "Telegram error:",
        err
      );

    }





    return NextResponse.json({

      success:true,

      order

    });



  }


  catch(error){


    console.error(
      "API ERROR:",
      error
    );


    return NextResponse.json(
      {
        error:
          error.message ||
          "خطای سرور"
      },
      {
        status:500
      }
    );


  }

}
