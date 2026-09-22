import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUidFromRequest } from '../_lib/auth';
import { loadOrderContext } from '../_lib/loadOrderContext';
import { PricingError } from '../_lib/pricing';

/**
 * POST /api/checkout/quote
 *
 * Devolve os valores do pedido calculados no servidor. É isto que alimenta os
 * números da tela de checkout — nenhum valor exibido ao cliente é calculado
 * pelo navegador.
 *
 * Corpo: { addressId }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const uid = await getUidFromRequest(req);
  if (uid === null) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const addressId = (req.body as { addressId?: unknown })?.addressId;
  if (typeof addressId !== 'string' || addressId.trim() === '') {
    return res.status(400).json({ error: 'Informe o endereço de entrega.' });
  }

  try {
    const { totals } = await loadOrderContext(uid, addressId);
    return res.status(200).json(totals);
  } catch (error) {
    if (error instanceof PricingError) {
      return res.status(422).json({ error: error.message, code: error.code });
    }

    console.error('Falha ao calcular o pedido:', error);
    return res.status(500).json({ error: 'Não foi possível calcular o pedido.' });
  }
}
