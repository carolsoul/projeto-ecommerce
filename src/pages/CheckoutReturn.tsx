import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/useAuth';
import type { OrderStatus } from '../types/order';

/**
 * Tela de retorno do Mercado Pago (`back_urls`).
 *
 * A regra que organiza este arquivo inteiro: **a query string não prova nada**.
 * O Mercado Pago volta com `?status=approved&payment_id=...`, mas essa URL é
 * digitável por qualquer pessoa na barra de endereços. Quem diz se o pedido foi
 * pago é o documento em `orders`, escrito só pelo webhook através do Admin SDK.
 *
 * Por isso a tela assina o pedido com `onSnapshot` em vez de ler uma vez: o
 * redirect quase sempre chega ANTES da notificação do webhook, então o normal é
 * cair aqui em `awaiting_payment` e ver virar `paid` alguns segundos depois,
 * sozinho. Sem a assinatura ao vivo, a pessoa teria que recarregar a página.
 *
 * A query do MP entra só como pista visual para um caso que o Firestore não
 * distingue: pagamento recusado e pagamento abandonado deixam ambos o pedido em
 * `awaiting_payment` (webhook nenhum é disparado quando a pessoa desiste), e
 * sem essa pista a tela ficaria "confirmando..." para sempre.
 */

type Phase = 'loading' | 'ready' | 'unauthenticated' | 'missing' | 'denied';

/** Quanto esperamos o webhook antes de dizer que ele está demorando. */
const SLOW_AFTER_MS = 20_000;

