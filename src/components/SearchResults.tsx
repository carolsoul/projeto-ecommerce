import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type Product } from '../types/products';
import { collectCategories, matchesSearch } from '../utils/search';
import CategoryFilter from './CategoryFilter';
import ProductGrid from './ProductGrid';

// O Firestore não faz busca por texto parcial: não existe "contém". Por isso
// carregamos um recorte do catálogo uma vez e filtramos em memória, o que
// permite buscar no meio da palavra e ignorar acento. O teto abaixo é o limite
// honesto dessa abordagem — passando disso, o certo é indexar em algo como
// Algolia ou Typesense em vez de aumentar o número.
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

  // A categoria escolhida é validada contra o que existe nos resultados atuais.
  // Assim, trocar a busca descarta sozinho um filtro que não se aplica mais —
  // sem precisar de um efeito para limpar o estado.
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
        <div className="border-b border-slate-300 pb-4 mb-8">
          <h1 id="search-heading" className="text-2xl font-bold text-slate-900">
            Resultados para "{searchTerm}"
          </h1>
          {!loading && !error && (
            <p className="text-base text-slate-600 mt-2">
              {visible.length === 1 ? '1 produto encontrado' : `${visible.length} produtos encontrados`}
            </p>
          )}
        </div>

        {loading && <p className="text-center py-12">Buscando...</p>}
        {!loading && error && <p className="text-center py-12 text-red-600">{error}</p>}

        {!loading && !error && (
          // Desktop: filtro em coluna à esquerda dos resultados.
          // Mobile: filtro em faixa horizontal acima deles.
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
                <p className="text-center py-12 text-slate-600">
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
