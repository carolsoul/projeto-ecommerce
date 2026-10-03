import { type OrderItem } from "../types/order";
import { OrderItemImage } from "./OrderItemImage";

interface OrderHistoryItemProps {
    item: OrderItem;
}

/**
 * Um item dentro de um pedido do histórico.
 *
 * A imagem e os dois fallbacks moram no OrderItemImage, compartilhado com a
 * tela de rastreamento. Aqui fica só o layout deste cartão.
 */
export function OrderHistoryItem ({item}: OrderHistoryItemProps) {
    return (
      <>
        <OrderItemImage item={item} />
        <div>
            <p className="text-sm font-medium text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-600 mt-1.5">Quantidade: {item.quantity}</p>
        </div>
      </>
    )
}
