"use client";

import { createContext, useContext, useEffect, useState } from "react";

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

        </ThemeContext.Provider>

      </UserContext.Provider>

    </CartContext.Provider>

  );

}
