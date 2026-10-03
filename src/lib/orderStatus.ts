import {
  Clock,
  Package,
  PackageCheck,
  PackageX,
  TriangleAlert,
  Truck,
  Undo2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FulfillmentStatus, OrderStatus } from '../types/order';

/**
 * Rótulos e transições de status, compartilhados pelas telas.
 *
 * Isto vivia dentro do Orders.tsx. Saiu de lá quando a terceira tela precisou
 * do mesmo mapa (histórico do cliente, fila do admin e detalhe do pedido) —
 * três cópias de "paid" → "Pago" divergiriam na primeira mudança de rótulo.
 *
 * Os dois eixos ficam em mapas separados, como no resto do projeto: pagamento e
 * entrega são ortogonais, e um pedido tem um status de cada ao mesmo tempo.
 */

export interface StatusPresentation {
  label: string;
  className: string;
}

/**
 * O eixo da entrega carrega também um ícone, para o stepper da tela de
 * rastreamento.
 *
 * O campo guarda a REFERÊNCIA do componente (`Truck`), não o elemento
 * (`<Truck />`). Dois motivos: este arquivo é `.ts` e não aceita JSX, e o ícone
 * não pode vir do Firestore — lá moram dados, não JSX. O ícone é derivado do
 * status, igual ao rótulo e à cor.
 *
 * No uso, renomeie para maiúscula ao desestruturar:
 *   const { icon: Icon } = fulfillmentPresentation(event.status);
 *   <Icon className="size-4" aria-hidden="true" />
 * O JSX trata minúscula como tag HTML, então `<icon />` viraria um elemento
 * literal e silenciosamente não renderizaria nada.
 */
export interface FulfillmentPresentation extends StatusPresentation {
  icon: LucideIcon;
}

/** Eixo do dinheiro: o que o webhook do Mercado Pago escreve em `status`. */
export const PAYMENT_STATUS = {
  paid: {
    label: 'Pago',
    className: 'bg-emerald-100 text-emerald-700',
  },
  awaiting_payment: {
    label: 'Aguardando pagamento',
    className: 'bg-amber-100 text-amber-700',
  },
  pending: {
    label: 'Pendente',
    className: 'bg-blue-100 text-slate-700',
  },
  failed: {
    label: 'Falhou',
    className: 'bg-red-100 text-red-700',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-gray-100 text-gray-700',
  },
} as const satisfies Record<OrderStatus, StatusPresentation>;

/** Eixo da logística: o que a rota /api/admin/orders/tracking escreve. */
export const FULFILLMENT_STATUS = {
  processing: {
    label: 'Preparando',
    className: 'bg-blue-100 text-blue-700',
    icon: Package,
  },
  shipped: {
    label: 'Despachado',
    className: 'bg-indigo-100 text-indigo-700',
    icon: Truck,
  },
  delivered: {
    label: 'Entregue',
    className: 'bg-emerald-100 text-emerald-700',
    icon: PackageCheck,
  },
  delivery_failed: {
    label: 'Falha na entrega',
    className: 'bg-red-100 text-red-700',
    icon: PackageX,
  },
  returned: {
    label: 'Devolvido',
    className: 'bg-gray-100 text-gray-700',
    icon: Undo2,
  },
} as const satisfies Record<FulfillmentStatus, FulfillmentPresentation>;

export const PAYMENT_STATUS_KEYS = Object.keys(PAYMENT_STATUS) as OrderStatus[];
export const FULFILLMENT_STATUS_KEYS = Object.keys(
  FULFILLMENT_STATUS
) as FulfillmentStatus[];

/**
 * Para status que o front não conhece: campo corrompido, ou um status novo no
 * servidor que esta versão do bundle ainda não viu. Dizer "não sei" é honesto;
 * cair num status real seria afirmar algo que pode ser falso.
 */
export const UNKNOWN_STATUS: FulfillmentPresentation = {
  label: 'Status desconhecido',
  className: 'bg-slate-100 text-slate-700',
  icon: TriangleAlert,
};

