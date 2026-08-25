"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/Providers";
import { money, discountedPrice } from "@/lib/data";


export default function CheckoutPage(){

const router = useRouter();

const {cart}=useCart();


const [step,setStep]=useState(1);


const [form,setForm]=useState({
name:"",
phone:"",
address:""
});


const [payment,setPayment]=useState({
trackingCode:"",
transactionTime:""
});


const [error,setError]=useState("");
const [loading,setLoading]=useState(false);



const total=cart.reduce(
(sum,item)=>
sum + discountedPrice(item.product)*item.qty,
0
);



function change(e){

setForm({
...form,
[e.target.name]:e.target.value
});

}



async function submitOrder(){


if(!payment.trackingCode || !payment.transactionTime){

setError("کد پیگیری و ساعت تراکنش را وارد کنید");
return;

}


setLoading(true);


try{


const res=await fetch("/api/orders",{

method:"POST",

headers:{
"Content-Type":"application/json"
},


body:JSON.stringify({

customer:form,

payment,

items:cart.map(item=>({

productId:item.product.id,
qty:item.qty

}))

})

});



const data=await res.json();


if(!res.ok){

throw new Error(data.error || "خطا در ثبت سفارش");

}


router.push(
"/order-success?id="+data.order.id
);



}
catch(e){

setError(e.message);

}
finally{

setLoading(false);

}


}




if(cart.length===0){

return(

<div style={boxStyle}>

<h2>
سبد خرید خالی است
</h2>

</div>

)

}



return (

<div
style={{
width:"100%",
maxWidth:900,
margin:"0 auto",
padding:"25px 15px 80px",
boxSizing:"border-box"
}}
>


<h1
style={{
fontWeight:800,
marginBottom:25,
fontSize:26
}}
>
تکمیل سفارش
</h1>




{step===1 &&


<div style={cardStyle}>


<h3>
اطلاعات گیرنده
</h3>



<input
style={inputStyle}
name="name"
placeholder="نام و نام خانوادگی"
value={form.name}
onChange={change}
/>



<input
style={inputStyle}
name="phone"
placeholder="شماره موبایل"
value={form.phone}
onChange={change}
/>



<textarea

style={{
...inputStyle,
minHeight:120,
resize:"vertical"
}}

name="address"

placeholder="آدرس کامل"

value={form.address}

onChange={change}

/>



<div
style={{
marginTop:20,
fontWeight:800,
fontSize:18
}}
>

مبلغ سفارش:
{" "}
{money(total)}

</div>



<button

style={buttonStyle}

onClick={()=>{


if(!form.name || !form.phone || !form.address){

setError("همه اطلاعات را وارد کنید");
return;

}


setError("");
setStep(2);


}}

>

تایید اطلاعات

</button>



{error &&

<p style={{color:"red"}}>

{error}

</p>

}



</div>


}






{step===2 &&


<div style={cardStyle}>


<h2>
پرداخت کارت به کارت
</h2>



<div
style={{
background:"#111",
color:"#fff",
padding:20,
borderRadius:16,
margin:"20px 0",
textAlign:"center"
}}
>


<p>
شماره کارت
</p>


<h2
style={{
direction:"ltr"
}}
>
5022291316719168
</h2>


<p>
به نام:
</p>


<h3>
علی دادخواه
</h3>


</div>





<input

style={inputStyle}

placeholder="کد پیگیری تراکنش"

value={payment.trackingCode}

onChange={(e)=>

setPayment({

...payment,

trackingCode:e.target.value

})

}

/>





<input

style={inputStyle}

placeholder="ساعت تراکنش مثلا 14:35"

value={payment.transactionTime}

onChange={(e)=>

setPayment({

...payment,

transactionTime:e.target.value

})

}

/>





{error &&

<p style={{color:"red"}}>

{error}

</p>

}





<button

style={buttonStyle}

disabled={loading}

onClick={submitOrder}

>


{

loading ?

"در حال ثبت..."

:

"ثبت نهایی سفارش"

}


</button>




<button

style={{
...buttonStyle,
background:"#333",
marginTop:10
}}

onClick={()=>setStep(1)}

>

بازگشت

</button>



</div>


}



</div>


);

}





const cardStyle={

background:"var(--surface)",

borderRadius:20,

padding:20,

boxSizing:"border-box"

};



const inputStyle={

width:"100%",

boxSizing:"border-box",

padding:"14px",

borderRadius:12,

border:"1px solid var(--surface2)",

background:"var(--bg)",

color:"var(--text-hi)",

fontFamily:"Vazirmatn",

marginTop:12,

fontSize:14

};



const buttonStyle={

width:"100%",

marginTop:20,

padding:"15px",

border:0,

borderRadius:14,

background:"#22E5C9",

fontWeight:800,

fontSize:15,

cursor:"pointer",

fontFamily:"Vazirmatn"

};



const boxStyle={

padding:60,

textAlign:"center"

};
