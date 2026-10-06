import { Minus, Plus, Trash2 } from 'lucide-react';
import { type CartItem } from '../types/cart';
import { BRAND, CARD, MUTED, ROUND_BUTTON } from '../lib/theme';

export function CartItemRow({
  item,
  onRemove,
  onQuantityChange,
}: {
  item: CartItem;
  onRemove: (sku: string) => void;
  onQuantityChange: (sku: string, quantity: number) => void;
}) {
  const lineTotal = `R$${(item.price * item.quantity).toFixed(2)}`;

  return (
    <li
      className={`${CARD} relative grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-2 rounded-2xl px-4 py-4 sm:grid-cols-[minmax(0,26rem)_1fr_8rem_6rem_3rem] sm:items-center sm:gap-6 sm:px-6`}
    >
      <div className="contents sm:flex sm:min-w-0 sm:items-center sm:gap-4">
        <div className="row-span-2 size-24 shrink-0 overflow-hidden rounded-xl sm:size-36">
          <img
            src={item.imageUrl}
            alt={item.name}
            width={144}
            height={144}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        </div>

        <div className="min-w-0 pr-8 sm:pr-0">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h3 className={`text-sm font-semibold ${BRAND}`}>{item.name}</h3>
            {/* Preço ao lado do nome só no mobile. */}
            <p className={`text-sm font-semibold ${BRAND} sm:hidden`}>{lineTotal}</p>
          </div>
          <p className={`mt-1 truncate text-xs ${MUTED}`}>{item.sku}</p>
        </div>
      </div>

      <div aria-hidden="true" className="hidden sm:block" />

      <div className="flex shrink-0 items-center gap-2 sm:justify-center">
        <button
          type="button"
          aria-label={`Diminuir quantidade de ${item.name}`}
          onClick={() => onQuantityChange(item.sku, item.quantity - 1)}
          className={ROUND_BUTTON}
        >
          <Minus size={14} />
        </button>

        <span className={`w-5 text-center text-sm font-semibold ${BRAND}`}>{item.quantity}</span>

        <button
          type="button"
          aria-label={`Aumentar quantidade de ${item.name}`}
          onClick={() => onQuantityChange(item.sku, item.quantity + 1)}
          className={ROUND_BUTTON}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Preço em coluna própria só a partir de `sm`. */}
      <p className={`hidden text-center text-sm font-semibold ${BRAND} sm:block`}>{lineTotal}</p>

      <button
        type="button"
        aria-label={`Remover ${item.name} do carrinho`}
        onClick={() => onRemove(item.sku)}
        className={`${ROUND_BUTTON} absolute right-3 top-3 sm:static sm:justify-self-center`}
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

export default CartItemRow;
