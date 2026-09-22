export interface OrderItem {
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

/**
 * Valores do pedido, calculados pelo servidor.
 *
 * O cliente nunca produz estes números — ele os recebe de /api/checkout/quote.
 * As regras (frete por região, taxa de 3%) vivem em /api e não chegam ao
 * bundle do navegador.
 */
export interface OrderTotals {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export type OrderStatus = 'pending' | 'awaiting_payment' | 'paid' | 'failed' | 'cancelled';
