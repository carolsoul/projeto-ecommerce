import { Timestamp } from 'firebase/firestore';

export interface OrderItem {
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  // Img opcional de propósito, é o tipo de LEITURA, e ele precisa
  // tolerar os pedidos gravados antes do congelamento existir. UI precisa de fallback.
  imageUrl?: string;
}

/** Endereço como foi congelado dentro do pedido, não como está hoje no perfil. */
export interface OrderAddress {
  recipient: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Um pedido como está gravado em `orders`.
 *
 * `id` não é um campo do documento — é o id do próprio documento, que Orders.tsx acrescenta ao ler. Os demais vêm de create-order.ts, e os quatro últimos só aparecem depois que o webhook do Mercado Pago processa o pagamento: um pedido recém-criado não tem nenhum deles.
 */
export interface Order {
  id: string;
  uid: string;
  status: OrderStatus;
  paymentMethod: 'card' | 'pix';
  items: OrderItem[];
  address: OrderAddress;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  mercadopagoPreferenceId?: string;
  mercadopagoPaymentId?: string;
  paymentIssue?: 'underpaid';
  fulfillment?: {
    status: FulfillmentStatus;
  };
  trackingCode?: string,
  carrier?: string,
}

/**
 * Valores do pedido, calculados pelo servidor.
 * O cliente nunca produz estes números — ele os recebe de /api/checkout/quote.
 * As regras (frete por região, taxa de 3%) vivem em /api e não chegam ao bundle do navegador.
 */
export interface OrderTotals {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface TrackingEvent {
  id: string,
  uid: string,
  status: FulfillmentStatus,
  description: string,
  location?: string,
  occurredAt: Timestamp
  source: 'system' | 'admin' | 'carrier'
}

export type OrderStatus = 'pending' | 'awaiting_payment' | 'paid' | 'failed' | 'cancelled'; 
export type FulfillmentStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'delivery_failed' | 'returned';