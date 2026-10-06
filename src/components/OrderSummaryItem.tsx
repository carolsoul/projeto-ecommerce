import { type CartItem } from '../types/cart';
import { BRAND, CARD, MUTED } from '../lib/theme';

interface OrderSummaryItemProps {
  item: CartItem;
}

/**
 * Um item na coluna de resumo do checkout — somente leitura. Os totais desta tela (`totals`) são calculados pelo servidor em `/api/checkout/quote`, uma vez, quando o endereço é confirmado.
 */
export function OrderSummaryItem({ item }: OrderSummaryItemProps) {
  return (
    <div className={`${CARD} grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-2 rounded-2xl px-4 py-4`}>
      <div className="row-span-2 size-24 shrink-0 overflow-hidden rounded-xl">
        <img
          src={item.imageUrl}
          alt={item.name}
          width={96}
          height={96}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h3 className={`text-sm font-semibold ${BRAND}`}>{item.name}</h3>
          <p className={`text-sm font-semibold ${BRAND}`}>
            R${(item.price * item.quantity).toFixed(2)}
          </p>
        </div>

        <p className={`mt-1 truncate text-xs ${MUTED}`}>{item.sku}</p>
      </div>

      <p className={`text-sm ${MUTED}`}>Quantidade: {item.quantity}</p>
    </div>
  );
}
