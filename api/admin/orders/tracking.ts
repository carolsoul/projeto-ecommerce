import { FieldValue } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ConfigError, getAdminDb } from '../../_lib/firebaseAdmin.js';
import { getUidFromRequest } from '../../_lib/auth.js';
import {
  FulfillmentError,
  buildTrackingEvent,
  canTransition,
  isFulfillmentStatus,
  requiresPaidOrder,
  type FulfillmentStatus,
} from '../../_lib/fulfillment.js';

/**
 * POST /api/admin/orders/tracking
 *
 * Acrescenta um evento à linha do tempo de entrega de um pedido e atualiza o
 * estado atual. É o único caminho pelo qual `orders` ganha informação de
 * logística — `firestore.rules` mantém `allow write: if false` tanto no pedido
 * quanto na subcoleção `tracking`, e esta rota grava pelo Admin SDK, que não é
 * avaliado pelas regras.
 *
 * Corpo: { orderId, status, description?, location?, trackingCode?, carrier?,
 *          idempotencyKey }
 *
 * Duas proteções diferentes para dois problemas diferentes:
 *
 * - a TRANSACTION resolve "o estado mudou embaixo de mim enquanto eu decidia";
 *   se dois admins agirem ao mesmo tempo, o segundo relê e o `canTransition`
 *   recusa com o estado novo.
 * - a CHAVE DE IDEMPOTÊNCIA resolve "a mesma ação chegou duas vezes", que a
 *   transaction não vê, porque são duas requisições independentes.
 */

type PostBody = {
  orderId?: unknown;
  status?: unknown;
  description?: unknown;
  location?: unknown;
  trackingCode?: unknown;
  carrier?: unknown;
  idempotencyKey?: unknown;
};

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const uid = await getUidFromRequest(req);
  if (uid === null) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const body = (req.body ?? {}) as PostBody;
  const orderId = readString(body.orderId);
  const status = readString(body.status);
  const idempotencyKey = readString(body.idempotencyKey);
  const description = readString(body.description);
  const location = readString(body.location);
  const trackingCode = readString(body.trackingCode);
  const carrier = readString(body.carrier);

  if (orderId === '') {
    return res.status(400).json({ error: 'ID do pedido é obrigatório.' });
  }
  if (idempotencyKey === '') {
    return res.status(400).json({ error: 'Chave de idempotência ausente.' });
  }
  // Validar o status ANTES da transaction: é barato, e evita abrir uma
  // transaction que já nasce condenada.
  if (!isFulfillmentStatus(status)) {
    return res.status(400).json({ error: 'Estado de entrega inválido.', code: 'INVALID_STATUS' });
  }

  const nextStatus: FulfillmentStatus = status;

  try {
    const adminDb = getAdminDb();

    // Autorização é leitura solta de propósito: não faz parte da decisão
    // atômica, e quem é admin não muda no meio de uma requisição. Confere pelo
    // Admin SDK, nunca pelo `isAdmin` do AuthContext, que vem do navegador.
    const adminSnap = await adminDb.collection('admins').doc(uid).get();
    if (!adminSnap.exists) {
      return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }

    const orderRef = adminDb.collection('orders').doc(orderId);
    const trackingRef = orderRef.collection('tracking');

    // O id sai ANTES da transaction (é gerado localmente, sem ida à rede) para
    // que todo retry reaproveite o mesmo, e para podermos devolvê-lo no fim.
    const eventRef = trackingRef.doc();

    const result = await adminDb.runTransaction(async (tx) => {
      // ── LER ── tudo aqui em cima: o Firestore precisa da lista completa das
      // leituras para conferir, no commit, se algo mudou e repetir se mudou.
      // Sempre `tx.get`, nunca `ref.get()` — a leitura solta não é registrada
      // e a transaction deixaria de proteger sem dar nenhum sinal.
      const orderSnap = await tx.get(orderRef);
      const duplicateSnap = await tx.get(
        trackingRef.where('idempotencyKey', '==', idempotencyKey).limit(1)
      );

      // ── DECIDIR ── só funções puras de fulfillment.ts daqui até as escritas.
      if (!orderSnap.exists) {
        throw new FulfillmentError('Pedido não encontrado.', 'ORDER_NOT_FOUND');
      }

      if (!duplicateSnap.empty) {
        const existing = duplicateSnap.docs[0];
        return { eventId: existing.id, status: existing.data().status, reused: true };
      }

      const order = orderSnap.data() as {
        uid?: string;
        status?: string;
        fulfillment?: { status?: unknown };
      };

      if (requiresPaidOrder(nextStatus) && order.status !== 'paid') {
        throw new FulfillmentError(
          'Não dá para despachar um pedido que não foi pago.',
          'ORDER_NOT_PAID'
        );
      }

      const currentStatus = isFulfillmentStatus(order.fulfillment?.status)
        ? order.fulfillment.status
        : null;

      if (!canTransition(currentStatus, nextStatus)) {
        throw new FulfillmentError(
          `Transição inválida: de ${currentStatus ?? 'nenhum estado'} para ${nextStatus}.`,
          'INVALID_TRANSITION'
        );
      }

      // ── ESCREVER ── nenhuma leitura daqui para baixo.

      // O uid do evento é o do DONO DO PEDIDO, não o do admin que está
      // gravando. É esse campo que a regra do Firestore compara para liberar a
      // leitura da subcoleção; com o uid do admin, o cliente perderia acesso ao
      // próprio rastreamento.
      const event = buildTrackingEvent({
        uid: order.uid ?? '',
        status: nextStatus,
        source: 'admin',
        description,
        location,
        idempotencyKey,
      });

      tx.set(eventRef, { ...event, occurredAt: FieldValue.serverTimestamp() });

      // A cópia desnormalizada do estado atual, para o Orders.tsx montar o badge
      // da lista sem abrir a subcoleção de cada pedido. Vai no mesmo commit que
      // o evento justamente para não poder divergir dele.
      const orderUpdate: Record<string, unknown> = {
        fulfillment: { status: nextStatus, updatedAt: FieldValue.serverTimestamp() },
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (trackingCode !== '') orderUpdate.trackingCode = trackingCode;
      if (carrier !== '') orderUpdate.carrier = carrier;

      tx.update(orderRef, orderUpdate);

      return { eventId: eventRef.id, status: nextStatus, reused: false };
    });

    return res.status(result.reused ? 200 : 201).json(result);
  } catch (error) {
    // Recusa de regra de negócio e falha de infraestrutura chegam no mesmo
    // catch — inclusive o "desisti depois de N tentativas" do próprio
    // Firestore. É o tipo do erro que separa 4xx de 5xx.
    if (error instanceof FulfillmentError) {
      const httpStatus = error.code === 'ORDER_NOT_FOUND' ? 404 : 409;
      return res.status(httpStatus).json({ error: error.message, code: error.code });
    }

    if (error instanceof ConfigError) {
      console.error('Configuração do servidor incompleta:', error.message);
      return res.status(500).json({ error: error.message, code: 'CONFIG' });
    }

    console.error('Falha ao registrar o evento de entrega:', error);
    return res.status(500).json({ error: 'Não foi possível registrar o evento.' });
  }
}
