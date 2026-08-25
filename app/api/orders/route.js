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
      items
    } = body;



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
          status: 400
        }
      );

    }



    if (
      !payment?.trackingCode ||
      !payment?.transactionTime
    ) {

      return NextResponse.json(
        {
          error: "اطلاعات پرداخت کامل نیست"
        },
        {
          status:400
        }
      );

    }



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


      if (!product) {

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



      if (!qty || qty <= 0) {

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





    const {
      data: order,
      error: orderError

    } = await supabaseAdmin

      .from("orders")

      .insert({

        customer_name:
          customer.name,


        customer_phone:
          customer.phone,


        customer_address:
          customer.address,


        address:
          customer.address,


        total,


        status:
          "pending",


        payment_tracking_code:
          payment.trackingCode,


        payment_transaction_time:
          payment.transactionTime,


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






    const rows =
      orderItems.map(item => ({

        ...item,

        order_id:order.id

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






    try {

      await notifyNewOrder({

        ...order,

        items:orderItems

      });


    } catch(error){

      console.error(
        "TELEGRAM ERROR:",
        error
      );

    }






    return NextResponse.json(
      {
        success:true,

        order

      },
      {
        status:200
      }
    );



  } catch(error){


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
