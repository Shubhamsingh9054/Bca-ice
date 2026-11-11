import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { useStore } from './StoreContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; message?: string };
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  taxAmount: number;
  finalTotal: number;
  isMinimumMet: boolean;
  minOrderValue: number;
  deficitToMinimum: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  getItemQuantity: (productId: string) => number;
}

const CART_STORAGE_KEY = 'bca_icecream_cart_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAvailableStock, settings } = useStore();
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const getItemQuantity = (productId: string): number => {
    const item = cartItems.find((it) => it.product.id === productId);
    return item ? item.quantity : 0;
  };

  const addToCart = (product: Product, quantity = 1): { success: boolean; message?: string } => {
    if (!product.isActive) {
      return { success: false, message: 'This ice cream is currently not available.' };
    }

    const availableStock = getAvailableStock(product.id);
    const existing = cartItems.find((it) => it.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const requestedTotal = currentQty + quantity;

    if (availableStock <= 0) {
      return { success: false, message: `Sorry, ${product.name} is currently Out of Stock.` };
    }

    if (requestedTotal > availableStock) {
      return {
        success: false,
        message: `Only ${availableStock} units of ${product.name} are available today in shop.`,
      };
    }

    setCartItems((prev) => {
      const idx = prev.findIndex((it) => it.product.id === product.id);
      if (idx > -1) {
        const copy = [...prev];
        const newQty = copy[idx].quantity + quantity;
        copy[idx] = {
          ...copy[idx],
          quantity: newQty,
          totalPrice: newQty * copy[idx].unitPrice,
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            product,
            quantity,
            unitPrice: product.price,
            totalPrice: product.price * quantity,
          },
        ];
      }
    });

    return { success: true };
  };

  const updateQuantity = (productId: string, quantity: number): { success: boolean; message?: string } => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true };
    }

    const availableStock = getAvailableStock(productId);
    if (quantity > availableStock) {
      return {
        success: false,
        message: `Cannot add more. Only ${availableStock} units in stock.`,
      };
    }

    setCartItems((prev) =>
      prev.map((it) =>
        it.product.id === productId
          ? {
              ...it,
              quantity,
              totalPrice: quantity * it.unitPrice,
            }
          : it
      )
    );

    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalItemsCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = cartItems.reduce((acc, it) => acc + it.totalPrice, 0);
  const taxAmount = 0; // Transparent pricing without hidden fees
  const finalTotal = subtotal + taxAmount;

  const minOrderValue = settings.minOrderValue || 50;
  const isMinimumMet = subtotal >= minOrderValue;
  const deficitToMinimum = Math.max(0, minOrderValue - subtotal);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemsCount,
        subtotal,
        taxAmount,
        finalTotal,
        isMinimumMet,
        minOrderValue,
        deficitToMinimum,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
