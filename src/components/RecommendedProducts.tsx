import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type Product } from '../types/products';
import ProductCard from './ProductCard';
import { BRAND, DANGER, MUTED } from '../lib/theme';

/**
 * Quantos cards exibir. Busca um a mais porque o produto da própria página pode
 * estar entre os mais bem avaliados e é descartado depois.
 */
const RECOMMENDED_SIZE = 8;

interface RecommendedProductsProps {
  /** Produto da página atual, que não deve aparecer na própria recomendação. */
  excludeSku: string;
}

/**
 * Os mais bem avaliados do catálogo.
 *
 * `orderBy('rating', 'desc')` sozinho — índice de campo único, que o Firestore
 * cria automaticamente. Nenhuma entrada nova em `firestore.indexes.json`.
 *
 * O produto atual é removido aqui e não na consulta porque o Firestore não tem
 * operador "diferente de" combinável com ordenação por outro campo.
 */
async function loadTopRated(excludeSku: string): Promise<Product[]> {
  const snapshot = await getDocs(
    query(collection(db, 'products'), orderBy('rating', 'desc'), limit(RECOMMENDED_SIZE + 1))
  );

  const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];

  return products.filter((product) => product.id !== excludeSku).slice(0, RECOMMENDED_SIZE);
}

/** O resultado carregado, marcado com o SKU que o originou. */
interface Loaded {
  sku: string;
  products: Product[];
  error: string | null;
}

export default function RecommendedProducts({ excludeSku }: RecommendedProductsProps) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let active = true;

    loadTopRated(excludeSku)
      .then((found) => {
        if (active) setLoaded({ sku: excludeSku, products: found, error: null });
      })
      .catch((loadError) => {
        console.error('Não foi possível carregar as recomendações:', loadError);
        if (active) {
          setLoaded({
            sku: excludeSku,
            products: [],
            error: 'Não foi possível carregar as recomendações.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [excludeSku]);

  // "Carregando" é DERIVADO de o resultado em mão ser deste SKU, em vez de um `setLoading(true)` no corpo do efeito. Navegar entre produtos troca o `sku` sem remontar o componente, e o estado derivado volta a "carregando" sozinho, sem o setState sincronizado que a regra `set-state-in-effect` proíbe.
  const current = loaded !== null && loaded.sku === excludeSku ? loaded : null;
  const loading = current === null;
  const products = current === null ? [] : current.products;
  const error = current === null ? null : current.error;

  if (!loading && error === null && products.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="recommended-heading">
      <h2 id="recommended-heading" className={`text-4xl font-bold ${BRAND}`}>
        Você pode gostar
      </h2>
      <p className={`mt-2 text-sm ${MUTED}`}>Os produtos mais bem avaliados da loja.</p>

      {loading && <p className={`mt-6 text-sm ${MUTED}`}>Carregando recomendações...</p>}

      {!loading && error !== null && <p className={`mt-6 text-sm ${DANGER}`}>{error}</p>}

      {products.length > 0 && (
        <ul
          className="mt-6 -mx-1.5 flex gap-2 overflow-x-auto px-1.5 pb-4 snap-x snap-mandatory"
          role="list"
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              className="w-44 shrink-0 snap-start sm:w-52"
            />
          ))}
        </ul>
      )}
    </section>
  );
}
