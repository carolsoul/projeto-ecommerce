import { useState } from 'react';
import { type OrderItem } from '../types/order';
import { CARD, SUBTLE } from '../lib/theme';

interface OrderItemImageProps {
  item: OrderItem;
  className?: string;
  size?: number;
}

/**
 * A imagem de um item de pedido, com os dois fallbacks.
 *
 * Extraído porque duas telas precisam da MESMA lógica em layouts diferentes: o
 * cartão do histórico (OrderHistoryItem) e a tela de rastreamento. 
 * Os dois casos cobertos:
 * - `hasUrl` → pedidos gravados antes do congelamento da imagem existir, que não têm o campo.
 * - `failed` → a URL existe mas não carrega: produto apagado do storage, URL trocada, rede fora.
 *
 * O `failed` zera sozinho quando o item muda se o pai der key={item.sku}, o React remonta em vez de reaproveitar o estado antigo.
 */
export function OrderItemImage({
  item,
  className = 'w-26 h-26',
  size = 64,
}: OrderItemImageProps) {
  const hasUrl = typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '';
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`${className} shrink-0 ${CARD} rounded-md overflow-hidden flex items-center justify-center`}
    >
      {hasUrl && !failed ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={`text-xs ${SUBTLE} text-center`}>Sem foto</span>
      )}
    </div>
  );
}
