/**
 * Regras de entrega do pedido — a máquina de estados do fulfillment.
 *
 * Este módulo é a parte que decide, e por isso não importa Firebase nem toca em
 * rede: tudo aqui é função pura, exercitada por `fulfillment.test.ts` sem
 * precisar de servidor do lado de lá. Quem grava é a rota
 * `api/admin/orders/tracking.ts`, que chama estas funções e só então abre a
 * transaction.
 *
 * O eixo da ENTREGA é separado do eixo do PAGAMENTO de propósito. `OrderStatus`
 * ('paid', 'failed'...) continua descrevendo só o dinheiro; o que está aqui
 * descreve só a logística. Juntar os dois numa enum única criaria estados
 * impossíveis e quebraria a guarda `if (order.status === 'paid')` do webhook do
 * Mercado Pago, que é o que impede notificação atrasada de reescrever pedido.
 */

export type FulfillmentStatus =
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'delivery_failed'
  | 'returned';

export type TrackingSource = 'system' | 'admin' | 'carrier';

export type FulfillmentErrorCode =
  | 'ORDER_NOT_FOUND'
  | 'ORDER_NOT_PAID'
  | 'INVALID_STATUS'
  | 'INVALID_TRANSITION';

/**
 * Recusa de regra de negócio, separada de falha de infraestrutura.
 *
 * A distinção importa dentro da transaction: tanto um `throw` nosso quanto o
 * "desisti depois de N tentativas" do Firestore caem no mesmo `catch`. É o tipo
 * do erro que diz se a resposta é 4xx (quem chamou errou) ou 5xx (deu ruim
 * aqui). Mesmo padrão do `PricingError` em pricing.ts.
 */
export class FulfillmentError extends Error {
  readonly code: FulfillmentErrorCode;

  constructor(message: string, code: FulfillmentErrorCode) {
    super(message);
    this.name = 'FulfillmentError';
    this.code = code;
  }
}

const ALL_STATUSES: FulfillmentStatus[] = [
  'processing',
  'shipped',
  'delivered',
  'delivery_failed',
  'returned',
];

/**
 * Para onde cada estado pode ir.
 *
 * Só as transições que descrevem algo que de fato acontece no mundo:
 * - de `processing` só dá para despachar;
 * - despachado, ou entrega ou falha;
 * - falha permite nova tentativa (volta a `shipped`) ou devolução;
 * - entregue ainda pode virar devolução, e devolvido é fim de linha.
 */
const ALLOWED_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  processing: ['shipped'],
  shipped: ['delivered', 'delivery_failed'],
  delivered: ['returned'],
  delivery_failed: ['shipped', 'returned'],
  returned: [],
};

/**
 * De onde um pedido SEM estado de entrega pode partir.
 *
 * `processing` é o caminho normal, criado pelo webhook quando o pagamento é
 * aprovado. `shipped` existe para os pedidos gravados antes deste módulo, que
 * não têm o campo `fulfillment` — sem isso eles ficariam presos para sempre,
 * já que ninguém nunca marcou `processing` neles.
 */
const ALLOWED_FIRST_STATUSES: FulfillmentStatus[] = ['processing', 'shipped'];

export function isFulfillmentStatus(value: unknown): value is FulfillmentStatus {
  return typeof value === 'string' && (ALL_STATUSES as string[]).includes(value);
}

/**
 * A transição é permitida?
 *
 * `from` é `null` quando o pedido ainda não tem nenhum estado de entrega.
 * Repetir o mesmo estado é recusado de propósito: marcar "despachado" duas
 * vezes quase sempre é clique duplo ou engano, e a linha do tempo fica suja.
 */
export function canTransition(
  from: FulfillmentStatus | null,
  to: FulfillmentStatus
): boolean {
  if (!isFulfillmentStatus(to)) return false;
  if (from === null) return ALLOWED_FIRST_STATUSES.includes(to);
  if (!isFulfillmentStatus(from)) return false;

  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Descrição padrão, usada quando quem despacha não escreve uma própria. */
const DEFAULT_DESCRIPTION: Record<FulfillmentStatus, string> = {
  processing: 'Pagamento confirmado. Preparando seu pedido.',
  shipped: 'Pedido despachado e a caminho.',
  delivered: 'Pedido entregue.',
  delivery_failed: 'Tentativa de entrega sem sucesso.',
  returned: 'Pedido devolvido ao remetente.',
};

export function describeStatus(status: FulfillmentStatus): string {
  return DEFAULT_DESCRIPTION[status];
}

/**
 * Só `shipped` exige pagamento aprovado.
 *
 * Despachar pedido não pago é o erro caro — os outros estados descrevem
 * consequências de um despacho que já aconteceu, então checá-los de novo só
 * atrapalharia o registro da realidade.
 */
export function requiresPaidOrder(status: FulfillmentStatus): boolean {
  return status === 'shipped';
}

export interface TrackingEventInput {
  uid: string;
  status: FulfillmentStatus;
  source: TrackingSource;
  description?: string;
  location?: string;
  idempotencyKey?: string;
}

export interface TrackingEventBody {
  uid: string;
  status: FulfillmentStatus;
  source: TrackingSource;
  description: string;
  location?: string;
  idempotencyKey?: string;
}

/**
 * Monta o corpo do evento — sem o `occurredAt`.
 *
 * O carimbo de tempo fica de fora porque `FieldValue.serverTimestamp()` vem do
 * Admin SDK, e importá-lo aqui obrigaria o teste a subir infraestrutura. A rota
 * acrescenta esse único campo na hora de gravar.
 *
 * O `uid` é duplicado dentro do evento de propósito, e não é redundância
 * esquecida: é ele que permite a regra do Firestore autorizar a leitura da
 * subcoleção com uma comparação de campo. Sem ele, a regra precisaria de um
 * `get()` no pedido pai — leitura cobrada, e limitada a 10 por requisição, o
 * que estouraria ao listar uma linha do tempo comprida.
 *
 * Campos vazios são OMITIDOS em vez de irem como `undefined`: o Firestore
 * rejeita `undefined` num documento e a gravação falharia inteira.
 */
export function buildTrackingEvent(input: TrackingEventInput): TrackingEventBody {
  const description =
    typeof input.description === 'string' && input.description.trim() !== ''
      ? input.description.trim()
      : describeStatus(input.status);

  const body: TrackingEventBody = {
    uid: input.uid,
    status: input.status,
    source: input.source,
    description,
  };

  const location = input.location?.trim();
  if (location) body.location = location;

  const idempotencyKey = input.idempotencyKey?.trim();
  if (idempotencyKey) body.idempotencyKey = idempotencyKey;

  return body;
}
