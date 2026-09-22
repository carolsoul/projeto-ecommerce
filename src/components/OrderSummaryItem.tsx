import { Minus, Plus, Trash2 } from 'lucide-react';
import { type CartItem } from '../types/cart';

interface OrderSummaryItemProps {
  item: CartItem;
  onRemove: (sku: string) => void;
  onQuantityChange: (sku: string, quantity: number) => void;
}

/**
 * Item do carrinho na coluna de resumo do checkout.
 *
 * É um componente separado do CartItemRow de propósito: os dois mostram os
 * mesmos dados, mas em layouts bem diferentes — aqui a imagem tem 96px e tudo
 * é compacto para caber numa coluna lateral, enquanto o CartItemRow ocupa a
 * largura da página do carrinho. Não é duplicação de lógica, é outra
 * apresentação.
 */
export function OrderSummaryItem({ item, onRemove, onQuantityChange }: OrderSummaryItemProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="w-24 h-24 shrink-0 bg-gray-50 p-2 rounded-md">
        <img
          src={item.imageUrl}
          alt={item.name}
          width={96}
          height={96}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="w-full flex justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
          <p className="text-sm text-slate-900 font-semibold mt-4">
            R${(item.price * item.quantity).toFixed(2)}
          </p>
        </div>

        <div className="flex flex-col justify-between items-end gap-4">
          <button
            type="button"
            aria-label={`Remover ${item.name} do carrinho`}
            onClick={() => onRemove(item.sku)}
            className="text-red-600 w-max shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <Trash2 size={16} />
          </button>

          <div className="flex items-center w-max mt-auto px-2.5 py-1.5 border border-slate-300 text-slate-900 font-medium text-xs rounded-md">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              onClick={() => onQuantityChange(item.sku, item.quantity - 1)}
              className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              <Minus size={12} />
            </button>
            <span className="mx-3">{item.quantity}</span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              onClick={() => onQuantityChange(item.sku, item.quantity + 1)}
              className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
