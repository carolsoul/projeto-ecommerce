import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Order, TrackingEvent } from '../../types/order';
import { paymentPresentation, fulfillmentPresentation, FULFILLMENT_STATUS, nextStatusesFor } from '../../lib/orderStatus';
import { postJson, ApiError } from '../../lib/api';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

/**
 * Tela de trabalho do admin — /admin/orders/:orderId
 *
 * Onde ele vê o que embalar, para onde mandar, e registra o evento de entrega.
 * 
 */
const eventSchema = z.object({
    status: z.string().min(1, { message: 'Status é obrigatório' }),
    description: z.string().optional(),
    location: z.string().optional(),
    'tracking-code': z.string().optional(),
    carrier: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

type Phase = 'loading' | 'ready' | 'missing' | 'denied' | 'error';

export default function AdmOrderDetails() {
    const { orderId } = useParams<{ orderId: string }>();
    const [events, setEvents] = useState<TrackingEvent[]>([]);
    const [eventsFailed, setEventsFailed] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const idempotencyKey = useRef<string | null>(null);
    const [phase, setPhase] = useState<Phase>('loading');
    const paymentIssue = order?.paymentIssue ?? null;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { isSubmitting, errors },
    } = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
    });

    const selectedStatus = watch('status');

    const onSubmitSuccess: SubmitHandler<EventFormData> = async (data) => {
        if (!orderId) return;

        if (!idempotencyKey.current) {
            idempotencyKey.current = crypto.randomUUID();
        }

        const payload = {
            orderId,
            status: data.status,
            description: data.description,
            location: data.location,
            trackingCode: data['tracking-code'],
            carrier: data.carrier,
            idempotencyKey: idempotencyKey.current,
        };

        try {
            await postJson('/api/admin/orders/tracking', payload);
            // Reseta o formulário e limpa a chave de idempotência após o envio bem-sucedido
            reset();
            idempotencyKey.current = null;
        } catch (error) {
            if (error instanceof ApiError) {
                alert(`Erro: ${error.message}`);
            } else {
                alert('Erro desconhecido ao registrar evento.');
            }
        }
    }

    useEffect(() => {
        if (!orderId) {
            setPhase('missing');
            return;
        }

        const trackingQuery = query(
            collection(db, 'orders', orderId, 'tracking'),
            orderBy('occurredAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            trackingQuery,
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

        const unsubscribeOrder = onSnapshot(
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

        return () => {
            unsubscribe();
            unsubscribeOrder();
        };
    }, [orderId]);

    // Daqui pra baixo, order existe
    if (phase !== 'ready' || order === null) {
        return (
            <main className="bg-gray-50 px-4 py-8 md:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <div className="max-w-3xl">
                            <h1 className="mb-4 text-2xl font-bold text-slate-900">Detalhes do pedido</h1>
                            <p className="text-sm text-slate-600">
                                {phase === 'loading'
                                    ? 'Carregando...'
                                    : phase === 'missing'
                                        ? 'Pedido não encontrado.'
                                        : phase === 'denied'
                                            ? 'Sem permissão para ler este pedido. Confirme que seu uid está na coleção admins/ e que as regras do Firestore foram publicadas.'
                                            : 'Não foi possível carregar o pedido. Veja o console para o motivo.'}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="bg-gray-50 px-4 py-8 md:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="max-w-3xl">
                        <h1 className="mb-4 text-2xl font-bold text-slate-900">Detalhes do pedido</h1>
                        <p className="text-sm text-slate-600">Veja e gerencie os detalhes deste pedido</p>
                    </div>
                </div>

                <div className='mt-8 rounded-lg border border-slate-300 bg-white p-8 text-slate-600'>
                    <h3 className='text-sm font-semibold text-slate-900'>Pedido #{orderId}</h3>

                    <p className='mt-2 text-sm flex items-center gap-4'>Status:  
                        <span className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${paymentPresentation(order.status).className}`}>
                            {paymentPresentation(order.status).label}
                        </span>
                    </p>

                    <p className='mt-2 text-sm flex items-center gap-4'>Entrega: 
                        <span className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${fulfillmentPresentation(order.fulfillment?.status).className}`}>
                            {fulfillmentPresentation(order.fulfillment?.status).label}
                        </span>
                    </p>

                    {paymentIssue && (
                        <p className='mt-2 text-sm text-red-600'>Problema de pagamento: <span className='font-semibold'>{paymentIssue && 'Valor pago não cobriu o total, revise antes de despachar'}</span></p>
                    )}

                    <p className='mt-3 text-sm text-slate-600'> Data do pedido: {' '}
                        {order.createdAt
                            ? dateFormatter.format(order.createdAt.toDate())
                            : 'Desconhecida'}
                    </p>
                </div>

                <div className='mt-8 rounded-lg border border-slate-300 bg-white p-8 text-slate-600'>
                    <h3 className='text-lg font-semibold text-slate-900'>Endereço de entrega</h3>
                    <p className='mt-2 text-sm'>
                        {order.address.recipient}<br />
                        {order.address.street}, {order.address.number} {order.address.complement && `- ${order.address.complement}`}<br />
                        {order.address.neighborhood}<br />
                        {order.address.city} - {order.address.state}<br />
                        CEP: {order.address.cep}<br />
                        Telefone: {order.address.phone}
                    </p>

                    <button className='mt-4 px-3.5 py-2 text-slate-900 text-sm font-medium rounded-md bg-white border border-slate-300 hover:bg-slate-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500' onClick={() => {
                        const addressText = `${order.address.recipient}\n${order.address.street}, ${order.address.number}${order.address.complement ? ` - ${order.address.complement}` : ''}\n${order.address.neighborhood}\n${order.address.city} - ${order.address.state}\nCEP: ${order.address.cep}\nTelefone: ${order.address.phone}`;
                        navigator.clipboard.writeText(addressText);
                    }}>
                        Copiar endereço
                    </button>
                </div>

                <div className='mt-8 rounded-lg border border-slate-300 bg-white p-8 text-slate-600'>
                    <h3 className='text-lg font-semibold text-slate-900'>Itens do Pedido</h3>
                    <br />
                    <table className='min-w-full rounded-lg border border-slate-200'>
                        <thead className='bg-gray-100 whitespace-nowrap text-slate-900 text-left text-sm font-semibold'>
                            <tr>
                                <th scope='col' className='px-4 py-3'>SKU</th>
                                <th scope='col' className='px-4 py-3'>Produto</th>
                                <th scope='col' className='px-4 py-3'>Quantidade</th>
                            </tr>
                        </thead>
                        <tbody className='whitespace-nowrap text-sm divide-y divide-slate-200'>
                            {order.items.map((item) => (
                                <tr key={item.sku}>
                                    <td className='px-4 py-3 text-slate-900 font-medium'>{item.sku}</td>
                                    <td className='px-4 py-3 text-slate-900 font-medium'>{item.name}</td>
                                    <td className='px-4 py-3 text-slate-900 font-medium'>{item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className='mt-8 rounded-lg border border-slate-300 bg-white p-8 text-slate-600'>
                    <h3 className='text-lg font-semibold text-slate-900'>Valores</h3>

                    <p className='mt-2 text-sm'>Subtotal: {order.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <p className='mt-2 text-sm'>Frete: {order.shipping.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <p className='mt-2 text-sm'>Taxa: {order.tax.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <p className='mt-2 text-sm font-semibold'>Total: 
                        <span className='font-bold text-green-600'> {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} </span>
                    </p>
                </div>

                <div className='mt-8 rounded-lg border border-slate-300 bg-white p-8 text-slate-600'>
                    <h3 className='text-lg font-semibold text-slate-900'>Pagamento</h3>
                    <p className='mt-2 text-sm'>Método: {order.paymentMethod}</p>
                    <p className='mt-2 text-sm'>ID do Pagamento: {order.mercadopagoPaymentId}</p>
                </div>

                <div className='mt-8 rounded-lg border border-slate-300 bg-white p-8 text-slate-600'>
                    <h3 className='text-lg font-semibold text-slate-900'>Linha do Tempo</h3>
                    {eventsFailed ? (
                        <p className='mt-2 text-sm text-red-600'>
                            Não foi possível carregar a linha do tempo. Veja o console para o motivo.
                        </p>
                    ) : events.length === 0 ? (
                        <p className='mt-2 text-sm'>Nenhum evento registrado.</p>
                    ) : (
                        <ol className='flex flex-col items-center justify-center w-max mt-6 px-4 md:px-8' aria-label='Progress'>
                            {events.map((event) => (
                                <li key={event.id} className='flex items-center flex-col relative'>
                                    <div className='absolute top-0 left-full ml-4 w-max'>
                                        <span className='block text-[10px] font-semibold text-slate-400 mb-0.5'>
                                            {event.occurredAt ? dateFormatter.format(event.occurredAt.toDate()) : 'Desconhecida'}
                                        </span>
                                        <p className='text-sm font-semibold text-slate-900'>
                                            {fulfillmentPresentation(event.status).label}
                                        </p>
                                        <p className='mt-1 text-sm text-slate-600'>
                                            {event.description || 'Sem descrição'}
                                        </p>
                                        <p className='mt-1 text-sm text-slate-600'>
                                            Localização: {event.location || 'Não informada'}
                                        </p>
                                        <p className='mt-1 text-sm text-slate-600'>
                                            Fonte: {event.source || 'Desconhecida'}
                                        </p>
                                    </div>

                                    <div className='w-7 h-7 shrink-0 border-2 border-green-600 bg-transparent flex items-center justify-center rounded-full'>

                                        <svg xmlns="http://www.w3.org/2000/svg" className='w-3.5 h-3.5 fill-green-600' viewBox='0 0 24 24' aria-hidden='true'>
                                            <path
                                                d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
                                        </svg>

                                        </div>
                                        {/* Ajustar para status diferentes. delivery_failed deve ser vermelho */}
                                        <div className='w-0.5 h-16 bg-green-600' aria-hidden='true'></div>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>

                <div className='mt-8 p-8 text-slate-600'>
                    <h3 className='text-lg font-semibold text-slate-900'>Registrar Evento de Entrega</h3>
                    <p className='mt-2 text-sm'>Aqui você pode registrar um novo evento de entrega para este pedido.</p>

                    <form onSubmit={handleSubmit(onSubmitSuccess)}>
                        <fieldset>

                            <div className='space-y-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
                                <div>
                                    <label htmlFor="fulfillment-status" className='block text-sm font-medium text-slate-700 inline-block mb-2'>
                                        Novo status do pedido
                                    </label>

                                    <div className='flex items-center w-min bg-white rounded-md outline-1 -outline-offset-1 outline-slate-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-600 relative shrink-0 px-0.5 border-r border-slate-300'>
                                        <select {...register('status')} aria-invalid={errors.status ? 'true' : undefined} aria-describedby={errors.status ? 'status-error' : undefined} id="status" className='appearance-none pl-3 pr-8 py-2 text-sm text-slate-900 bg-transparent outline-none cursor-pointer'>
                                            <option value="">Escolha um status</option>
                                            {nextStatusesFor(order.fulfillment?.status).map((s) => (
                                                <option key={s} value={s}>
                                                    {fulfillmentPresentation(s).label}
                                                </option>
                                            ))}
                                        </select>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="size-6 fill-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M7 10l5 5 5-5z"/>
                                        </svg>
                                    </div>
                                    <p id="status-error" className="text-red-500 text-sm" role="alert">
                                        {errors.status?.message}
                                    </p>
                                    <br />

                                    <label htmlFor="description">Descrição</label>

                                    <input
                                    {...register('description')}
                                    type="text" id="description" className='flex items-center w-min p-1 bg-white rounded-md outline-1 -outline-offset-1 outline-slate-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-600 relative shrink-0 px-0.5 border-r border-slate-300' />

                                    <label htmlFor="location">Localização</label>
                                    <input 
                                    {...register('location')}
                                    type="text" id="location" className='flex items-center w-min p-1 bg-white rounded-md outline-1 -outline-offset-1 outline-slate-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-600 relative shrink-0 px-0.5 border-r border-slate-300'/>

                                    {selectedStatus === 'shipped' && (
                                        <>
                                            <label htmlFor="tracking-code">Código de rastreio</label>
                                            <input 
                                            {...register('tracking-code')}
                                            type="text" id="tracking-code" className='mt-2 block w-full rounded-md border border-slate-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm' aria-invalid={errors['tracking-code'] ? true : false} aria-describedby={errors['tracking-code']? `tracking-code-error` : undefined} />

                                            <label htmlFor="carrier">Transportadora</label>
                                            <input 
                                            {...register('carrier')}
                                            type="text" id="carrier" className='mt-2 block w-full rounded-md border border-slate-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm' aria-invalid={errors['carrier'] ? true : false} aria-describedby={errors['carrier']? `carrier-error` : undefined} />
                                        </>
                                    )}

                                </div>
                            </div>
                        </fieldset>

                        <div className="mt-8">
                            <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full px-3.5 py-2 text-white text-sm font-semibold rounded-md cursor-pointer bg-blue-600 hover:bg-blue-700 border border-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                            {isSubmitting ? 'Salvando...' : 'Continuar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
