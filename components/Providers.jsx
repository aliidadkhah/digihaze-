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


      qty
