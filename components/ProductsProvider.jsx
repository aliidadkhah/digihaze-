"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getProducts } from "@/lib/products";

const ProductsContext = createContext({
  products: [],
  loading: true,
  refresh: () => {},
  getProductById: () => null,
});

export function useProducts() {
  return useContext(ProductsContext);
}

export default function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getProductByIdLocal = (id) => products.find((p) => p.id === id) || null;

  return (
    <ProductsContext.Provider
      value={{ products, loading, refresh: load, getProductById: getProductByIdLocal }}
    >
      {children}
    </ProductsContext.Provider>
  );
}
