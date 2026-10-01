import { useEffect, useMemo, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useAuth } from '../context/useAuth';
import type { Order, OrderStatus } from '../types/order';
import { OrderHistoryItem } from '../components/OrderHistoryItem';

type Phase = 'loading' | 'ready' | 'unauthenticated' | 'missing' | 'denied' | 'empty';

const ORDERS_SCAN_LIMIT = 10;

const STATUS = {
  paid: {
    label: 'Pago',
    className: 'bg-emerald-100 text-emerald-700',
  },
  awaiting_payment: {
    label: 'Aguardando pagamento',
    className: 'bg-amber-100 text-amber-700',
  },
  pending: {
    label: 'Pendente',
    className: 'bg-blue-100 text-slate-700',
  },
  failed: {
    label: 'Falhou',
    className: 'bg-red-100 text-red-700',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-gray-100 text-gray-700',
  },
} as const satisfies Record<OrderStatus, { label: string; className: string }>;

const STATUS_KEYS = Object.keys(STATUS) as OrderStatus[];

/**
 * Para status que o front não conhece, campo corrompido, ou um status novo no servidor não cair em pendente
 */
const UNKNOWN_STATUS = {
  label: 'Status desconhecido',
  className: 'bg-slate-100 text-slate-700',
} as const;

const BUTTON_BASE =
  'px-3.5 py-2 text-sm font-medium rounded-md border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
const BUTTON_IDLE = 'bg-white text-slate-900 border-slate-300 hover:bg-slate-100';
const BUTTON_ACTIVE = 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const [phase, setPhase] = useState<Phase>('loading');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    if (authLoading) {
      setPhase('loading');
      return;
    }

    if (!user) {
      setPhase('unauthenticated');
      setOrders([]);
      return;
    }

    const ordersQuery = query(
      collection(db, 'orders'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(ORDERS_SCAN_LIMIT),
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const nextOrders = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Order
        );

        setOrders(nextOrders);
        setPhase(nextOrders.length > 0 ? 'ready' : 'empty');
      },
      (error) => {
        console.error('Não foi possível carregar os pedidos:', error);
        setOrders([]);
        setPhase(error.code === 'permission-denied' ? 'denied' : 'missing');
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  // O filtro roda em memória porque a lista inteira já está aqui
  const visibleOrders = useMemo(
    () =>
      selectedStatus === 'all'
        ? orders
        : orders.filter((order) => order.status === selectedStatus),
    [orders, selectedStatus]
  );

  if (phase === 'loading') {
    return (
      <main className="bg-gray-50 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-slate-600">Carregando pedidos...</p>
        </div>
      </main>
    );
  }

  if (phase === 'unauthenticated') {
    return (
      <main className="bg-gray-50 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-slate-600">Faça login para ver seus pedidos.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="mb-4 text-2xl font-bold text-slate-900">Histórico de pedidos</h1>
            <p className="text-sm text-slate-600">Veja e gerencie seus últimos pedidos</p>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-8">
          <div
            className="flex flex-wrap items-center gap-3"
            role="group"
            aria-label="Filtrar pedidos por status"
          >
            <span className="text-sm font-medium text-slate-600">Filtrar por:</span>

            <button
              type="button"
              aria-pressed={selectedStatus === 'all'}
              onClick={() => setSelectedStatus('all')}
              className={`${BUTTON_BASE} ${selectedStatus === 'all' ? BUTTON_ACTIVE : BUTTON_IDLE}`}
            >
              Todos os pedidos
            </button>

            {STATUS_KEYS.map((statusKey) => (
              <button
                key={statusKey}
                type="button"
                aria-pressed={selectedStatus === statusKey}
                onClick={() => setSelectedStatus(statusKey)}
                className={`${BUTTON_BASE} ${selectedStatus === statusKey ? BUTTON_ACTIVE : BUTTON_IDLE}`}
              >
                {STATUS[statusKey].label}
              </button>
            ))}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            {phase === 'denied'
              ? 'Você não tem permissão para ver estes pedidos. Tente sair e entrar de novo.'
              : phase === 'missing'
                ? 'Não conseguimos carregar seus pedidos agora. Recarregue a página em alguns instantes.'
                : 'Você ainda não possui pedidos.'}
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            Nenhum pedido com esse status.
          </div>
        ) : (
          <>
            <ul className="mt-6 space-y-6">
              {visibleOrders.map((order) => {
                const orderStatus = STATUS[order.status] ?? UNKNOWN_STATUS;
                const items = order.items ?? [];
                const pieces = items.reduce((total, item) => total + item.quantity, 0);

                return (
                  <li
                    key={order.id}
                    className="overflow-hidden rounded-lg border border-slate-300 bg-white p-6"
                  >
                    <div className="flex flex-wrap justify-between gap-6">
                      <div className="max-w-3xl">
                        <div className="flex items-center gap-4">
                          <h3 className="text-sm font-semibold text-slate-900">
                            Pedido #{order.id}
                          </h3>
                          <span
                            className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${orderStatus.className}`}
                          >
                            {orderStatus.label}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                          Data do pedido:{' '}
                          {order.createdAt
                            ? dateFormatter.format(order.createdAt.toDate())
                            : 'Carregando...'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-900">
                          {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <p className="mt-3 text-sm text-slate-600">
                          {pieces} {pieces === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                    </div>

                    <hr className="my-6 border-slate-300" />

                    <ul className="flex flex-wrap items-center gap-8">
                      {items.map((item) => (
                        <li key={item.sku} className="flex items-center gap-4">
                          <OrderHistoryItem item={item} />
                        </li>
                      ))}
                      <li className='mt-6 flex flex-wrap gap-4'>
                        {["Ver  datalhes", "Pedir novamente"].map((action) => (
                          <a
                            key={action}
                            href='#'
                            className='flex items-center gap-2.5 px-3.5 py-2 text-slate-900 text-sm font-medium rounded-md bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
                          > 
                          {action}
                          </a>
                        ))}
                      </li>
                    </ul>
                  </li>
                );
              })}
            </ul>

            

            {orders.length === ORDERS_SCAN_LIMIT && (
              <p className="mt-6 text-center text-sm text-slate-500">
                Mostrando apenas os {ORDERS_SCAN_LIMIT} pedidos mais recentes.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
