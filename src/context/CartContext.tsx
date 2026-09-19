import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { type CartItem } from '../types/cart';
import { type Product } from '../types/products';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  loading: boolean;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (sku: string) => Promise<void>;
  updateQuantity: (sku: string, quantity: number) => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  loading: true,
  addItem: async () => {},
  removeItem: async () => {},
  updateQuantity: async () => {},
});

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'cart'), (snapshot) => {
      const cartItems = snapshot.docs.map((docSnap) => ({
        sku: docSnap.id,
        ...docSnap.data(),
      })) as CartItem[];
      setItems(cartItems);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addItem = async (product: Product, quantity = 1) => {
    if (!user) return;

    const existing = items.find((item) => item.sku === product.id);

    await setDoc(
      doc(db, 'users', user.uid, 'cart', product.id),
      {
        quantity: (existing?.quantity ?? 0) + quantity,
        price: product.price,
        name: product.name,
        imageUrl: product.imageUrl,
      },
      { merge: true }
    );
  };

  const removeItem = async (sku: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'cart', sku));
  };

  const updateQuantity = async (sku: string, quantity: number) => {
    if (!user || quantity < 1) return;
    await updateDoc(doc(db, 'users', user.uid, 'cart', sku), { quantity });
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, loading, addItem, removeItem, updateQuantity }}>
      {children}
    </CartContext.Provider>
  );
}