import { FieldValue } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ConfigError, getAdminDb } from '../_lib/firebaseAdmin.js';
import {
  coversTotal,
  getAccessToken,
  isSignatureValid,
  mapPaymentStatus,
  paidAmountOf,
  paymentUrl,
} from '../_lib/mercadopago.js';

/**
 * POST /api/webhooks/mercadopago
 *
 * Quem chama esta rota é o Mercado Pago, não o navegador — então não há token
 * do Firebase para verificar. A confiança vem de outro lugar:
 *
 * 1. A assinatura `x-signature`, quando MP_WEBHOOK_SECRET está configurado.
 * 2. E, sempre, o handshake: a notificação só diz "olhe o pagamento X". Quem
 *    diz quanto foi pago e se foi aprovado é a API do Mercado Pago, consultada
 *    aqui com o nosso token. Ninguém consegue forjar um "pago" pelo corpo.
 *
 * Sobre os códigos de resposta: o Mercado Pago reenvia a notificação enquanto
 * não receber 2xx. Devolvemos 200 para tudo que já foi tratado (inclusive o que
 * decidimos ignorar) e 5xx só quando uma nova tentativa pode dar certo.
 */

const MP_TIMEOUT_MS = 10_000;

/** O id do pagamento chega ora no corpo, ora na query string. */
function readPaymentId(req: VercelRequest): string | null {
  const body = (req.body ?? {}) as {
    data?: { id?: unknown };
    id?: unknown;
    type?: unknown;
    action?: unknown;
  };

  const fromBody = body.data?.id;
  if (typeof fromBody === 'string' && fromBody !== '') return fromBody;
  if (typeof fromBody === 'number') return String(fromBody);

  const fromQuery = req.query['data.id'] ?? req.query.id;
  if (typeof fromQuery === 'string' && fromQuery !== '') return fromQuery;

  return null;
}

function isPaymentNotification(req: VercelRequest): boolean {
  const body = (req.body ?? {}) as { type?: unknown; action?: unknown };
  const action = typeof body.action === 'string' ? body.action : '';

  return body.type === 'payment' || req.query.type === 'payment' || action.startsWith('payment.');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  // Notificações de outros tópicos (merchant_order, plan...) não interessam.
  // 200 aqui é de propósito: sem ele o Mercado Pago reenvia para sempre.
  if (!isPaymentNotification(req)) {
    return res.status(200).json({ received: true, ignored: true });
  }

  const paymentId = readPaymentId(req);
  if (paymentId === null) {
    return res.status(400).json({ error: 'ID do pagamento ausente.' });
  }

  const signatureOk = isSignatureValid(
    {
      signature: req.headers['x-signature'] as string | undefined,
      requestId: req.headers['x-request-id'] as string | undefined,
    },
    paymentId,
    process.env.MP_WEBHOOK_SECRET
  );

  if (!signatureOk) {
    console.warn('Webhook com assinatura inválida, descartado. paymentId:', paymentId);
    return res.status(401).json({ error: 'Assinatura inválida.' });
  }

  try {
    const mpResponse = await fetch(paymentUrl(paymentId), {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
      signal: AbortSignal.timeout(MP_TIMEOUT_MS),
    });

    // 404 significa que este pagamento não é nosso (ou já sumiu). Reenviar não
    // vai mudar isso, então encerramos com 200.
    if (mpResponse.status === 404) {
      console.warn('Pagamento não encontrado no Mercado Pago:', paymentId);
      return res.status(200).json({ received: true, ignored: true });
    }

    if (!mpResponse.ok) {
      console.error(`Mercado Pago respondeu HTTP ${mpResponse.status} para o pagamento ${paymentId}.`);
      return res.status(502).json({ error: 'Erro ao validar o pagamento.' });
    }

    const payment = (await mpResponse.json()) as {
      status?: unknown;
      external_reference?: unknown;
      transaction_details?: { total_paid_amount?: unknown } | null;
      transaction_amount?: unknown;
    };

    const orderId = payment.external_reference;
    if (typeof orderId !== 'string' || orderId === '') {
      console.warn('Pagamento sem external_reference:', paymentId);
      return res.status(200).json({ received: true, ignored: true });
    }

    const status = mapPaymentStatus(payment.status);
    if (status === null) {
      console.warn(`Status "${String(payment.status)}" desconhecido, pedido ${orderId} intacto.`);
      return res.status(200).json({ received: true, ignored: true });
    }

    const adminDb = getAdminDb();
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      console.warn('Webhook para pedido inexistente:', orderId);
      return res.status(200).json({ received: true, ignored: true });
    }

    const order = orderSnap.data() as { total?: unknown; status?: unknown };

    // Um pedido já pago não volta atrás por causa de uma notificação atrasada —
    // e elas chegam fora de ordem com frequência.
    if (order.status === 'paid') {
      return res.status(200).json({ received: true, alreadyPaid: true });
    }

    // Aprovado só vale se o valor cobre o total que o SERVIDOR calculou. É a
    // última tranca contra um pagamento de R$0,01 para um pedido de R$118,00.
    if (status === 'paid' && !coversTotal(paidAmountOf(payment), order.total)) {
      console.error(
        `Valor pago não cobre o pedido ${orderId}. Marcado para revisão manual.`
      );

      await orderRef.update({
        status: 'failed',
        paymentIssue: 'underpaid',
        mercadopagoPaymentId: paymentId,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ received: true, underpaid: true });
    }

    await orderRef.update({
      status,
      mercadopagoPaymentId: paymentId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ received: true, status });
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error('Configuração do servidor incompleta:', error.message);
      return res.status(500).json({ error: error.message, code: 'CONFIG' });
    }

    console.error('Falha ao processar o webhook do Mercado Pago:', error);
    return res.status(500).json({ error: 'Erro interno ao processar a notificação.' });
  }
}
