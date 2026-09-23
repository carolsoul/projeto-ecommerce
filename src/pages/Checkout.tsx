import { useState } from 'react';
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

const RADIO_CLASS =
  'w-[18px] h-[18px] appearance-none rounded-full border border-slate-300 bg-white focus:outline-blue-500 checked:ring-2 checked:ring-inset checked:ring-white checked:bg-blue-600 cursor-pointer';

type PaymentMethod = 'card' | 'pix';

interface SavedAddress {
  id: string;
  data: AddressFormData;
}

export default function Checkout() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading, removeItem, updateQuantity } = useCart();

  const [address, setAddress] = useState<SavedAddress | null>(null);
  const [totals, setTotals] = useState<OrderTotals | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return <p className='text-center py-20'>Autenticando usuário...</p>
  }

  // Prévia apenas visual, enquanto não há endereço. Frete, taxa e total só
  // existem depois que o servidor calcula — não são reproduzidos aqui.
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

    try {
      // 1. Cria o pedido no seu banco (Mantendo sua idempotência perfeitamente intacta)
      const result = await postJson<{ orderId: string }>('/api/checkout/create-order', {
        addressId: address.id,
        paymentMethod,
        idempotencyKey: crypto.randomUUID(),
      });

      const createdId = result.orderId;
      setOrderId(createdId);

      // 2. PLUG DO MERCADO PAGO: Chama a rota intermediária para gerar o checkout na Sandbox
      // Esta rota também se beneficia do token injetado pelo passo 1
      const preference = await postJson<{ url: string }>('/api/checkout/create-preference', {
        orderId: createdId,
      });

      // 3. Redireciona o comprador para a tela segura de sandbox do Mercado Pago
      if (preference.url) {
        window.location.href = preference.url;
      } else {
        throw new Error('Não foi possível gerar o link de pagamento.');
      }

    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível processar o pagamento.'
      );
    } finally {
      setBusy(false);
    }
};


  if (loading) {
    return <p className="text-center py-20">Carregando carrinho...</p>;
  }

  return (
    <main>
      <h1 className="sr-only">Finalizar compra</h1>

      <div className="px-4 md:px-8 mt-6">
        <div className="max-w-xl mx-auto lg:max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* ── Entrega e pagamento ── */}
            <section className="w-full h-max">
              {orderId !== null ? (
                <div className="rounded-md border border-green-200 bg-green-50 p-6">
                  <h2 className="text-xl text-slate-900 font-semibold mb-2">Pedido criado</h2>
                  <p className="text-sm text-slate-700">
                    Número do pedido: <span className="font-mono font-semibold">{orderId}</span>
                  </p>
                  <p className="text-sm text-slate-600 mt-4">
                    A cobrança será feita na próxima etapa, quando a integração com o provedor de
                    pagamento estiver ligada.
                  </p>
                </div>
              ) : address === null ? (
                <>
                  <AddressForm onSubmitSuccess={handleAddressSubmit} />
                  {busy && <p className="mt-4 text-sm text-slate-600">Calculando o pedido...</p>}
                </>
              ) : (
                <>
                  <div className="flex items-start gap-4 pb-8 border-b border-slate-300">
                    <div className="flex-1">
                      <h2 className="text-xl text-slate-900 font-semibold mb-4">Entregar em</h2>
                      <p className="text-sm text-slate-700">
                        {address.data.recipient} — {address.data.phone}
                      </p>
                      <p className="text-sm text-slate-700">
                        {address.data.street}, {address.data.number}
                        {address.data.complement ? ` — ${address.data.complement}` : ''}
                      </p>
                      <p className="text-sm text-slate-700">
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
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                      Alterar
                    </button>
                  </div>

                  <fieldset className="mt-8">
                    <legend className="text-xl text-slate-900 font-semibold mb-6">
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
                          className="ml-4 flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-900"
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
                          className="ml-4 flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-900"
                        >
                          <QrCode size={20} />
                          Pix
                        </label>
                      </div>
                    </div>

                    {/* Os dados do cartão NÃO são coletados aqui: receber número
                        de cartão no próprio formulário coloca o projeto dentro
                        do escopo de PCI-DSS. O provedor entrega campos
                        hospedados, e o servidor só vê um token. */}
                    <div className="mt-8 rounded-md bg-slate-50 border border-slate-200 p-4">
                      <p className="text-sm text-slate-700">
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
                      className="w-full px-3.5 py-2 text-white text-sm font-semibold rounded-md cursor-pointer bg-blue-600 hover:bg-blue-700 border border-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {busy
                        ? 'Criando pedido...'
                        : `Finalizar pedido — R$${(totals?.total ?? 0).toFixed(2)}`}
                    </button>
                  </div>
                </>
              )}

              {error && (
                <p role="alert" className="mt-4 text-sm text-red-600">
                  {error}
                </p>
              )}
            </section>

            {/* ── Resumo do pedido ── */}
            <section className="bg-gray-100 -order-1 p-6 md:p-8 lg:order-none">
              <h2 className="sr-only">Resumo do pedido</h2>

              {items.length === 0 ? (
                <p className="text-sm text-slate-600 text-center py-8">Seu carrinho está vazio.</p>
              ) : (
                <>
                  <div className="space-y-6">
                    {items.map((item, index) => (
                      <div key={item.sku} className="space-y-6">
                        <OrderSummaryItem
                          item={item}
                          onRemove={removeItem}
                          onQuantityChange={updateQuantity}
                        />
                        {index < items.length - 1 && <hr className="border-slate-300" />}
                      </div>
                    ))}
                  </div>

                  <hr className="border-slate-300 my-6" />
                </>
              )}

              <ul className="text-slate-500 font-medium space-y-4">
                <li className="flex flex-wrap gap-4 text-sm">
                  Subtotal
                  <span className="ml-auto font-semibold text-slate-900">
                    R${(totals?.subtotal ?? previewSubtotal).toFixed(2)}
                  </span>
                </li>
                <li className="flex flex-wrap gap-4 text-sm">
                  Entrega
                  <span className="ml-auto font-semibold text-slate-900">
                    {totals === null ? 'a calcular' : `R$${totals.shipping.toFixed(2)}`}
                  </span>
                </li>
                <li className="flex flex-wrap gap-4 text-sm">
                  Taxa (3%)
                  <span className="ml-auto font-semibold text-slate-900">
                    {totals === null ? 'a calcular' : `R$${totals.tax.toFixed(2)}`}
                  </span>
                </li>
                <li>
                  <hr className="border-slate-300" />
                </li>
                <li className="flex flex-wrap gap-4 text-sm font-semibold text-slate-900">
                  Total
                  <span className="ml-auto">
                    {totals === null ? '—' : `R$${totals.total.toFixed(2)}`}
                  </span>
                </li>
              </ul>

              {totals === null && items.length > 0 && (
                <p className="mt-4 text-xs text-slate-500">
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
