import { type CartItem } from "../types/cart";
import { Trash, Minus, Plus } from 'lucide-react';

export function CartItemRow ({
    item,
    onRemove,
    onQuantityChange,
}: {
    item: CartItem;
    onRemove: (sku: string) => void;
    onQuantityChange: (sku: string, quantity: number) => void;
}) 

{
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