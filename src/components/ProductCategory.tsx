import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type Product } from '../types/products';
import { collectCategoryTiles, type CategoryTile } from '../utils/search';
import { BORDER, BRAND, FOCUS, HOVER_BRAND, MUTED } from '../lib/theme';

const CATEGORY_SCAN_LIMIT = 300;

interface ProductCategoryProps {
  /** Categoria ativa vinda da URL, para destacar o card correspondente. */
  activeCategory: string | null;
}

export default function ProductCategory({ activeCategory }: ProductCategoryProps) {
  const [tiles, setTiles] = useState<CategoryTile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const q = query(
          collection(db, 'products'),
          orderBy('createdAt', 'desc'),
          limit(CATEGORY_SCAN_LIMIT)
        );
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];

        setTiles(collectCategoryTiles(products));
        setLoading(false);
      } catch {
        setTiles([]);
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading || tiles.length === 0) return null;

  return (
    <section className="px-4 md:px-8 mt-6" aria-labelledby="category-heading">
      <div className="max-w-7xl mx-auto">
        <div className="pb-4 flex items-center gap-4">
          <h2 id="category-heading" className={`text-2xl font-bold ${BRAND} flex-1`}>
            Categorias
          </h2>

          {activeCategory !== null && (
            <Link
              to="/"
              className={`text-sm font-medium ${MUTED} ${HOVER_BRAND} transition-colors`}
            >
              Ver tudo
            </Link>
          )}
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 sm:gap-8 gap-4 gap-y-8">
          {tiles.map((tile) => {
            const isActive = tile.name === activeCategory;

            return (
              <li key={tile.name}>
                <Link
                  to={`/?categoria=${encodeURIComponent(tile.name)}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`block ${FOCUS} rounded`}
                >
                  <div className={`mt-4 p-1 text-center rounded-xl border ${BORDER}`}>
                    <h3
                      className={`text-sm font-semibold capitalize ${isActive ? BRAND : MUTED}`}
                    >
                      {tile.name}
                    </h3>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
