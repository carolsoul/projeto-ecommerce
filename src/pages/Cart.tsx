import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/useCart';
import { type CartItem } from '../types/cart';
import { Trash, Minus, Plus } from 'lucide-react';

function CartItemRow ({
    item,
    onRemove,
    onQuantityChange,
}: {
    item: CartItem;
    onRemove: (sku: string) => void;
    onQuantityChange: (sku: string, quantity: number) => void;
}) {
    return (
        <li className="flex flex-col gap-6 py-6 sm:items-center sm:flex-row">
            <div className="w-32 h-full shrink-0">
                <img
                    src={item.imageUrl}
                    alt={item.name}
                    width={128}
                    height={128}
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-full object-contain"
                />
            </div>

            <div className="flex items-start gap-4 w-full">
                <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2">{item.name}</h3>

                <div className="mt-4 flex flex-wrap gap-4">
                    <button type="button" onClick={() => onRemove(item.sku)} className="font-medium text-red-600 text-sm flex items-center gap-2 shrink-0 cursor-pointer">
                        <Trash />
                        Remover
                    </button>
                </div>
            </div>

            <div className="ml-auto text-right">
                <div className="flex items-center w-max mt-auto px-2.5 py-1.5 border border-slate-300 text-slate-900 font-medium text-xs rounded-md">
                    <button type="button" aria-label="Decrease quantity" onClick={() => onQuantityChange(item.sku, item.quantity - 1)} className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded" >
                        <Minus />
                    </button>
                    <span className="mx-3">{item.quantity}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => onQuantityChange(item.sku, item.quantity + 1)} className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded" >
                        <Plus />
                    </button>
                </div>

            <div className="mt-6">
                <p className="text-base font-semibold text-slate-900">
                    R${(item.price * item.quantity).toFixed(2)}
                </p>
                </div>
                </div>
            </div>
        </li>   
    )
}

export default function Cart() {
    const navigate = useNavigate();
    const { items, loading, removeItem, updateQuantity } = useCart();
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (loading) {
        return <p className='text-center py-20'>Carregando carrinho...</p>
    }

    const handleCheckout = () => {
        if (items.length === 0) {
            alert('Seu carrinho está vazio. Adicione produtos antes de continuar para o pagamento.');
            return;
        }
        navigate('/checkout');
    }
    return (
        <main className="mt-6 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex gap-2 border-b border-slate-300 pb-4">
                    <h1 className="text-2xl font-bold text-slate-900 flex-1">Carrinho</h1>
                    <p className="text-base text-slate-900 font-medium">{items.length} Itens</p>
                </div>

                {items.length === 0 ? (
                    <p className='text-center py-20 text-slate-600'>Seu carinho está vazio.</p>
                ) : (
                    <div className='grid lg:grid-cols-3 gap-12'>
                        <ul className='lg:col-span-2 divide-y divide-slate-300'>
                            {items.map((item) => (
                                <CartItemRow key={item.sku} item={item} onRemove={removeItem} onQuantityChange={updateQuantity} />
                            ))}
                        </ul>

                        <div className='lg:p-6 lg:pr-0 h-full lg:border-l lg:border-slate-300 lg:sticky lg:top-0'>
                            <h3 className='text-lg font-semibold text-slate-900 border-b border-slate-300 pb-4'>Recibo</h3>

                            <ul className="text-slate-600 font-medium divide-y divide-slate-300 mt-4">
                                <li className="flex flex-wrap gap-4 text-sm py-3">
                                    Subtotal
                                     <span className="ml-auto font-semibold text-slate-900">R${subtotal.toFixed(2)}</span>
                                </li>
                            </ul>

                            {/* Entrega e taxa NÃO aparecem aqui de propósito. O frete
                                depende da UF do endereço e a taxa é calculada em
                                api/_lib/pricing.ts — reproduzir essa conta no
                                navegador significaria duas fontes da verdade sobre
                                dinheiro, e a do cliente sempre acabaria desatualizada. */}
                            <p className='mt-4 text-xs text-slate-500'>
                                Entrega e taxa são calculadas no checkout, depois do endereço.
                            </p>

                            <div className='mt-6 space-y-3 text-center'>
                                <button type='button' className='w-full px-4 py-2.5 text-white text-sm font-semibold rounded-md cursor-pointer bg-blue-600 hover:bg-blue-700 border border-blue-600' onClick={handleCheckout}>
                                    Continuar para o pagamento
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}