import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUidFromRequest } from '../_lib/auth.js';
import { ConfigError, getAdminDb } from '../_lib/firebaseAdmin.js';
import {
  PREFERENCES_URL,
  buildPreferencePayload,
  checkoutUrlOf,
  getAccessToken,
  getSiteUrl,
  type PreferenceResponse,
  type StoredOrder,
} from '../_lib/mercadopago.js';

/**
 * POST /api/checkout/create-preference
 *
 * Recebe o id de um pedido já criado e devolve o link do checkout do Mercado
 * Pago. Repare no que NÃO entra pelo corpo da requisição: nenhum valor. O total
 * é lido do documento em `orders`, que só o Admin SDK consegue escrever.
 *
 * Corpo: { orderId }
 */

const MP_TIMEOUT_MS = 10_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const uid = await getUidFromRequest(req);
  if (uid === null) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const body = (req.body ?? {}) as { orderId?: unknown };
  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';

  if (orderId === '') {
    return res.status(400).json({ error: 'ID do pedido é obrigatório.' });
  }

  try {
    const adminDb = getAdminDb();
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    // Mesma resposta para "não existe" e "é de outra pessoa": responder
    // diferente permitiria descobrir quais ids de pedido existem.
    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const order = orderSnap.data() as StoredOrder;

    if (order.uid !== uid) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    if (order.status === 'paid') {
      return res.status(409).json({ error: 'Este pedido já foi pago.' });
    }

    const accessToken = getAccessToken();
    const siteUrl = getSiteUrl();
    const payload = buildPreferencePayload(orderId, order, siteUrl);

    const mpResponse = await fetch(PREFERENCES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        // Dois cliques no botão não podem virar duas preferências.
        'X-Idempotency-Key': `preference-${orderId}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(MP_TIMEOUT_MS),
    });

    if (!mpResponse.ok) {
      const errorBody = await mpResponse.text();
      console.error(
        `Mercado Pago recusou a preferência (HTTP ${mpResponse.status}):`,
        errorBody
      );
      return res.status(502).json({ error: 'Erro ao gerar o pagamento no Mercado Pago.' });
    }

    const preference = (await mpResponse.json()) as PreferenceResponse;
    const url = checkoutUrlOf(preference);

    if (url === null) {
      console.error('Preferência criada sem link de checkout:', preference);
      return res.status(502).json({ error: 'Erro ao gerar o pagamento no Mercado Pago.' });
    }

    // Guardar a preferência serve para conferência depois: quando o webhook
    // chegar, dá para cruzar o pagamento com a tentativa que o originou.
    await orderRef.update({
      status: 'awaiting_payment',
      mercadopagoPreferenceId: preference.id ?? null,
    });

    return res.status(200).json({ url });
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error('Configuração do servidor incompleta:', error.message);
      return res.status(500).json({ error: error.message, code: 'CONFIG' });
    }

    console.error('Falha ao gerar o link do Mercado Pago:', error);
    return res.status(500).json({ error: 'Erro interno no gateway de pagamento.' });
  }
}
