"use client";

import Link from "next/link";
import { ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import { qtyBtnStyle } from "./ui";
import { money, discountedPrice } from "@/lib/data";
import { useCart } from "./Providers";

export default function CartContent() {
  const { cart, updateQty, removeItem } = useCart();
  const total = cart.reduce((s, i) => s + discountedPrice(i.product) * i.qty, 0);

  if (cart.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <ShoppingBag size={40} color="var(--border-soft)" style={{ margin: "0 auto 18px" }} />
        <h2 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 20, marginBottom: 10 }}>سبد خریدت خالیه</h2>
        <p style={{ color: "var(--text-mut)", fontSize: 14, marginBottom: 24 }}>یه سر به فروشگاه بزن، پر از طعم‌های جدیده.</p>
        <Link href="/shop" style={{ background: "#2F86FF", color: "var(--ink)", border: "none", borderRadius: 12, padding: "12px 28px", fontFamily: "Vazirmatn", fontWeight: 800, textDecoration: "none", display: "inline-block" }}>
          رفتن به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 80px" }}>
      <h1 style={{ fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 26, marginBottom: 26 }}>سبد خرید</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 26 }}>
        {cart.map((item) => (
          <div key={item.product.id} style={{ display: "flex", gap: 14, background: "var(--surface)", borderRadius: 14, padding: 12, alignItems: "center" }}>
            <img src={item.product.images[0]} alt="" style={{ width: 70, height: 70, borderRadius: 10, objectFit: "cover" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.product.name}</div>
              <div style={{ color: "var(--text-mut)", fontSize: 12 }}>{money(discountedPrice(item.product))}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--surface2)", borderRadius: 10, overflow: "hidden" }}>
              <button onClick={() => updateQty(item.product.id, item.qty + 1)} style={qtyBtnStyle}>
                <Plus size={13} />
              </button>
              <span style={{ width: 30, textAlign: "center", fontSize: 13, fontWeight: 700 }}>{item.qty}</span>
              <button onClick={() => updateQty(item.product.id, item.qty - 1)} style={qtyBtnStyle}>
                <Minus size={13} />
              </button>
            </div>
            <button onClick={() => removeItem(item.product.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <Trash2 size={17} color="#2F86FF" />
            </button>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--surface)", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--text-lo)", marginBottom: 10 }}>
          <span>جمع سبد خرید</span>
          <span>{money(total)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--text-lo)", marginBottom: 16 }}>
          <span>هزینه ارسال</span>
          <span>رایگان</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17, borderTop: "1px solid var(--surface2)", paddingTop: 14, marginBottom: 20 }}>
          <span>مبلغ نهایی</span>
          <span>{money(total)}</span>
        </div>
        <button style={{ width: "100%", background: "#22E5C9", border: "none", borderRadius: 12, padding: "14px 0", fontFamily: "Vazirmatn", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
          ادامه فرآیند خرید
        </button>
      </div>
    </div>
  );
}
