"use client";

import Link from "next/link";
import { ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import { money, discountedPrice } from "@/lib/data";
import { useCart } from "./Providers";
import { qtyBtnStyle } from "./ui";

export default function CartContent() {

  const { cart, updateQty, removeItem } = useCart();


  const total = cart.reduce(
    (sum, item) =>
      sum + discountedPrice(item.product) * item.qty,
    0
  );


  if(cart.length === 0){

    return (
      <div style={{
        maxWidth:600,
        margin:"0 auto",
        padding:"80px 20px",
        textAlign:"center"
      }}>

        <ShoppingBag size={40}/>

        <h2>
          سبد خرید خالی است
        </h2>


        <Link href="/shop">
          رفتن به فروشگاه
        </Link>

      </div>
    );
  }



  return (

    <div style={{
      maxWidth:900,
      margin:"0 auto",
      padding:"40px 20px"
    }}>


      <h1>
        سبد خرید
      </h1>


      {cart.map((item)=>{

        const product=item.product;


        return (

          <div
          key={product.id}
          style={{
            display:"flex",
            gap:15,
            alignItems:"center",
            background:"var(--surface)",
            padding:12,
            borderRadius:16,
            marginBottom:14
          }}>


            <img
            src={product.images[0]}
            style={{
              width:70,
              height:70,
              objectFit:"cover",
              borderRadius:10
            }}
            />


            <div style={{flex:1}}>

              <div>
                {product.name}
              </div>

              <small>
                {money(discountedPrice(product))}
              </small>

            </div>



            <button
            onClick={()=>updateQty(product.id,item.qty+1)}
            style={qtyBtnStyle}
            >
              <Plus size={14}/>
            </button>


            <span>
              {item.qty}
            </span>


            <button
            onClick={()=>updateQty(product.id,item.qty-1)}
            style={qtyBtnStyle}
            >
              <Minus size={14}/>
            </button>



            <button
            onClick={()=>removeItem(product.id)}
            style={{
              background:"none",
              border:0,
              cursor:"pointer"
            }}
            >
              <Trash2 size={18}/>
            </button>


          </div>

        );

      })}



      <div
      style={{
        marginTop:30,
        padding:20,
        background:"var(--surface)",
        borderRadius:16
      }}
      >

        <h3>
          مبلغ نهایی:
          {" "}
          {money(total)}
        </h3>


        <button
        style={{
          width:"100%",
          padding:14,
          border:0,
          borderRadius:12,
          background:"#22E5C9",
          fontWeight:800,
          cursor:"pointer"
        }}
        >
          ادامه فرآیند خرید
        </button>


      </div>


    </div>

  );
}
