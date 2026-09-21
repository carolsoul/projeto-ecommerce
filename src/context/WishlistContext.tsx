import { useEffect, useState, type ReactNode } from 'react';
import { collection, deleteDoc, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { WishlistContext } from './useWishlist';
import { type WishlistItem } from '../types/wishlist';
import { type Product } from '../types/products';

// Mesma estratégia do carrinho: o uid viaja junto dos itens para sabermos de
// qual sessão eles vieram.
interface WishlistSnapshot {
  uid: string | null;
  items: WishlistItem[];
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [snapshot, setSnapshot] = useState<WishlistSnapshot>({ uid: null, items: [] });

  useEffect(() => {
    if (!uid) return;

    return onSnapshot(
      collection(db, 'users', uid, 'wishlist'),
      (snap) => {
        const items = snap.docs.map((docSnap) => ({
          sku: docSnap.id,
          ...docSnap.data(),
        })) as WishlistItem[];

        setSnapshot({ uid, items });
      },
      (error) => {
        // Mesmo tratamento do carrinho: resolve o loading em vez de travar a
        // tela, mas deixa o erro visível no console para diagnóstico.
        console.error('Falha ao ouvir os favoritos:', error);
        setSnapshot({ uid, items: [] });
      }
    );
  }, [uid]);

  const isCurrent = snapshot.uid === uid;
  const items = uid !== null && isCurrent ? snapshot.items : [];
  const loading = uid !== null && !isCurrent;

  const has = (sku: string) => items.some((item) => item.sku === sku);

  const removeItem = async (sku: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'wishlist', sku));
  };

  const toggleItem = async (product: Product) => {
    if (!uid) return;

    const ref = doc(db, 'users', uid, 'wishlist', product.id);

    if (has(product.id)) {
      await deleteDoc(ref);
      return;
    }

    await setDoc(ref, {
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.price,
      mrp: product.mrp ?? null,
      addedAt: serverTimestamp(),
    });
  };

  const itemCount = items.length;

  return (
    <WishlistContext.Provider value={{ items, itemCount, loading, has, toggleItem, removeItem }}>
      {children}
    </WishlistContext.Provider>
  );
}
