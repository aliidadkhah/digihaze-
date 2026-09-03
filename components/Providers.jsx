"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";

const CartContext = createContext(null);
const UserContext = createContext(null);
const ThemeContext = createContext(null);


export function useCart() {
  return useContext(CartContext);
}

export function useUser() {
  return useContext(UserContext);
}

// آیا پروفایل کاربر برای تسویه‌حساب کامله؟
export function isProfileComplete(user) {
  return !!(
    user &&
    user.name &&
    user.contact &&
    user.province &&
    user.city &&
    user.address &&
    user.postalCode
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}



export default function Providers({ children }) {


  const [cart, setCart] = useState([]);

  const [user, setUser] = useState(null);

  const [theme, setTheme] = useState("dark");

  // پیام کوچک "به سبد خرید اضافه شد"
  const [cartToast, setCartToast] = useState(null);
  const toastTimerRef = useRef(null);



  // خواندن سبد خرید هنگام ورود
  useEffect(() => {

    const savedCart = localStorage.getItem("cart");

    if(savedCart){

      setCart(JSON.parse(savedCart));

    }

  }, []);



  // خواندن کاربر ذخیره‌شده هنگام بارگذاری اولیه
  useEffect(() => {

    const savedUser = localStorage.getItem("user");

    if(savedUser){

      setUser(JSON.parse(savedUser));

    }

  }, []);



  // ذخیره کاربر بعد از هر تغییر (ورود/خروج)
  useEffect(() => {

    if(user){

      localStorage.setItem("user", JSON.stringify(user));

    } else {

      localStorage.removeItem("user");

    }

  }, [user]);




  // ذخیره سبد خرید بعد از هر تغییر
  useEffect(() => {

    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    );

  }, [cart]);





  useEffect(() => {

    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

  }, [theme]);


  // پاک‌سازی تایمر پیام هنگام خروج از صفحه
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);






  const addToCart = (product, qty = 1) => {


    setCart((prev)=>{


      const found = prev.find(
        i=>i.product.id === product.id
      );


      if(found){

        return prev.map(i=>

          i.product.id === product.id

          ?

          {
            ...i,
            qty:i.qty + qty
          }

          :

          i

        );

      }



      return [
        ...prev,
        {
          product,
          qty
        }
      ];



    });


    // نمایش پیام کوچک "به سبد خرید اضافه شد"
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setCartToast({
      name: product?.name || product?.title || "محصول",
    });

    toastTimerRef.current = setTimeout(() => {
      setCartToast(null);
    }, 3000);


  };







  const updateQty = (id, qty)=>{


    setCart(prev=>


      qty <= 0

      ?

      prev.filter(
        i=>i.product.id !== id
      )


      :

      prev.map(i=>

        i.product.id === id

        ?

        {
          ...i,
          qty
        }

        :

        i

      )


    );


  };






  const removeItem=(id)=>{


    setCart(prev=>

      prev.filter(
        i=>i.product.id !== id
      )

    );


  };






  const clearCart=()=>{

    setCart([]);

  };






  const cartValue={

    cart,

    addToCart,

    updateQty,

    removeItem,

    clearCart,

    count:
      cart.reduce(
        (s,i)=>s+i.qty,
        0
      )

  };





  const updateProfile = (fields) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : prev));
  };

  const userValue={

    user,

    login:setUser,

    logout:()=>setUser(null),

    updateProfile,

  };





  const themeValue={

    theme,

    toggle:()=>setTheme(
      t=>t==="dark"
      ?
      "light"
      :
      "dark"
    )

  };






  return (

    <CartContext.Provider value={cartValue}>

      <UserContext.Provider value={userValue}>

        <ThemeContext.Provider value={themeValue}>

          {children}

          {cartToast && (
            <div className="cart-toast" role="status">
              <span className="cart-toast-text">
                «{cartToast.name}» به سبد خرید اضافه شد
              </span>

              <Link
                href="/cart"
                className="cart-toast-link"
                onClick={() => setCartToast(null)}
              >
                رفتن به سبد خرید
              </Link>

              <style jsx>{`
                .cart-toast {
                  position: fixed;
                  bottom: 20px;
                  left: 50%;
                  transform: translateX(-50%);
                  z-index: 999;
                  background: var(--surface, #1a1a2e);
                  border: 1px solid var(--surface2, #2a2a3e);
                  border-radius: 12px;
                  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.3);
                  padding: 12px 16px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 6px;
                  max-width: 90vw;
                  animation: cart-toast-in 0.18s ease-out;
                }

                .cart-toast-text {
                  font-family: Vazirmatn, sans-serif;
                  font-size: 13.5px;
                  font-weight: 600;
                  color: var(--text-hi, #fff);
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  max-width: 80vw;
                }

                .cart-toast-link {
                  font-family: Vazirmatn, sans-serif;
                  font-size: 13px;
                  font-weight: 700;
                  color: #22e5c9;
                  text-decoration: none;
                }

                .cart-toast-link:hover {
                  text-decoration: underline;
                }

                @keyframes cart-toast-in {
                  from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(8px);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                  }
                }
              `}</style>
            </div>
          )}

        </ThemeContext.Provider>

      </UserContext.Provider>

    </CartContext.Provider>

  );

}
