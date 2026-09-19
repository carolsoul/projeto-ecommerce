import { createContext, useContext } from 'react';
import { type WishlistItem } from '../types/wishlist';
import { type Product } from '../types/products';

export interface WishlistContextType {
  items: WishlistItem[];
  itemCount: number;
  loading: boolean;
  has: (sku: string) => boolean;
  toggleItem: (product: Product) => Promise<void>;
  removeItem: (sku: string) => Promise<void>;
}

export const WishlistContext = createContext<WishlistContextType>({
  items: [],
  itemCount: 0,
  loading: true,
  has: () => false,
  toggleItem: async () => {},
  removeItem: async () => {},
});

export const useWishlist = () => useContext(WishlistContext);
