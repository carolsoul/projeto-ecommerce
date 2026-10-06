import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useWishlist } from '../context/useWishlist';
import { useCart } from '../context/useCart';
import { getDiscountPercentage } from '../utils/pricing';
import { type WishlistItem } from '../types/wishlist';
import {
  BRAND,
  BRAND_BG,
  BRAND_BG_HOVER,
  CARD,
  CREAM,
  FOCUS,
  MUTED,
  ROUND_BUTTON,
} from '../lib/theme';

/**
 * Uma linha dos favoritos.
 */
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
    <li
      className={`${CARD} flex flex-wrap items-center gap-4 rounded-2xl px-4 py-3 sm:grid sm:grid-cols-[minmax(0,26rem)_1fr_12rem_8rem_3rem] sm:items-center sm:gap-6 sm:px-6 sm:py-4`}
    >
      <div className="flex min-w-0 flex-1 basis-48 items-center gap-4">
        <Link
          to={`/produto/${item.sku}`}
          className={`size-36 shrink-0 overflow-hidden rounded-xl`}
        >
          <img
            src={item.imageUrl}
            alt={item.name}
            width={144}
            height={144}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        </Link>

        <div className="min-w-0">
          <h3 className={`text-sm font-semibold ${BRAND}`}>
            <Link to={`/produto/${item.sku}`} className={`hover:underline ${FOCUS} rounded`}>
              {item.name}
            </Link>
          </h3>
          <p className={`mt-1 truncate text-xs ${MUTED}`}>{item.sku}</p>
        </div>
      </div>

      <div aria-hidden="true" className="hidden sm:block" />

      <div className="flex shrink-0 items-center gap-2 sm:justify-center">
        {item.mrp != null && (
          <span className={`text-xs line-through ${MUTED}`}>R${item.mrp.toFixed(2)}</span>
        )}
        <span className={`text-sm font-semibold ${BRAND}`}>R${item.price.toFixed(2)}</span>
        {discount !== null && (
          <span className={`text-xs font-bold ${BRAND}`}>-{discount}%</span>
        )}
      </div>

      <div className="flex w-full shrink-0 items-center justify-between gap-3 sm:contents">
        <button
          type="button"
          onClick={() => onAddToCart(item)}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full ${BRAND_BG} ${BRAND_BG_HOVER} px-4 py-2 text-xs font-semibold text-white transition-colors ${FOCUS} sm:justify-self-center`}
        >
          <ShoppingBag size={14} />
          Adicionar
        </button>

        <button
          type="button"
          aria-label={`Remover ${item.name} dos favoritos`}
          onClick={() => onRemove(item.sku)}
          className={`${ROUND_BUTTON} sm:justify-self-center`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

export default function Wishlist() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading, removeItem } = useWishlist();
  const { addItem } = useCart();

  const handleAddToCart = (item: WishlistItem) => {
    addItem({
      id: item.sku,
      name: item.name,
      imageUrl: item.imageUrl,
      price: item.price,
    });
  };

  if (authLoading) {
    return (
      <main className={`${CREAM} px-4 py-10 md:px-8`}>
        <p className={`text-center ${MUTED}`}>Carregando...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={`${CREAM} px-4 py-10 md:px-8`}>
        <div className="mx-auto max-w-7xl">
          <h1 className={`font-serif text-4xl font-bold italic ${BRAND}`}>Favoritos</h1>

          <div className={`${CARD} mt-8 rounded-2xl p-10 text-center`}>
            <p className={`${MUTED} mb-6 text-sm`}>
              Entre na sua conta para ver os produtos que você salvou.
            </p>
            <Link
              to="/login"
              state={{ from: '/wishlist' }}
              className={`inline-block rounded-full ${BRAND_BG} ${BRAND_BG_HOVER} px-6 py-3 text-sm font-semibold text-white transition-colors ${FOCUS}`}
            >
              Entrar
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`${CREAM} px-4 py-10 md:px-8`}>
      <div className="mx-auto max-w-7xl">
        <h1 className={`font-serif text-4xl font-bold italic ${BRAND}`}>Favoritos</h1>

        {loading && <p className={`py-20 text-center ${MUTED}`}>Carregando favoritos...</p>}

        {!loading && items.length === 0 && (
          <div className={`${CARD} mt-8 rounded-2xl p-10 text-center`}>
            <p className={`${MUTED} mb-6 text-sm`}>Você ainda não salvou nenhum produto.</p>
            <Link
              to="/"
              className={`inline-block rounded-full ${BRAND_BG} ${BRAND_BG_HOVER} px-6 py-3 text-sm font-semibold text-white transition-colors ${FOCUS}`}
            >
              Explorar produtos
            </Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <section className="mt-8">
            <h2 className="sr-only">Produtos salvos</h2>

            <div
              className={`${CARD} mb-3 hidden rounded-2xl px-6 py-3 sm:grid sm:grid-cols-[minmax(0,26rem)_1fr_12rem_8rem_3rem] sm:gap-6`}
            >
              <span className={`text-xs font-bold uppercase tracking-wide ${MUTED}`}>
                Produto
              </span>
              <span aria-hidden="true" />
              <span className={`text-center text-xs font-bold uppercase tracking-wide ${MUTED}`}>
                Preço
              </span>
              <span className={`text-center text-xs font-bold uppercase tracking-wide ${MUTED}`}>
                Carrinho
              </span>
              <span className={`text-center text-xs font-bold uppercase tracking-wide ${MUTED}`}>
                Remover
              </span>
            </div>
            <ul className="space-y-3">
              {items.map((item) => (
                <WishlistRow
                  key={item.sku}
                  item={item}
                  onRemove={removeItem}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
