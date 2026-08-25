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

    const authHeader = req.headers.get("authorization") || "";

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;


    if (!token) {
      return NextResponse.json(
        { error: "برای ثبت سفارش باید وارد حساب کاربری شوی" },
        { status: 401 }
      );
    }


    const userClient = getUserClient(token);


    const { data: userData, error: userErr } =
      await userClient.auth.getUser();


    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "نشست شما نامعتبر است" },
        { status: 401 }
      );
    }



    const body = await req.json();

    const { items, customer } = body;



    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "سبد خرید خالی است" },
        { status: 400 }
      );
    }



    let total = 0;

    const orderItems = [];



    for (const i of items) {

      const product = PRODUCTS.find(
        (p) => p.id === i.productId
      );


      if (!product) {
        return NextResponse.json(
          { error: "محصول نامعتبر است" },
          { status: 400 }
        );
      }


      const price = discountedPrice(product);


      total += price * i.qty;


      orderItems.push({
        product_id: product.id,
        qty: i.qty,
        price,
      });

    }



    const { data: order, error: orderErr } =
      await supabaseAdmin
        .from("orders")
        .insert({

          user_id: userData.user.id,

          total,

          status: "waiting_payment",

          customer_name: customer?.name || "",

          phone: customer?.phone || "",

          address: customer?.address || "",

        })
        .select()
        .single();



    if (orderErr) {

      return NextResponse.json(
        { error: orderErr.message },
        { status: 500 }
      );

    }



    const rows = orderItems.map((item)=>({

      ...item,

      order_id: order.id,

    }));


    const { error:itemErr } =
      await supabaseAdmin
      .from("order_items")
      .insert(rows);



    if(itemErr){

      return NextResponse.json(
        {error:itemErr.message},
        {status:500}
      );

    }



    await notifyNewOrder({
      ...order,
      items: orderItems,
      customer,
    });



    return NextResponse.json({

      success:true,

      order:{
        ...order,
        items:orderItems,
      },

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
