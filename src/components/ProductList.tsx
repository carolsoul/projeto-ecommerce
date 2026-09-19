import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type Product } from '../types/products';
import ProductGrid from './ProductGrid';

const PAGE_SIZE = 24;

interface ProductListProps {
  /**
   * Filtro vindo de `/?categoria=`. O componente é remontado via `key` quando
   * ele muda, então o estado de paginação se reinicia sozinho — sem efeito
   * limpando estado, que é justamente o que o React Compiler não aceita.
   */
  category?: string | null;
}

// Filtrar por categoria e ordenar por createdAt ao mesmo tempo exige um índice
// composto no Firestore (category ASC + createdAt DESC). Ele não é criado
// sozinho: na primeira vez, o Firestore devolve um erro com o link para criar
// com um clique. Está documentado no README.
function buildConstraints(category: string | null, cursor: QueryDocumentSnapshot | null) {
  const constraints: QueryConstraint[] = [];

  if (category !== null) {
    constraints.push(where('category', '==', category));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  if (cursor !== null) {
    constraints.push(startAfter(cursor));
  }

  constraints.push(limit(PAGE_SIZE));

  return constraints;
}

// Nota sobre o formato dos try/catch abaixo: eles repetem o reset dos flags em
// vez de usar `finally`, e derivam o cursor com `if` em vez de `??`. Não é
// descuido — o babel-plugin-react-compiler@1.0.0 desiste de memoizar o
// componente inteiro diante de qualquer um dos dois ("Handle TryStatement with
// a finalizer clause" e "Support value blocks ... within a try/catch"). Voltar
// a usar finally ou ?? aqui derruba a memoização silenciosamente.

export default function ProductList({ category = null }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guardamos o snapshot do último documento, não o valor de createdAt: a
  // importação em lote grava serverTimestamp() em centenas de produtos quase no
  // mesmo instante, e só o snapshot desempata (pelo __name__ implícito) sem
  // pular nem repetir itens entre as páginas.
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    async function fetchFirstPage() {
      try {
        const q = query(collection(db, 'products'), ...buildConstraints(category, null));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs;
        const data = docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];

        let lastDoc: QueryDocumentSnapshot | null = null;
        if (docs.length > 0) {
          lastDoc = docs[docs.length - 1];
        }

        setProducts(data);
        setCursor(lastDoc);
        setHasMore(docs.length === PAGE_SIZE);
        setLoading(false);
      } catch {
        setError('Não foi possível carregar os produtos.');
        setLoading(false);
      }
    }

    fetchFirstPage();
  }, [category]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      const q = query(collection(db, 'products'), ...buildConstraints(category, cursor));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const data = docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];

      let lastDoc = cursor;
      if (docs.length > 0) {
        lastDoc = docs[docs.length - 1];
      }

      setProducts((current) => [...current, ...data]);
      setCursor(lastDoc);
      setHasMore(docs.length === PAGE_SIZE);
      setLoadingMore(false);
    } catch {
      setError('Não foi possível carregar mais produtos.');
      setLoadingMore(false);
    }
  };

  return (
    <section className="mt-6 px-4 md:px-8" aria-labelledby="products-heading">
      <div className="max-w-7xl mx-auto">
        <div className="border-b border-slate-300 pb-4 mb-8 md:mb-12">
          <h2 id="products-heading" className="text-2xl font-bold text-slate-900 capitalize">
            {category === null ? 'Populares' : category}
          </h2>
          <p className="text-base text-slate-600 mt-2">
            {category === null
              ? 'Confira os produtos mais populares e tendenciosos.'
              : `Produtos da categoria ${category}.`}
          </p>
        </div>

        {loading && <p className="text-center py-12">Carregando produtos...</p>}
        {!loading && error && products.length === 0 && (
          <p className="text-center py-12 text-red-600">{error}</p>
        )}
        {!loading && !error && products.length === 0 && (
          <p className="text-center py-12">Nenhum produto encontrado nesta categoria.</p>
        )}

        {products.length > 0 && (
          <>
            <ProductGrid products={products} />

            {error && <p className="text-center pt-8 text-red-600">{error}</p>}

            {hasMore && (
              <div className="text-center pt-10">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 text-sm font-semibold rounded-md cursor-pointer bg-white text-slate-900 border border-slate-300 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {loadingMore ? 'Carregando...' : 'Carregar mais'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
