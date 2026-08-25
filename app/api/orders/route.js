import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyNewOrder } from "@/lib/telegram";
import { PRODUCTS, discountedPrice } from "@/lib/data";

export async function POST(req) {
try {
const body = await req.json();

```
const {
  customer,
  payment,
  items,
} = body;

if (
  !customer?.name ||
  !customer?.phone ||
  !customer?.address
) {
  return NextResponse.json(
    {
      error: "اطلاعات مشتری کامل نیست",
    },
    {
      status: 400,
    }
  );
}

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

let total = 0;
const orderItems = [];

for (const item of items) {
  const product = PRODUCTS.find(
    (p) => p.id === item.productId
  );

  if (!product) {
    return NextResponse.json(
      {
        error: "محصول پیدا نشد",
      },
      {
        status: 400,
      }
    );
  }

  const qty = Number(item.qty);

  if (!qty || qty <= 0) {
    return NextResponse.json(
      {
        error: "تعداد محصول نامعتبر است",
      },
      {
        status: 400,
      }
    );
  }

  const price = discountedPrice(product);

  total += price * qty;

  orderItems.push({
    product_id: product.id,
    qty,
    price,
  });
}

const orderData = {
  "customer name": customer.name,
  "customer phone": customer.phone,
  "customer address": customer.address,
  address: customer.address,

  total,

  status: "pending",

  "payment tracking code":
    payment?.trackingCode || "",

  "payment transaction time":
    payment?.transactionTime || "",

  "payment method":
    "card_to_card",
};

console.log("ORDER DATA:", orderData);

const {
  data: order,
  error: orderError,
} = await supabaseAdmin
  .from("orders")
  .insert(orderData)
  .select()
  .single();

if (orderError) {
  console.error(
    "SUPABASE ORDER ERROR:",
    orderError
  );

  return NextResponse.json(
    {
      error:
        orderError.message ||
        "خطا در ثبت سفارش در Supabase",
    },
    {
      status: 500,
    }
  );
}

const rows = orderItems.map((item) => ({
  ...item,
  order_id: order.id,
}));

const {
  error: itemsError,
} = await supabaseAdmin
  .from("order_items")
  .insert(rows);

if (itemsError) {
  console.error(
    "SUPABASE ORDER ITEMS ERROR:",
    itemsError
  );

  return NextResponse.json(
    {
      error:
        itemsError.message ||
        "خطا در ثبت محصولات سفارش",
    },
    {
      status: 500,
    }
  );
}

try {
  await notifyNewOrder({
    ...order,
    items: orderItems,
  });
} catch (telegramError) {
  console.error(
    "TELEGRAM ERROR:",
    telegramError
  );
}

return NextResponse.json(
  {
    success: true,
    order,
  },
  {
    status: 200,
  }
);
```

} catch (error) {
console.error(
"ORDER API ERROR:",
error
);

```
return NextResponse.json(
  {
    error:
      error?.message ||
      "خطایی در ثبت سفارش رخ داد",
  },
  {
    status: 500,
  }
);
```

}
}
v
