import { useState } from 'react';
import { type OrderItem } from '../types/order';

interface OrderItemImageProps {
  item: OrderItem;
  /** Tamanho da caixa. As telas usam medidas diferentes para o mesmo item. */
  className?: string;
  /** Lado do quadrado em px, para os atributos width/height do <img>. */
  size?: number;
}

/**
 * A imagem de um item de pedido, com os dois fallbacks.
 *
 * Extraído porque duas telas precisam da MESMA lógica em layouts diferentes: o
 * cartão do histórico (OrderHistoryItem) e a tela de rastreamento. O que se
 * repetia aqui não era marcação, era o estado do `onError` — e esse sim vale
 * compartilhar. Segue a mesma distinção do comentário em OrderSummaryItem.tsx:
 * apresentação diferente é componente diferente, lógica igual é componente
 * compartilhado.
 *
 * Os dois casos cobertos:
 * - `hasUrl` → pedidos gravados antes do congelamento da imagem existir, que
 *   não têm o campo.
 * - `failed` → a URL existe mas não carrega: produto apagado do storage, URL
 *   trocada, rede fora.
 *
 * A ramificação acontece ANTES do <img> de propósito: <img src=""> faz vários
 * navegadores re-requisitarem a URL da página atual, o que aqui bateria de
 * volta na própria SPA.
 *
 * O `failed` zera sozinho quando o item muda se o pai der key={item.sku} — com
 * key estável o React remonta em vez de reaproveitar o estado antigo.
 */
export function OrderItemImage({
  item,
  className = 'w-16 h-16',
  size = 64,
}: OrderItemImageProps) {
  const hasUrl = typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '';
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`${className} shrink-0 bg-gray-100 p-1 rounded-md overflow-hidden flex items-center justify-center`}
    >
      {hasUrl && !failed ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-xs text-gray-400 text-center">Sem foto</span>
      )}
    </div>
  );
}
