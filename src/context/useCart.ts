import { createContext, useContext } from 'react';
import { type CartItem } from '../types/cart';
import { type CartableProduct } from '../types/products';

export interface CartContextType {
  items: CartItem[];
  itemCount: number;
  loading: boolean;
  addItem: (product: CartableProduct, quantity?: number) => Promise<void>;
  removeItem: (sku: string) => Promise<void>;
  updateQuantity: (sku: string, quantity: number) => Promise<void>;
}

export const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  loading: true,
  addItem: async () => {},
  removeItem: async () => {},
  updateQuantity: async () => {},
});

export const useCart = () => useContext(CartContext);
