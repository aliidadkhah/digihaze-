export async function notifyNewOrder(order){

const token = process.env.TELEGRAM_BOT_TOKEN;

const chatId = process.env.TELEGRAM_CHAT_ID;


if(!token || !chatId) return;



const items = order.items
.map(
i =>
`• ${i.product_id} × ${i.qty}`
)
.join("\n");



const text =

`
🛒 سفارش جدید

شماره سفارش:
${order.id}


👤 مشتری:
${order.customer_name}


📱 موبایل:
${order.phone}


📍 آدرس:
${order.address}


💰 مبلغ:
${Number(order.total).toLocaleString("fa-IR")} تومان


📦 محصولات:

${items}


💳 کد پیگیری:
${order.tracking_code || "ثبت نشده"}

`;



await fetch(
`https://api.telegram.org/bot${token}/sendMessage`,
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

chat_id:chatId,

text

})

}

);


}
