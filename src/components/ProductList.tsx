import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type Product } from '../types/products';
import ProductCard from './ProductCard';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];
        setProducts(data);
      } catch (err) {
        setError('Não foi possível carregar os produtos.');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <section className="mt-6 px-4 md:px-8" aria-labelledby="products-heading">
      <div className="max-w-7xl mx-auto">
        <div className="border-b border-slate-300 pb-4 mb-8 md:mb-12">
          <h2 id="products-heading" className="text-2xl font-bold text-slate-900">
            Populares
          </h2>
          <p className="text-base text-slate-600 mt-2">Confira os produtos mais populares e tendenciosos.</p>
        </div>

        {loading && <p className="text-center py-12">Carregando produtos...</p>}
        {!loading && error && <p className="text-center py-12 text-red-600">{error}</p>}
        {!loading && !error && products.length === 0 && (
          <p className="text-center py-12">Nenhum produto encontrado.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}