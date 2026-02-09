import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as cartService from '../services/cartService';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }

    setLoading(true);
    try {
      const data = await cartService.getMyCart();
      setCart(data.cart);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (productId, qty) => {
    const data = await cartService.addToCart({ productId, qty });
    setCart(data.cart);
  }, []);

  const updateQty = useCallback(async (productId, qty) => {
    const data = await cartService.updateCart({ productId, qty });
    setCart(data.cart);
  }, []);

  const remove = useCallback(async (productId) => {
    const data = await cartService.removeFromCart({ productId });
    setCart(data.cart);
  }, []);

  const clear = useCallback(async () => {
    const data = await cartService.clearCart();
    setCart(data.cart);
  }, []);

  const totals = useMemo(() => {
    const items = cart?.items || [];
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    return { subtotal, count: items.reduce((s, i) => s + i.qty, 0) };
  }, [cart]);

  const value = useMemo(
    () => ({ cart, loading, refresh, add, updateQty, remove, clear, totals }),
    [cart, loading, refresh, add, updateQty, remove, clear, totals]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
