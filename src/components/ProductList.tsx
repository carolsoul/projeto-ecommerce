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
import { BORDER, BRAND, CARD, DANGER, DISABLED_SUBTLE, FOCUS, PINK_HOVER } from '../lib/theme';

const PAGE_SIZE = 24;

/**
 * Tamanho da coleção nova. Recorte curto de propósito: "novidades" é uma vitrine
 * do que acabou de chegar, não um segundo catálogo paginado.
 */
const NEW_COLLECTION_SIZE = 12;

interface ProductListProps {
  /**
   * Filtro vindo de `/?categoria=`. O componente é remontado via `key` quando ele muda e o estado de paginação se reinicia sozinho.
   */
  category?: string | null;
  /**
   * Vindo de `/?colecao=novidades`, o destino do botão do banner.
   *
   * Não existe campo de coleção no catálogo, e a consulta já ordena por
   * `createdAt desc` — a coleção nova é o topo dessa mesma lista. Então isto não
   * muda a consulta, só encurta o recorte e troca o cabeçalho. Uma coleção de
   * verdade (nomeada, curada) exigiria coluna nova no CSV.
   */
  newOnly?: boolean;
}
function buildConstraints(
  category: string | null,
  cursor: QueryDocumentSnapshot | null,
  pageSize: number
) {
  const constraints: QueryConstraint[] = [];

  if (category !== null) {
    constraints.push(where('category', '==', category));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  if (cursor !== null) {
    constraints.push(startAfter(cursor));
  }

  constraints.push(limit(pageSize));

  return constraints;
}

export default function ProductList({ category = null, newOnly = false }: ProductListProps) {
  const pageSize = newOnly ? NEW_COLLECTION_SIZE : PAGE_SIZE;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Snapshot do último documento foi guardado, não o valor de createdAt.
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    async function fetchFirstPage() {
      try {
        const q = query(collection(db, 'products'), ...buildConstraints(category, null, pageSize));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs;
        const data = docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];

        let lastDoc: QueryDocumentSnapshot | null = null;
        if (docs.length > 0) {
          lastDoc = docs[docs.length - 1];
        }

        setProducts(data);
        setCursor(lastDoc);
        // A coleção nova é recorte fechado: não há "carregar mais" nela.
        setHasMore(!newOnly && docs.length === pageSize);
        setLoading(false);
      } catch {
        setError('Não foi possível carregar os produtos.');
        setLoading(false);
      }
    }

    fetchFirstPage();
  }, [category, newOnly, pageSize]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      const q = query(collection(db, 'products'), ...buildConstraints(category, cursor, pageSize));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const data = docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];

      let lastDoc = cursor;
      if (docs.length > 0) {
        lastDoc = docs[docs.length - 1];
      }

      setProducts((current) => [...current, ...data]);
      setCursor(lastDoc);
      setHasMore(docs.length === pageSize);
      setLoadingMore(false);
    } catch {
      setError('Não foi possível carregar mais produtos.');
      setLoadingMore(false);
    }
  };

  // Categoria vence a coleção nova: `/?colecao=novidades&categoria=roupas` é
  // "o que chegou em roupas", e o cabeçalho tem que dizer isso.
  let heading = 'Populares';
  let subheading = 'Confira os produtos mais populares e tendenciosos.';

  if (category !== null) {
    heading = category;
    subheading = newOnly
      ? `Novidades em ${category}.`
      : `Produtos da categoria ${category}.`;
  } else if (newOnly) {
    heading = 'Coleção nova';
    subheading = 'O que acabou de chegar na loja.';
  }

  return (
    <section id="produtos" className="mt-6 px-4 md:px-8" aria-labelledby="products-heading">
      <div className="max-w-7xl mx-auto">
        <div className="pt-4 mb-8 md:mb-12">
          <h2 id="products-heading" className={`text-2xl font-bold ${BRAND} capitalize`}>
            {heading}
          </h2>
          <p className={`text-base ${BRAND} mt-2`}>{subheading}</p>
        </div>

        {loading && <p className="text-center py-12">Carregando produtos...</p>}
        {!loading && error && products.length === 0 && (
          <p className={`text-center py-12 ${DANGER}`}>{error}</p>
        )}
        {!loading && !error && products.length === 0 && (
          <p className="text-center py-12">Nenhum produto encontrado nesta categoria.</p>
        )}

        {products.length > 0 && (
          <>
            <ProductGrid products={products} />

            {error && <p className={`text-center pt-8 ${DANGER}`}>{error}</p>}

            {hasMore && (
              <div className="text-center pt-10">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className={`px-6 py-2.5 text-sm font-semibold rounded-md cursor-pointer ${CARD} ${BRAND} border ${BORDER} transition-colors ${PINK_HOVER} disabled:cursor-not-allowed ${DISABLED_SUBTLE} ${FOCUS}`}
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
