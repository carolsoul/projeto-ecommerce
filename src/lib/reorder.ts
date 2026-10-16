import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { type OrderItem } from '../types/order';
import { type CartableProduct } from '../types/products';

/**
 * Repetir um pedido: transforma os itens de um pedido antigo em itens de
 * carrinho.
 *
 * O ponto central é que o preço NÃO vem do pedido. Para o carrinho vale o preço de hoje, relido
 * de `products`, a mesma fonte que `api/_lib/pricing.ts` usa ao fechar a conta.
 * 
 * Produto que saiu do catálogo entra em `missing` em vez de derrubar a operação:
 * repetir um pedido de cinco itens não pode falhar inteiro porque um saiu de linha.
 */
export interface ReorderLine {
  product: CartableProduct;
  quantity: number;
}

export interface ReorderResult {
  lines: ReorderLine[];
  /** Nomes dos produtos que não estão mais disponíveis. */
  missing: string[];
}

export async function loadReorderLines(items: OrderItem[]): Promise<ReorderResult> {
  const snapshots = await Promise.all(
    items.map((item) => getDoc(doc(db, 'products', item.sku)))
  );

  const lines: ReorderLine[] = [];
  const missing: string[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const snapshot = snapshots[index];

    if (!snapshot.exists()) {
      missing.push(item.name);
      continue;
    }

    const data = snapshot.data() as { name: string; price: number; imageUrl: string };

    lines.push({
      product: {
        id: snapshot.id,
        name: data.name,
        price: data.price,
        imageUrl: data.imageUrl,
      },
      quantity: item.quantity,
    });
  }

  return { lines, missing };
}
