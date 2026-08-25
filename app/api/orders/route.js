import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyNewOrder } from "@/lib/telegram";
import { PRODUCTS, discountedPrice } from "@/lib/data";

export async function POST(req) {

  try {

    const body = await req.json();

    const {
      customer,
      items,
      trackingCode
    } = body;


    if (!customer?.name || !customer?.phone || !customer?.address) {

      return NextResponse.json(
        {
          error:"اطلاعات مشتری کامل نیست"
        },
        {
          status:400
        }
      );

    }


    if (!Array.isArray(items) || items.length === 0) {

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

    const orderItems=[];



    for(const item of items){

      const product = PRODUCTS.find(
        p=>p.id === item.productId
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



      const price = discountedPrice(product);


      total += price * item.qty;


      orderItems.push({

        product_id:product.id,

        qty:item.qty,

        price

      });

    }




    const {data:order,error} =
    await supabaseAdmin
    .from("orders")
    .insert({

      customer_name:customer.name,

      phone:customer.phone,

      address:customer.address,

      total,

      tracking_code:trackingCode || "",

      status:"pending"

    })
    .select()
    .single();



    if(error){

      return NextResponse.json(
        {
          error:error.message
        },
        {
          status:500
        }
      );

    }




    const rows =
    orderItems.map(item=>({

      ...item,

      order_id:order.id

    }));


    await supabaseAdmin
    .from("order_items")
    .insert(rows);



    await notifyNewOrder({

      ...order,

      items:orderItems

    });



    return NextResponse.json({

      order

    });



  } catch(error){

    return NextResponse.json(
      {
        error:error.message
      },
      {
        status:500
      }
    );

  }

}