/** Para o pedido que ainda não entrou na esteira de entrega. */
export const NOT_STARTED_STATUS: FulfillmentPresentation = {
  label: 'Não iniciado',
  className: 'bg-slate-100 text-slate-600',
  icon: Clock,
};

export function paymentPresentation(status: unknown): StatusPresentation {
  return PAYMENT_STATUS[status as OrderStatus] ?? UNKNOWN_STATUS;
}

/**
 * `undefined`/`null` devolve "Não iniciado" em vez de "desconhecido": a ausência
 * do campo é o estado legítimo dos pedidos gravados antes do fulfillment
 * existir, e de qualquer pedido que ainda não foi pago.
 *
 * O retorno sempre traz `icon`, inclusive nos dois fallbacks — assim o stepper
 * nunca precisa de `?? algumCoisa` no meio do JSX.
 */
export function fulfillmentPresentation(status: unknown): FulfillmentPresentation {
  if (status === undefined || status === null) return NOT_STARTED_STATUS;

  return FULFILLMENT_STATUS[status as FulfillmentStatus] ?? UNKNOWN_STATUS;
}

/**
 * Cópia cliente da máquina de estados de `api/_lib/fulfillment.ts`.
 *
 * A duplicação é deliberada: `api/` não pode ser importado por `src/` (o
 * tsconfig.app.json só inclui `src`, e o servidor não deve depender do
 * cliente). Os papéis também são diferentes — esta cópia decide **o que
 * oferecer** no formulário, a do servidor decide **o que permitir** dentro da
 * transaction. Filtrar aqui é conveniência de interface, nunca segurança.
 *
 * Se as duas divergirem, o servidor recusa com 409 e mensagem legível, que é o
 * lado certo para errar. Mas mantenha-as iguais.
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
 * `shipped` está aqui junto de `processing` para os pedidos antigos, que nunca
 * tiveram o campo `fulfillment` — sem essa porta eles ficariam presos, já que
 * ninguém nunca marcou `processing` neles.
 */
const ALLOWED_FIRST_STATUSES: FulfillmentStatus[] = ['processing', 'shipped'];

/**
 * O caminho canônico de um pedido normal.
 *
 * É uma LINHA, diferente do ALLOWED_TRANSITIONS, que é um grafo com ramos. O
 * stepper da tela de rastreamento é linear, então ele precisa de uma linha.
 *
 * Serve só para apresentação: nada disso é gravado no Firestore, que continua
 * guardando apenas o que aconteceu. Quem decide o que PODE acontecer é o
 * canTransition no servidor.
 *
 * As exceções (`delivery_failed`, `returned`) ficam de fora de propósito. Elas
 * ramificam — de `delivery_failed` dá para voltar a `shipped` ou ir para
 * `returned`, e os dois são mutuamente exclusivos — e uma linha não representa
 * ramo. O lugar delas é um bloco de aviso acima do stepper, não um passo dentro
 * dele.
 */
export const HAPPY_PATH: FulfillmentStatus[] = ['processing', 'shipped', 'delivered'];

/** Os passos do caminho canônico que ainda não aconteceram. */
export function remainingSteps(
  current: FulfillmentStatus | null | undefined
): FulfillmentStatus[] {
  if (current === undefined || current === null) return HAPPY_PATH;

  const index = HAPPY_PATH.indexOf(current);
  // Status fora do caminho canônico (uma exceção) não tem "próximo passo"
  // previsível: vira aviso, não passo.
  if (index === -1) return [];

  return HAPPY_PATH.slice(index + 1);
}

/** Os estados que o `select` do formulário deve oferecer. */
export function nextStatusesFor(
  current: FulfillmentStatus | null | undefined
): FulfillmentStatus[] {
  if (current === undefined || current === null) return ALLOWED_FIRST_STATUSES;

  return ALLOWED_TRANSITIONS[current] ?? [];
}