export default function CheckoutReturn() {
  const { orderId } = useParams<{ orderId: string }>();
  const [params] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [phase, setPhase] = useState<Phase>('loading');
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [paymentIssue, setPaymentIssue] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);

  // Pista do MP, nunca fonte de verdade. `collection_status` é o nome antigo do
  // mesmo campo e ainda aparece em parte dos redirects.
  const hint = params.get('status') ?? params.get('collection_status');

  useEffect(() => {
    if (authLoading) return;

    if (user === null) {
      setPhase('unauthenticated');
      return;
    }

    if (!orderId) {
      setPhase('missing');
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'orders', orderId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setPhase('missing');
          return;
        }

        const data = snapshot.data() as { status?: OrderStatus; paymentIssue?: string };
        setStatus(data.status ?? null);
        setPaymentIssue(data.paymentIssue ?? null);
        setPhase('ready');
      },
      // As regras do Firestore negam a leitura de pedido alheio. O erro chega
      // aqui como permission-denied, e tratamos igual a "não encontrado" para
      // não revelar que o id existe.
      (error) => {
        console.error('Não foi possível acompanhar o pedido:', error);
        setPhase(error.code === 'permission-denied' ? 'denied' : 'missing');
      }
    );

    return unsubscribe;
  }, [orderId, user, authLoading]);

  useEffect(() => {
    if (phase !== 'ready') return;
    if (status !== 'awaiting_payment' && status !== 'pending') return;

    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [phase, status]);

  if (authLoading || phase === 'loading') {
    return <Shell title="Carregando pedido..." tone="neutral" />;
  }

  if (phase === 'unauthenticated') {
    return (
      <Shell title="Entre para ver este pedido" tone="neutral">
        <p className="text-sm text-slate-600">
          Seu pagamento não se perde — ele está ligado à sua conta. Faça login para acompanhar.
        </p>
        <Actions>
          <Primary to="/login">Fazer login</Primary>
        </Actions>
      </Shell>
    );
  }

  if (phase === 'missing' || phase === 'denied') {
    return (
      <Shell title="Pedido não encontrado" tone="error" icon={<XCircle size={28} />}>
        <p className="text-sm text-slate-600">
          Não encontramos este pedido na sua conta. Se você acabou de pagar, confira a lista de
          pedidos antes de tentar de novo.
        </p>
        <Actions>
          <Primary to="/">Voltar à loja</Primary>
        </Actions>
      </Shell>
    );
  }

  if (status === 'paid') {
    return (
      <Shell title="Pagamento confirmado" tone="success" icon={<CheckCircle2 size={28} />}>
        <p className="text-sm text-slate-600">
          Recebemos seu pagamento e o pedido já está em preparação.
        </p>
        <OrderNumber id={orderId} />
        <Actions>
          <Primary to="/">Continuar comprando</Primary>
        </Actions>
      </Shell>
    );
  }

  if (status === 'failed') {
    const underpaid = paymentIssue === 'underpaid';

    return (
      <Shell title="Pagamento não aprovado" tone="error" icon={<XCircle size={28} />}>
        <p className="text-sm text-slate-600">
          {underpaid
            ? 'O valor recebido não cobriu o total do pedido. Nossa equipe vai revisar e entrar em contato.'
            : 'O pagamento foi recusado. Nenhum valor foi cobrado — você pode tentar com outro meio de pagamento.'}
        </p>
        <OrderNumber id={orderId} />
        {!underpaid && (
          <Actions>
            <Primary to="/checkout">Tentar novamente</Primary>
          </Actions>
        )}
      </Shell>
    );
  }

  if (status === 'cancelled') {
    return (
      <Shell title="Pagamento cancelado" tone="error" icon={<XCircle size={28} />}>
        <p className="text-sm text-slate-600">
          Este pagamento foi cancelado ou estornado. Se você não reconhece a operação, fale com o
          suporte citando o número abaixo.
        </p>
        <OrderNumber id={orderId} />
        <Actions>
          <Primary to="/checkout">Tentar novamente</Primary>
        </Actions>
      </Shell>
    );
  }

  // Sobrou `pending` e `awaiting_payment`. É aqui que a pista do MP decide entre
  // "está confirmando" e "você não chegou a pagar" — o Firestore vê a mesma
  // coisa nos dois casos.
  const abandoned = hint === 'rejected' || hint === 'null' || hint === null;

  if (abandoned) {
    return (
      <Shell title="Pagamento não concluído" tone="neutral" icon={<Clock size={28} />}>
        <p className="text-sm text-slate-600">
          Não recebemos a confirmação deste pagamento. O pedido continua guardado — tentar de novo
          não cria um pedido duplicado.
        </p>
        <OrderNumber id={orderId} />
        <Actions>
          <Primary to="/checkout">Tentar novamente</Primary>
        </Actions>
      </Shell>
    );
  }

  return (
    <Shell title="Confirmando seu pagamento..." tone="neutral" icon={<Clock size={28} />}>
      <p className="text-sm text-slate-600">
        {slow
          ? 'A confirmação está demorando mais que o normal. Pode fechar esta página — o pedido é atualizado sozinho assim que o pagamento for processado, e você o encontra na sua lista de pedidos.'
          : 'Recebemos seu pagamento e estamos aguardando a confirmação do Mercado Pago. Esta tela se atualiza sozinha.'}
      </p>
      <OrderNumber id={orderId} />
      {!slow && (
        <p className="mt-4 text-xs text-slate-500" role="status">
          Aguardando confirmação...
        </p>
      )}
    </Shell>
  );
}

/* ── Pedaços visuais ─────────────────────────────────────────────────────── */

const TONE_CLASS = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
} as const;

function Shell({
  title,
  tone,
  icon,
  children,
}: {
  title: string;
  tone: keyof typeof TONE_CLASS;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <main className="px-4 md:px-8 mt-6">
      <h1 className="sr-only">Retorno do pagamento</h1>

      <div className="max-w-xl mx-auto">
        <div className={`rounded-md border p-6 ${TONE_CLASS[tone]}`}>
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

function OrderNumber({ id }: { id: string | undefined }) {
  if (!id) return null;

  return (
    <p className="mt-4 text-sm text-slate-700">
      Número do pedido: <span className="font-mono font-semibold">{id}</span>
    </p>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex flex-wrap gap-3">{children}</div>;
}

function Primary({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="px-3.5 py-2 text-white text-sm font-semibold rounded-md bg-blue-600 hover:bg-blue-700 border border-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {children}
    </Link>
  );
}
