import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// بررسی توکن ادمین (Bearer token که از Supabase Auth میاد)
async function verifyAdmin(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) return null;

  return data.user;
}

const FIELDS = "id, name, category, brand, price, images, available, colors";

// موجود بودن محصول: اگه رنگ/مدل داره از روی موجودی‌شون حساب می‌شه
function computeAvailable(colors, fallback) {
  if (Array.isArray(colors) && colors.length > 0) {
    return colors.some(
      (c) => c?.stock === null || c?.stock === undefined || Number(c.stock) > 0
    );
  }
  return !!fallback;
}

async function loadProduct(productId) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(FIELDS)
    .eq("id", String(productId))
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// بعد از هر تغییر موجودی، وضعیت «موجود/ناموجود» رو با موجودی رنگ‌ها هماهنگ می‌کنیم
async function syncAvailable(productId) {
  const product = await loadProduct(productId);
  if (!product) return null;

  const shouldBe = computeAvailable(product.colors, product.available);

  if (shouldBe !== product.available) {
    const { error } = await supabaseAdmin
      .from("products")
      .update({ available: shouldBe })
      .eq("id", String(productId));

    if (error) throw new Error(error.message);
    product.available = shouldBe;
  }

  return product;
}

function findColorIndex(product, colorName) {
  const name = String(colorName || "").trim();
  return (product.colors || []).findIndex(
    (c) => String(c?.name || "").trim() === name
  );
}

// لیست محصولات برای اپ انبار
export async function GET(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .select(FIELDS)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("INVENTORY FETCH ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data || [] });
}

// تغییر موجودی
//   action: "adjust"    → productId, color, delta (مثبت = ورود کالا، منفی = فروش/خروج)
//   action: "set"       → productId, color, value (عدد دقیق، یا null یعنی نامحدود)
//   action: "available" → productId, available (فقط برای محصولاتی که رنگ/مدل ندارن)
export async function POST(request) {
  const user = await verifyAdmin(request);

  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "شناسه محصول ارسال نشده است" },
        { status: 400 }
      );
    }

    const product = await loadProduct(productId);

    if (!product) {
      return NextResponse.json({ error: "محصول پیدا نشد" }, { status: 404 });
    }

    // ---------------------------------------------------
    // موجود/ناموجود برای محصول بدون رنگ
    // ---------------------------------------------------
    if (action === "available") {
      if ((product.colors || []).length > 0) {
        return NextResponse.json(
          { error: "موجودی این محصول از روی مدل‌هاش تعیین می‌شود" },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin
        .from("products")
        .update({ available: !!body.available })
        .eq("id", String(productId));

      if (error) throw new Error(error.message);

      return NextResponse.json({ product: await loadProduct(productId) });
    }

    // بقیه‌ی عملیات روی یک رنگ/مدل انجام می‌شن
    const idx = findColorIndex(product, body.color);

    if (idx === -1) {
      return NextResponse.json(
        { error: "این مدل/رنگ برای محصول پیدا نشد" },
        { status: 404 }
      );
    }

    const current = product.colors[idx];

    // ---------------------------------------------------
    // ورود / خروج کالا (اتمیک، با همون تابعی که سفارش‌های سایت استفاده می‌کنن)
    // ---------------------------------------------------
    if (action === "adjust") {
      const delta = Math.trunc(Number(body.delta));

      if (!Number.isFinite(delta) || delta === 0 || Math.abs(delta) > 100000) {
        return NextResponse.json({ error: "تعداد نامعتبر است" }, { status: 400 });
      }

      if (current.stock === null || current.stock === undefined) {
        return NextResponse.json(
          {
            error:
              "موجودی این مدل «نامحدود» ثبت شده؛ اول یک عدد دقیق برایش تعیین کن.",
          },
          { status: 409 }
        );
      }

      const { data: result, error: rpcError } = await supabaseAdmin.rpc(
        "adjust_color_stock",
        {
          p_product_id: String(productId),
          p_color_name: String(current.name || ""),
          p_delta: delta,
        }
      );

      if (rpcError) throw new Error(rpcError.message);

      if (!result?.ok) {
        if (result?.reason === "insufficient") {
          return NextResponse.json(
            {
              error: `موجودی فعلی فقط ${result.stock ?? 0} عدد است؛ بیشتر از این نمی‌شود کم کرد.`,
            },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: "تغییر موجودی انجام نشد" },
          { status: 409 }
        );
      }

      return NextResponse.json({ product: await syncAvailable(productId) });
    }

    // ---------------------------------------------------
    // تعیین موجودی دقیق
    // ---------------------------------------------------
    if (action === "set") {
      let value = null;

      if (body.value !== null && body.value !== undefined && body.value !== "") {
        value = Math.trunc(Number(body.value));

        if (!Number.isFinite(value) || value < 0 || value > 1000000) {
          return NextResponse.json({ error: "عدد نامعتبر است" }, { status: 400 });
        }
      }

      const colors = product.colors.map((c, i) =>
        i === idx ? { ...c, stock: value } : c
      );

      const { error } = await supabaseAdmin
        .from("products")
        .update({
          colors,
          available: computeAvailable(colors, product.available),
        })
        .eq("id", String(productId));

      if (error) throw new Error(error.message);

      return NextResponse.json({ product: await loadProduct(productId) });
    }

    return NextResponse.json({ error: "عملیات نامعتبر است" }, { status: 400 });
  } catch (error) {
    console.error("INVENTORY POST ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
