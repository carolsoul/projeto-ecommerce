import { FieldValue } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb, ConfigError } from '../_lib/firebaseAdmin';
import { getUidFromRequest } from '../_lib/auth';
import { loadOrderContext } from '../_lib/loadOrderContext';
import { PricingError } from '../_lib/pricing';

/**
 * POST /api/checkout/create-order
 *
 * Cria o pedido com os valores recalculados pelo servidor e status `pending`.
 * Ainda não cobra nada — a integração com o provedor de pagamento entra depois,
 * consumindo o total daqui.
 *
 * Corpo: { addressId, paymentMethod, idempotencyKey }
 */

type PaymentMethod = 'card' | 'pix';

function readBody(req: VercelRequest) {
  const body = (req.body ?? {}) as Record<string, unknown>;

  const addressId = typeof body.addressId === 'string' ? body.addressId.trim() : '';
  const idempotencyKey =
    typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '';
  const method = body.paymentMethod;
  const paymentMethod: PaymentMethod | null =
    method === 'card' || method === 'pix' ? method : null;

  return { addressId, idempotencyKey, paymentMethod };
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

  const { addressId, idempotencyKey, paymentMethod } = readBody(req);

  if (addressId === '') {
    return res.status(400).json({ error: 'Informe o endereço de entrega.' });
  }
  if (paymentMethod === null) {
    return res.status(400).json({ error: 'Forma de pagamento inválida.' });
  }
  if (idempotencyKey === '') {
    return res.status(400).json({ error: 'Chave de idempotência ausente.' });
  }

  try {
    const adminDb = getAdminDb();

    // Idempotência: dois cliques no botão não podem virar dois pedidos. Se já
    // existe um pedido com esta chave, devolvemos o mesmo em vez de criar outro.
    const existing = await adminDb
      .collection('orders')
      .where('uid', '==', uid)
      .where('idempotencyKey', '==', idempotencyKey)
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      return res.status(200).json({ orderId: doc.id, total: doc.data().total, reused: true });
    }

    const { address, totals } = await loadOrderContext(uid, addressId);

    // Os itens e o endereço vão CONGELADOS para dentro do pedido. Se o catálogo
    // mudar de preço amanhã, ou a pessoa editar o endereço cadastrado, este
    // pedido continua registrando o que de fato foi comprado e para onde.
    const orderRef = await adminDb.collection('orders').add({
      uid,
      status: 'pending',
      idempotencyKey,
      paymentMethod,
      items: totals.items,
      address,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ orderId: orderRef.id, total: totals.total, reused: false });
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error('Configuração do servidor incompleta:', error.message);
      return res.status(500).json({ error: error.message, code: 'CONFIG' });
    }

    if (error instanceof PricingError) {
      return res.status(422).json({ error: error.message, code: error.code });
    }

    console.error('Falha ao criar o pedido:', error);
    return res.status(500).json({ error: 'Não foi possível criar o pedido.' });
  }
}
