import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { useAuth } from '../context/useAuth';
import type { Order, TrackingEvent } from '../types/order';
import { OrderItemImage } from '../components/OrderItemImage';
import { fulfillmentPresentation, paymentPresentation, remainingSteps } from '../lib/orderStatus';
import { useParams } from 'react-router-dom';

type Phase = 'loading' | 'ready' | 'unauthenticated' | 'missing' | 'denied' | 'error';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function OrderTracking() {
    const { user, loading: authLoading } = useAuth();
    const [phase, setPhase] = useState<Phase>('loading');
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [events, setEvents] = useState<TrackingEvent[]>([]);
    const [eventsFailed, setEventsFailed] = useState(false);

    useEffect(() => {
        if (authLoading) {
            setPhase('loading');
            return;
        }

        if (!user) {
            setPhase('unauthenticated');
            setOrder(null);
            return;
        }

        if (!orderId) {
            setPhase('missing');
            setOrder(null);
            return;
        }

        const unsubscribe = onSnapshot(
            doc(db, 'orders', orderId),
            (snapshot) => {
                if (!snapshot.exists()) {
                    setOrder(null);
                    setPhase('missing');
                    return;
                }

                setOrder({ id: snapshot.id, ...snapshot.data() } as Order);
                setPhase('ready');
            },
            // callback
            (error) => {
                console.error('Não foi possível carregar o pedido:', error);
                setOrder(null);
                setPhase(error.code === 'permission-denied' ? 'denied' : 'error');
            }
        );

        const eventsRef = collection(db, 'orders', orderId, 'tracking');
        const eventsQuery = query(eventsRef, orderBy('occurredAt', 'desc'));

        const unsubscribeEvents = onSnapshot(
            eventsQuery,
            (snapshot) => {
                const data = snapshot.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                })) as TrackingEvent[];

                setEvents(data);
                setEventsFailed(false);
            },
            // callback
            (error) => {
                console.error('Não foi possível carregar a linha do tempo:', error);
                setEvents([]);
                setEventsFailed(true);
            }
        );
        return () => {
            unsubscribe();
            unsubscribeEvents();
        }
    }, [authLoading, user, orderId]);

    if (phase === 'loading') {
        return <p>Carregando...</p>;
    }

    if (phase === 'unauthenticated') {
        return <p>Você precisa estar logado para acessar esta página.</p>;
    }

    if (phase === 'missing') {
        return <p>Pedido não encontrado.</p>;
    }

    if (phase === 'denied') {
        return <p>Você não tem permissão para acessar este pedido.</p>;
    }

    if (phase === 'error') {
        return <p>Ocorreu um erro ao carregar o pedido. Por favor, tente novamente mais tarde.</p>;
    }

    if (!order) {
        return <p>Pedido não encontrado.</p>;
    }

    const futureSteps = [...remainingSteps(order.fulfillment?.status)].reverse();

    return (
        <main className='mt-6 px-4 md:px-8'>
            <div className='max-w-6xl max-lg:max-w-2xl mx-auto'>

                <div>
                    <h1 className='text-2xl font-bold text-slate-900'>Rastreamento do Pedido</h1>
                    <p className='text-base text-slate-600 mt-4'>
                        ID do pedido: <span className='font-medium text-slate-900'>{order.id}</span>
                    </p>

                    {/* Os dois eixos, lado a lado: pagamento e entrega são
                        independentes, e o cliente quer ver os dois de saída. */}
                    <div className='mt-4 flex flex-wrap items-center gap-3'>
                        <span className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${paymentPresentation(order.status).className}`}>
                            {paymentPresentation(order.status).label}
                        </span>
                        <span className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${fulfillmentPresentation(order.fulfillment?.status).className}`}>
                            {fulfillmentPresentation(order.fulfillment?.status).label}
                        </span>
                    </div>
                </div>

                <div className='grid gap-x-10 gap-y-12 mt-12 lg:grid-cols-3'>

                    {/* COLUNA DA ESQUERDA */}
                    <div className='lg:col-span-2'>

                        {/* Info produtos */}
                        <section aria-labelledby='products-heading'>
                            <h2 id='products-heading' className='sr-only'>
                                Produtos
                            </h2>

                            <ul className='divide-y divide-slate-300' role='list'>
                                {order.items.map((item) => (
                                    <li key={item.sku} className='grid items-center gap-4 p-4 sm:grid-cols-3'>
                                        <div className='col-span-2 flex items-center gap-4'>
                                            <OrderItemImage item={item} className='w-20 h-20' size={80} />
                                            <div>
                                                <h3 className='text-sm font-semibold text-slate-900'>{item.name}</h3>
                                                <p className='text-xs font-medium text-slate-600 mt-2'>Quantidade: <span className='font-medium'>{item.quantity}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className='sm:ml-auto'>
                                            {/* lineTotal, não unitPrice: é o valor desta linha do
                                                pedido, já multiplicado pela quantidade. */}
                                            <p className='text-sm font-semibold text-slate-900'>{currency(item.lineTotal)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Info de pagamento */}

                        <section className='bg-gray-100 rounded-md p-6 h-max mt-8' aria-labelledby='billing-heading'>
                            <h2 id='billing-heading' className='text-base font-semibold text-slate-900 border-b border-slate-300 pb-2'>
                                Detalhes de Pagamento
                            </h2>
                            <ul className='font-medium mt-6 space-y-4' role='list'>

                                <li className='flex flex-wrap gap-4 text-slate-600 text-sm'>Subtotal:
                                    <span className='ml-auto text-slate-900 font-semibold'>
                                        {order.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </li>

                                <li className='flex flex-wrap gap-4 text-slate-600 text-sm'>Frete: 
                                    <span className='ml-auto text-slate-900 font-semibold'>
                                        {order.shipping.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </li>

                                <li className='flex flex-wrap gap-4 text-slate-600 text-sm'>Taxa: 
                                    <span className='ml-auto text-slate-900 font-semibold'>
                                        {order.tax.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </li>

                                <hr className='border-slate-300'/>

                                <li className='text-sm flex flex-wrap gap-4 text-slate-900 font-semibold'>Total: 
                                    <span className='ml-auto'> {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} </span>
                                </li>
                            </ul>
                        </section>
                    </div>

                    {/* COLUNA DA DIREITA */}

                    {/*Linha do tempo */}
                    <aside className='lg:border-l lg:border-slate-300 lg:pl-10 pl-4 h-full' aria-labelledby='timeline-heading'>
                        <h2 id="timeline-heading" className="sr-only">Rastreamento do pedido</h2>
                        {eventsFailed ? (
                            <p className='mt-2 text-sm text-red-600'>Não foi possível carregar o rastreamento do pedido.</p>
                        ) : events.length === 0 && futureSteps.length === 0 ? (
                            <p className='mt-2 text-sm'>Nenhum evento registrado</p>
                        ) : (
                            <>
                                {(order.fulfillment?.status === 'delivery_failed' || order.fulfillment?.status === 'returned') && (
                                    <div className='mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
                                        {fulfillmentPresentation(order.fulfillment?.status).label} — entre em contato com o suporte.
                                    </div>
                                )}

                                <ol className='relative border-s border-slate-300' aria-current='step'>
                                    {futureSteps.map((status) => {
                                        const { label, icon: Icon } = fulfillmentPresentation(status);

                                        return (
                                            <li key={status} className='mb-10 ms-7 opacity-50'>
                                                <span className='absolute -start-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 ring-8 ring-white'>
                                                    <Icon className='size-4' aria-hidden='true' />
                                                </span>
                                                <p className='mb-0.5 text-sm text-slate-500'>Previsto</p>
                                                <p className='text-base font-medium text-slate-500'>{label}</p>
                                            </li>
                                        );
                                    })}

                                    {events.map((event) => {
                                        const { label, className, icon: Icon } = fulfillmentPresentation(event.status);
                                        const occurredAt = event.occurredAt?.toDate() ?? null;

                                        return (
                                            <li key={event.id} className='mb-10 ms-7'>
                                                <span className={`absolute -start-3.5 flex h-7 w-7 items-center justify-center rounded-full ring-8 ring-white ${className}`}>
                                                    <Icon className='size-4' aria-hidden='true' />
                                                </span>

                                                <p className='mb-0.5 text-sm text-slate-600'>
                                                    {occurredAt ? (
                                                        <time dateTime={occurredAt.toISOString()}>
                                                            {dateFormatter.format(occurredAt)}
                                                        </time>
                                                    ) : (
                                                        'Registrando...'
                                                    )}
                                                </p>

                                                <p className='text-base font-semibold text-slate-900'>{label}</p>

                                                {event.description && (
                                                    <p className='text-sm font-normal text-slate-600'>{event.description}</p>
                                                )}

                                                {event.location && (
                                                    <p className='mt-1 text-xs text-slate-500'>{event.location}</p>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ol>
                            </>
                        )}
                    </aside>
                </div>
            </div>
        </main>
    );
}