import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/useCart';
import { CartItemRow } from '../components/CartItemRow';
import {
  BORDER,
  BRAND,
  BRAND_BG,
  BRAND_BG_HOVER,
  CARD,
  CREAM,
  FOCUS,
  MUTED,
} from '../lib/theme';

export default function Cart() {
  const navigate = useNavigate();
  const { items, loading, removeItem, updateQuantity } = useCart();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return (
      <main className={`${CREAM} px-4 py-10 md:px-8`}>
        <p className={`text-center ${MUTED}`}>Carregando carrinho...</p>
      </main>
    );
  }

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Seu carrinho está vazio. Adicione produtos antes de continuar para o pagamento.');
      return;
    }
    navigate('/checkout');
  };

  return (
    <main className={`${CREAM} px-4 py-10 md:px-8`}>
      <div className="mx-auto max-w-7xl">
        <h1 className={`font-serif text-4xl font-bold italic ${BRAND}`}>Carrinho</h1>

        {items.length === 0 ? (
          <p className={`py-20 text-center ${MUTED}`}>Seu carrinho está vazio.</p>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* ── Produtos ── */}
            <section className="lg:col-span-2">
              <h2 className="sr-only">Produtos no carrinho</h2>
              
              <div
                className={`${CARD} mb-3 hidden rounded-2xl px-6 py-3 sm:grid sm:grid-cols-[minmax(0,26rem)_1fr_8rem_6rem_3rem] sm:gap-6`}
              >
                <span className={`text-xs font-bold uppercase tracking-wide ${MUTED}`}>
                  Produto
                </span>
                <span aria-hidden="true" />
                <span className={`text-center text-xs font-bold uppercase tracking-wide ${MUTED}`}>
                  Quantidade
                </span>
                <span className={`text-center text-xs font-bold uppercase tracking-wide ${MUTED}`}>
                  Valor
                </span>
                <span className={`text-center text-xs font-bold uppercase tracking-wide ${MUTED}`}>
                  Remover
                </span>
              </div>

              <ul className="space-y-3">
                {items.map((item) => (
                  <CartItemRow
                    key={item.sku}
                    item={item}
                    onRemove={removeItem}
                    onQuantityChange={updateQuantity}
                  />
                ))}
              </ul>
            </section>

            {/* ── Resumo ── */}
            <aside className={`${CARD} h-max rounded-2xl p-6 lg:sticky lg:top-24`}>
              <h2 className={`text-lg font-semibold ${BRAND}`}>Resumo do pedido</h2>

              <dl className={`mt-6 border-t ${BORDER} pt-4`}>
                <div className="flex items-center justify-between gap-4">
                  <dt className={`text-sm font-medium ${MUTED}`}>Subtotal</dt>
                  <dd className={`text-sm font-semibold ${BRAND}`}>R${subtotal.toFixed(2)}</dd>
                </div>
              </dl>

              <p className={`mt-4 text-xs ${MUTED}`}>
                Entrega e taxa são calculadas no checkout, depois do endereço.
              </p>

              <button
                type="button"
                onClick={handleCheckout}
                className={`mt-6 w-full rounded-full ${BRAND_BG} ${BRAND_BG_HOVER} cursor-pointer px-4 py-3 text-sm font-semibold text-white transition-colors ${FOCUS}`}
              >
                Continuar para o pagamento
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
