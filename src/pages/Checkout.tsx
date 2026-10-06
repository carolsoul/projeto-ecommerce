import { useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { CreditCard, QrCode } from 'lucide-react';
import { db } from '../lib/firebase';
import { postJson } from '../lib/api';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/useCart';
import { AddressForm } from '../components/AddressForm';
import { OrderSummaryItem } from '../components/OrderSummaryItem';
import type { AddressFormData } from '../schemas/addressSchema';
import type { OrderTotals } from '../types/order';
import { BORDER, BRAND, BRAND_BG, BRAND_BG_HOVER, BRAND_BORDER, BRAND_HOVER, CARD, CREAM, DANGER, DISABLED, DISABLED_BORDER, FOCUS, MUTED, OUTLINE_FOCUS, RING_GAP } from '../lib/theme';


const RADIO_CLASS =
  `w-[18px] h-[18px] appearance-none rounded-full border ${BORDER} ${CARD} ${OUTLINE_FOCUS} checked:ring-2 checked:ring-inset checked:${RING_GAP} checked:${BRAND_BG} cursor-pointer`;

type PaymentMethod = 'card' | 'pix';

interface SavedAddress {
  id: string;
  data: AddressFormData;
}

export default function Checkout() {
  const { user, loading: authLoading } = useAuth();
  // Sem `removeItem` nem `updateQuantity`: o resumo desta etapa é só leitura.
  const { items, loading } = useCart();

  const [address, setAddress] = useState<SavedAddress | null>(null);
  const [totals, setTotals] = useState<OrderTotals | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  // Prévia apenas visual, enquanto não há endereço.
  const previewSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleAddressSubmit = async (data: AddressFormData) => {
    if (!user) return;

    setError(null);
    setBusy(true);

    let saved: SavedAddress | null = null;
    let failure: unknown = null;

    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'addresses'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      saved = { id: ref.id, data };

      // O servidor recalcula tudo a partir do carrinho e deste endereço.
      const quote = await postJson<OrderTotals>('/api/checkout/quote', { addressId: ref.id });
      setTotals(quote);
    } catch (err) {
      failure = err;
    }

    setBusy(false);

    if (failure || saved === null) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Não foi possível calcular o pedido. Tente novamente.'
      );
      return;
    }

    setAddress(saved);
  };

  const handleCreateOrder = async () => {
    if (address === null) return;

    setError(null);
    setBusy(true);

    // A chave fica no ref e sobrevive a uma tentativa que falhou: repetir o clique reaproveita o mesmo pedido em vez de criar um segundo.
    if (idempotencyKey.current === null) {
      idempotencyKey.current = crypto.randomUUID();
    }

    let createdId: string | null = null;
    let checkoutUrl: string | null = null;
    let failure: unknown = null;

    try {
      // 1. Cria o pedido com os valores recalculados no servidor.
      const order = await postJson<{ orderId: string }>('/api/checkout/create-order', {
        addressId: address.id,
        paymentMethod,
        idempotencyKey: idempotencyKey.current,
      });
      createdId = order.orderId;

      // 2. Troca o pedido pelo link do checkout do Mercado Pago. O servidor lê o total do próprio pedido.
      const preference = await postJson<{ url: string }>('/api/checkout/create-preference', {
        orderId: order.orderId,
      });
      checkoutUrl = preference.url;
    } catch (err) {
      failure = err;
    }

    if (checkoutUrl !== null) {
      // Comprador sai do site. Os dados do cartão são digitados no domínio do Mercado Pago.
      window.location.href = checkoutUrl;
      return;
    }

    setBusy(false);

    if (createdId !== null) setOrderId(createdId);

    const message =
      failure instanceof Error ? failure.message : 'Não foi possível processar o pagamento.';
    setError(message);
  };


  if (loading) {
    return <p className="text-center py-20">Carregando carrinho...</p>;
  }

  if (authLoading) {
    return <p className='text-center py-20'>Autenticando usuário...</p>
  }

  return (
    <main className={`${CREAM} pb-10`}>
      <h1 className="sr-only">Finalizar compra</h1>

      <div className="px-4 md:px-8 pt-6">
        <div className="max-w-xl mx-auto lg:max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* ── Entrega e pagamento ── */}
            <section className="w-full h-max">
              {orderId !== null ? (
                <div className={`rounded-md border ${BORDER} ${CARD} p-6`}>
                  <h2 className={`text-xl ${BRAND} font-semibold mb-2`}>
                    Pedido criado, pagamento não iniciado
                  </h2>
                  <p className={`text-sm ${MUTED}`}>
                    Número do pedido: <span className="font-mono font-semibold">{orderId}</span>
                  </p>
                  <p className={`text-sm ${MUTED} mt-4`}>
                    O pedido está guardado, mas não conseguimos abrir a tela de pagamento. Tente de
                    novo — nenhum pedido duplicado será criado.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setOrderId(null);
                      setError(null);
                    }}
                    className={`mt-6 px-3.5 py-2 text-white text-sm font-semibold rounded-md cursor-pointer ${BRAND_BG} ${BRAND_BG_HOVER} ${FOCUS}`}
                  >
                    Tentar pagar novamente
                  </button>
                </div>
              ) : address === null ? (
                <>
                  <AddressForm onSubmitSuccess={handleAddressSubmit} />
                  {busy && <p className={`mt-4 text-sm ${MUTED}`}>Calculando o pedido...</p>}
                </>
              ) : (
                <>
                  <div className={`flex items-start gap-4 pb-8 border-b ${BORDER}`}>
                    <div className="flex-1">
                      <h2 className={`text-xl ${BRAND} font-semibold mb-4`}>Entregar em</h2>
                      <p className={`text-sm ${MUTED}`}>
                        {address.data.recipient} — {address.data.phone}
                      </p>
                      <p className={`text-sm ${MUTED}`}>
                        {address.data.street}, {address.data.number}
                        {address.data.complement ? ` — ${address.data.complement}` : ''}
                      </p>
                      <p className={`text-sm ${MUTED}`}>
                        {address.data.neighborhood}, {address.data.city}/{address.data.state} —{' '}
                        {address.data.cep}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAddress(null);
                        setTotals(null);
                      }}
                      className={`text-sm font-medium ${BRAND} ${BRAND_HOVER} ${FOCUS} rounded`}
                    >
                      Alterar
                    </button>
                  </div>

                  <fieldset className="mt-8">
                    <legend className={`text-xl ${BRAND} font-semibold mb-6`}>
                      Forma de pagamento
                    </legend>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="method"
                          id="payment-card"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                          className={RADIO_CLASS}
                        />
                        <label
                          htmlFor="payment-card"
                          className={`ml-4 flex items-center gap-2 cursor-pointer text-sm font-medium ${BRAND}`}
                        >
                          <CreditCard size={20} />
                          Cartão de crédito
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="method"
                          id="payment-pix"
                          value="pix"
                          checked={paymentMethod === 'pix'}
                          onChange={() => setPaymentMethod('pix')}
                          className={RADIO_CLASS}
                        />
                        <label
                          htmlFor="payment-pix"
                          className={`ml-4 flex items-center gap-2 cursor-pointer text-sm font-medium ${BRAND}`}
                        >
                          <QrCode size={20} />
                          Pix
                        </label>
                      </div>
                    </div>

                    <div className={`mt-8 rounded-md ${CARD} border ${BORDER} p-4`}>
                      <p className={`text-sm ${MUTED}`}>
                        {paymentMethod === 'card'
                          ? 'Os dados do cartão serão preenchidos na tela segura do provedor de pagamento.'
                          : 'O código Pix será gerado após a confirmação do pedido.'}
                      </p>
                    </div>
                  </fieldset>

                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={handleCreateOrder}
                      disabled={busy || totals === null || items.length === 0}
                      className={`w-full px-3.5 py-2 text-white text-sm font-semibold rounded-md cursor-pointer ${BRAND_BG} ${BRAND_BG_HOVER} border ${BRAND_BORDER} disabled:cursor-not-allowed ${DISABLED} ${DISABLED_BORDER} ${FOCUS}`}
                    >
                      {busy
                        ? 'Criando pedido...'
                        : `Finalizar pedido — R$${(totals?.total ?? 0).toFixed(2)}`}
                    </button>
                  </div>
                </>
              )}

              {error && (
                <p role="alert" className={`mt-4 text-sm ${DANGER}`}>
                  {error}
                </p>
              )}
            </section>

            {/* ── Resumo do pedido ── */}
            <section className={`${CARD} -order-1 p-4 md:p-3 lg:order-none rounded-2xl`}>
              <h2 className="sr-only">Resumo do pedido</h2>

              {items.length === 0 ? (
                <p className={`text-sm ${MUTED} text-center py-8`}>Seu carrinho está vazio.</p>
              ) : (
                <>
                  <div className="space-y-6">
                    {items.map((item, index) => (
                      <div key={item.sku} className="space-y-6">
                        <OrderSummaryItem item={item} />
                        {index < items.length - 1 && <hr className={`${BORDER}`} />}
                      </div>
                    ))}
                  </div>

                  <hr className={`${BORDER} my-6`} />
                </>
              )}

              <ul className={`${MUTED} font-medium space-y-4`}>
                <li className="flex flex-wrap gap-4 text-sm">
                  Subtotal
                  <span className={`ml-auto font-semibold ${BRAND}`}>
                    R${(totals?.subtotal ?? previewSubtotal).toFixed(2)}
                  </span>
                </li>
                <li className="flex flex-wrap gap-4 text-sm">
                  Entrega
                  <span className={`ml-auto font-semibold ${BRAND}`}>
                    {totals === null ? 'a calcular' : `R$${totals.shipping.toFixed(2)}`}
                  </span>
                </li>
                <li className="flex flex-wrap gap-4 text-sm">
                  Taxa
                  <span className={`ml-auto font-semibold ${BRAND}`}>
                    {totals === null ? 'a calcular' : `R$${totals.tax.toFixed(2)}`}
                  </span>
                </li>
                <li>
                  <hr className={`${BORDER}`} />
                </li>
                <li className={`flex flex-wrap gap-4 text-sm font-semibold ${BRAND}`}>
                  Total
                  <span className="ml-auto">
                    {totals === null ? '—' : `R$${totals.total.toFixed(2)}`}
                  </span>
                </li>
              </ul>

              {totals === null && items.length > 0 && (
                <p className={`mt-4 text-xs ${MUTED}`}>
                  O frete depende do endereço de entrega. Os valores finais são calculados no
                  servidor.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
