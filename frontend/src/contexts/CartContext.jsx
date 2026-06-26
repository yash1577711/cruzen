import { createContext, useContext, useState, useEffect } from 'react';

const DURATION_DISCOUNTS = { 1: 0, 3: 5, 6: 10, 12: 20 };

function calcTotal(price, duration, quantity) {
  const disc = DURATION_DISCOUNTS[duration] ?? (duration >= 12 ? 20 : duration >= 6 ? 10 : duration >= 3 ? 5 : 0);
  return Math.round(price * quantity * duration * (1 - disc / 100));
}

const CartContext = createContext({ items: [], addToCart: () => {}, removeFromCart: () => {}, updateItem: () => {}, clearCart: () => {}, cartCount: 0 });

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cruzen_cart') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('cruzen_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (item) => {
    setItems(prev => {
      const idx = prev.findIndex(i =>
        i.serviceId === item.serviceId &&
        i.planName === item.planName &&
        i.duration === item.duration
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + item.quantity,
          totalAmount: next[idx].totalAmount + item.totalAmount,
        };
        return next;
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const updateItem = (idx, changes) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const next = { ...item, ...changes };
      const disc = DURATION_DISCOUNTS[next.duration] ?? (next.duration >= 12 ? 20 : next.duration >= 6 ? 10 : next.duration >= 3 ? 5 : 0);
      next.discountPct = disc;
      next.totalAmount = calcTotal(next.price, next.duration, next.quantity);
      return next;
    }));
  };

  const clearCart = () => setItems([]);
  const cartCount = items.length;

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateItem, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
