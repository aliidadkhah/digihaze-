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
sum+discountedPrice(item.product)*item.qty,
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

throw new Error(data.error);

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



return (

<div
style={{
maxWidth:700,
margin:"40px auto",
padding:"20px"
}}
>


<h1>
تکمیل سفارش
</h1>



{step===1 &&

<div>


<h3>
اطلاعات گیرنده
</h3>


<input
name="name"
placeholder="نام و نام خانوادگی"
value={form.name}
onChange={change}
/>


<input
name="phone"
placeholder="شماره موبایل"
value={form.phone}
onChange={change}
/>


<textarea

name="address"

placeholder="آدرس کامل"

value={form.address}

onChange={change}

/>


<h3>
مبلغ سفارش:
{money(total)}
</h3>


<button

onClick={()=>{

if(!form.name||!form.phone||!form.address){

setError("همه اطلاعات را وارد کنید");

return;

}

setStep(2);

}}

>

تایید اطلاعات

</button>


</div>

}





{step===2 &&

<div>


<h2>
پرداخت کارت به کارت
</h2>


<div
style={{
background:"#111",
padding:20,
borderRadius:15
}}
>

<p>
شماره کارت:
</p>

<h2>
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

disabled={loading}

onClick={submitOrder}

>

{loading ?

"در حال ثبت..."

:

"ثبت نهایی سفارش"

}


</button>



</div>

}



</div>

);


}
