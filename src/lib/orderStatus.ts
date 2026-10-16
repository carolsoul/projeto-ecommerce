import {
  Clock,
  CheckCircle2Icon,
  CreditCard,
  Package,
  PackageCheck,
  PackageX,
  TriangleAlert,
  Truck,
  Undo2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FulfillmentStatus, OrderStatus } from '../types/order';

export interface StatusPresentation {
  label: string;
  className: string;
}

export interface FulfillmentPresentation extends StatusPresentation {
  icon: LucideIcon;
}

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
    className: 'bg-blue-100 text-blue-700',
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

export const FULFILLMENT_STATUS = {
  placed: {
    label: 'Pedido feito',
    className: 'bg-blue-100 text-blue-700',
    icon: CheckCircle2Icon,
  },
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

/** 
 * Passos visuais para a esteira de rastreamento (combine o pagamento e o fulfillment).
 */
export type TrackingStepKey = 'placed' | 'payment_confirmed' | 'processing' | 'shipped' | 'delivered';

export interface TrackingStep {
  key: TrackingStepKey;
  label: string;
  icon: LucideIcon;
}

export const TRACKING_STEPS: TrackingStep[] = [
  { 
    key: 'placed', 
    label: 'Pedido feito', 
    icon: CheckCircle2Icon, 
  },
  { 
    key: 'payment_confirmed', 
    label: 'Pagamento confirmado', 
    icon: CreditCard, 
  },
  { 
    key: 'processing', 
    label: 'Em preparação', 
    icon: Package 
  },
  { 
    key: 'shipped', 
    label: 'Despachado', 
    icon: Truck 
  },
  {
    key: 'delivered', 
    label: 'Entregue', 
    icon: PackageCheck 
  },
];

export interface PaymentStepView {
  label: string;
  note: string;
  className: string;
}

export function paymentStepView(status: OrderStatus | undefined): PaymentStepView {
  if (status === 'paid') {
    return {
      label: 'Pagamento confirmado',
      note: 'Concluído',
      className: PAYMENT_STATUS.paid.className,
    };
  }

  if (status === 'failed') {
    return {
      label: 'Pagamento não aprovado',
      note: 'Não concluído',
      className: PAYMENT_STATUS.failed.className,
    };
  }

  if (status === 'cancelled') {
    return {
      label: 'Pagamento cancelado',
      note: 'Não concluído',
      className: PAYMENT_STATUS.cancelled.className,
    };
  }

  // `pending` e `awaiting_payment` são o mesmo recado para quem comprou. A diferença entre os dois é interna.
  return {
    label: 'Aguardando pagamento',
    note: 'Pendente',
    className: PAYMENT_STATUS.awaiting_payment.className,
  };
}

export const PAYMENT_STATUS_KEYS = Object.keys(PAYMENT_STATUS) as OrderStatus[];
export const FULFILLMENT_STATUS_KEYS = Object.keys(
  FULFILLMENT_STATUS
) as FulfillmentStatus[];

export const UNKNOWN_STATUS: FulfillmentPresentation = {
  label: 'Status desconhecido',
  className: 'bg-slate-100 text-slate-700',
  icon: TriangleAlert,
};

export const NOT_STARTED_STATUS: FulfillmentPresentation = {
  label: 'Não iniciado',
  className: 'bg-slate-100 text-slate-600',
  icon: Clock,
};

export function paymentPresentation(status: unknown): StatusPresentation {
  if (status === undefined || status === null) {
    return { label: 'Não pago', className: 'bg-slate-100 text-slate-600' };
  }

  const match = PAYMENT_STATUS[status as OrderStatus];
  if (match) return match;

  return { label: UNKNOWN_STATUS.label, className: UNKNOWN_STATUS.className };
}

export function fulfillmentPresentation(status: unknown): FulfillmentPresentation {
  if (status === undefined || status === null) return NOT_STARTED_STATUS;

  return FULFILLMENT_STATUS[status as FulfillmentStatus] ?? UNKNOWN_STATUS;
}

export function getTrackingStepState(
  stepKey: TrackingStepKey,
  paymentStatus: OrderStatus | undefined,
  fulfillmentStatus: FulfillmentStatus | undefined
): 'completed' | 'current' | 'upcoming' {
  const isPaid = paymentStatus === 'paid';
  
  // Ordem de precedência para saber em qual passo a UI se encontra
  if (fulfillmentStatus === 'delivered') {
    return 'completed';
  }

  if (fulfillmentStatus === 'shipped') {
    if (stepKey === 'delivered') return 'upcoming';
    if (stepKey === 'shipped') return 'current';
    return 'completed';
  }

  if (fulfillmentStatus === 'processing') {
    if (stepKey === 'shipped' || stepKey === 'delivered') return 'upcoming';
    if (stepKey === 'processing') return 'current';
    return 'completed';
  }

  if (isPaid) {
    if (stepKey === 'placed' || stepKey === 'payment_confirmed') return 'completed';
    if (stepKey === 'processing') return 'current'; // Pagou, então o próximo passo ativo é a preparação
    return 'upcoming';
  }

  // Se ainda não pagou
  if (stepKey === 'placed') return 'completed';
  if (stepKey === 'payment_confirmed') return 'current'; // Aguardando pagamento
  return 'upcoming';
}

/**
 * Cópia cliente da máquina de estados de `api/_lib/fulfillment.ts`.
 *
 * `placed` aparece aqui apenas porque o `Record<FulfillmentStatus, ...>` exige
 * uma entrada para cada membro do tipo — e vai VAZIA de propósito. Ele é um
 * degrau visual do TRACKING_STEPS, não um estado que alguém grava: nada escreve
 * `fulfillment.status = 'placed'`, e o servidor sequer o reconhece. Oferecê-lo
 * no formulário do admin produziria um 400 na rota de tracking.
 */
const ALLOWED_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  placed: [],
  processing: ['shipped'],
  shipped: ['delivered', 'delivery_failed'],
  delivered: ['returned'],
  delivery_failed: ['shipped', 'returned'],
  returned: [],
};

const ALLOWED_FIRST_STATUSES: FulfillmentStatus[] = ['processing', 'shipped'];


export function nextStatusesFor(
  current: FulfillmentStatus | null | undefined
): FulfillmentStatus[] {
  if (current === undefined || current === null) return ALLOWED_FIRST_STATUSES;

  return ALLOWED_TRANSITIONS[current] ?? [];
}