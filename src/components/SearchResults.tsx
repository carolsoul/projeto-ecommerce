import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type Product } from '../types/products';
import { collectCategories, matchesSearch } from '../utils/search';
import CategoryFilter from './CategoryFilter';
import ProductGrid from './ProductGrid';
import { BORDER, BRAND, DANGER, MUTED } from '../lib/theme';

// O Firestore não faz busca por texto parcial. Foi carregado um recorte do catálogo uma vez e filtrado em memória, o que permite buscar no meio da palavra e ignorar acento.
const SEARCH_FETCH_LIMIT = 300;

interface SearchResultsProps {
  searchTerm: string;
}

export default function SearchResults({ searchTerm }: SearchResultsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const q = query(
          collection(db, 'products'),
          orderBy('createdAt', 'desc'),
          limit(SEARCH_FETCH_LIMIT)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];

        setProducts(data);
        setLoading(false);
      } catch {
        setError('Não foi possível buscar os produtos.');
        setLoading(false);
      }
    }

    fetchCatalog();
  }, []);

  const matches = products.filter((product) => matchesSearch(product, searchTerm));
  const categories = collectCategories(matches);
  const isSelectionValid = selectedCategory !== null && categories.includes(selectedCategory);
  const activeCategory = isSelectionValid ? selectedCategory : null;

  let visible = matches;
  if (activeCategory !== null) {
    visible = matches.filter((product) => {
      const category = product.category;
      if (typeof category !== 'string') return false;
      return category.trim() === activeCategory;
    });
  }

  return (
    <section className="mt-6 px-4 md:px-8" aria-labelledby="search-heading">
      <div className="max-w-7xl mx-auto">
        <div className={`border-b ${BORDER} pb-4 mb-8`}>
          <h1 id="search-heading" className={`text-2xl font-bold ${BRAND}`}>
            Resultados para "{searchTerm}"
          </h1>
          {!loading && !error && (
            <p className={`text-base ${MUTED} mt-2`}>
              {visible.length === 1 ? '1 produto encontrado' : `${visible.length} produtos encontrados`}
            </p>
          )}
        </div>

        {loading && <p className="text-center py-12">Buscando...</p>}
        {!loading && error && <p className={`text-center py-12 ${DANGER}`}>{error}</p>}

        {!loading && !error && (
          <div className="lg:grid lg:grid-cols-[13rem_1fr] lg:gap-8 lg:items-start">
            <aside className="lg:sticky lg:top-20">
              <CategoryFilter
                categories={categories}
                selected={activeCategory}
                onSelect={setSelectedCategory}
              />
            </aside>

            <div>
              {visible.length === 0 ? (
                <p className={`text-center py-12 ${MUTED}`}>
                  Nenhum produto encontrado para "{searchTerm}". Tente outro termo.
                </p>
              ) : (
                <ProductGrid products={visible} />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
