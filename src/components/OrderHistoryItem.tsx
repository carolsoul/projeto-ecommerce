import { type OrderItem } from "../types/order";
import { useState } from "react";

interface OrderHistoryItemProps {
    item: OrderItem;
}

/**
 * Um item dentro de um pedido do histórico.
 *
 * O fallback cobre dois casos:
 * `hasUrl` pega os pedidos gravados antes do congelamento da imagem existir
 * (o campo nem vem no documento), e `failed` pega a URL que existe mas não carrega — produto apagado do storage, URL trocada, rede fora. 
 */
export function OrderHistoryItem ({item}: OrderHistoryItemProps) {
    const hasUrl = typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '';
    const [failed, setFailed] = useState(false);

    return (
      <>
        <div className="w-16 h-16 bg-gray-100 p-1 rounded-md overflow-hidden flex items-center justify-center">
            {hasUrl && !failed ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  width={64}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                  onError={() => setFailed(true)}
                />
            ) : (
                <span className="text-xs text-gray-400 text-center">Sem foto</span>
            )}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-600 mt-1.5">Quantidade: {item.quantity}</p>
        </div>
      </>
    )
}
