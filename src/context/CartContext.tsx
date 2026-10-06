import { useEffect, useState, type ReactNode } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { CartContext } from './useCart';
import { type CartItem } from '../types/cart';
import { type CartableProduct } from '../types/products';

// O uid fica guardado junto dos itens para saber de qual sessão eles vieram.
interface CartSnapshot {
  uid: string | null;
  items: CartItem[];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [snapshot, setSnapshot] = useState<CartSnapshot>({ uid: null, items: [] });

  useEffect(() => {
    if (!uid) return;

    return onSnapshot(
      collection(db, 'users', uid, 'cart'),
      (snap) => {
        const items = snap.docs.map((docSnap) => ({
          sku: docSnap.id,
          ...docSnap.data(),
        })) as CartItem[];

        setSnapshot({ uid, items });
      },
      (error) => {
        console.error('Falha ao ouvir o carrinho:', error);
        setSnapshot({ uid, items: [] });
      }
    );
  }, [uid]);
  
  const isCurrent = snapshot.uid === uid;
  const items = uid !== null && isCurrent ? snapshot.items : [];
  const loading = uid !== null && !isCurrent;

  const addItem = async (product: CartableProduct, quantity = 1) => {
    if (!uid) return;

    const existing = items.find((item) => item.sku === product.id);

    await setDoc(
      doc(db, 'users', uid, 'cart', product.id),
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
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'cart', sku));
  };

  const updateQuantity = async (sku: string, quantity: number) => {
    if (!uid || quantity < 1) return;
    await updateDoc(doc(db, 'users', uid, 'cart', sku), { quantity });
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, loading, addItem, removeItem, updateQuantity }}>
      {children}
    </CartContext.Provider>
  );
}
