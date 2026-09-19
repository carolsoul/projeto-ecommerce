import { Link } from 'react-router-dom';
import { Trash } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useWishlist } from '../context/useWishlist';
import { useCart } from '../context/useCart';
import { getDiscountPercentage } from '../utils/pricing';
import { type WishlistItem } from '../types/wishlist';
import { type Product } from '../types/products';

function WishlistRow({
  item,
  onRemove,
  onAddToCart,
}: {
  item: WishlistItem;
  onRemove: (sku: string) => void;
  onAddToCart: (item: WishlistItem) => void;
}) {
  const discount = item.mrp != null ? getDiscountPercentage(item.price, item.mrp) : null;

  return (
    <li className="flex flex-col gap-6 py-6 sm:items-center sm:flex-row">
      <Link to={`/produto/${item.sku}`} className="w-32 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
        <img
          src={item.imageUrl}
          alt={item.name}
          width={128}
          height={128}
          loading="lazy"
          decoding="async"
          className="w-full aspect-square object-contain"
        />
      </Link>

      <div className="flex items-start gap-4 w-full">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-2">
            <Link to={`/produto/${item.sku}`} className="hover:text-blue-600 transition-colors">
              {item.name}
            </Link>
          </h3>

          <p className="text-slate-900 font-semibold text-sm">
            {item.mrp != null && (
              <span className="mr-1.5 text-slate-600 line-through">R${item.mrp.toFixed(2)}</span>
            )}
            R${item.price.toFixed(2)}
            {discount !== null && (
              <span className="ml-2 text-red-600 font-bold">-{discount}%</span>
            )}
          </p>

          <button
            type="button"
            onClick={() => onRemove(item.sku)}
            className="mt-4 font-medium text-red-600 text-sm flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <Trash size={18} />
            Remover
          </button>
        </div>

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => onAddToCart(item)}
            className="px-4 py-2.5 text-white text-sm font-semibold rounded-md cursor-pointer bg-blue-600 hover:bg-blue-700 border border-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </li>
  );
}

export default function Wishlist() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading, removeItem } = useWishlist();
  const { addItem } = useCart();

  const handleAddToCart = (item: WishlistItem) => {
    // A wishlist guarda o suficiente para virar um item de carrinho sem uma
    // segunda leitura no Firestore.
    const product: Product = {
      id: item.sku,
      name: item.name,
      imageUrl: item.imageUrl,
      price: item.price,
      mrp: item.mrp,
      rating: 0,
      reviewCount: 0,
    };

    addItem(product);
  };

  if (authLoading) {
    return <p className="text-center py-20">Carregando...</p>;
  }

  if (!user) {
    return (
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Favoritos</h1>
        <p className="text-slate-600 mb-6">Entre na sua conta para ver os produtos que você salvou.</p>
        <Link
          to="/login"
          state={{ from: '/wishlist' }}
          className="inline-block px-6 py-2.5 text-white text-sm font-semibold rounded-md bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Entrar
        </Link>
      </main>
    );
  }

  return (
    <main className="mt-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-2 border-b border-slate-300 pb-4">
          <h1 className="text-2xl font-bold text-slate-900 flex-1">Favoritos</h1>
          <p className="text-base text-slate-900 font-medium">{items.length} Itens</p>
        </div>

        {loading && <p className="text-center py-20">Carregando favoritos...</p>}

        {!loading && items.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-600 mb-6">Você ainda não salvou nenhum produto.</p>
            <Link
              to="/"
              className="inline-block px-6 py-2.5 text-sm font-semibold rounded-md bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Explorar produtos
            </Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <ul className="divide-y divide-slate-300">
            {items.map((item) => (
              <WishlistRow
                key={item.sku}
                item={item}
                onRemove={removeItem}
                onAddToCart={handleAddToCart}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
