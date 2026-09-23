// /api/checkout/create-preference.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUidFromRequest } from '../_lib/auth.js';
import { getAdminDb } from '../_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const uid = await getUidFromRequest(req);
  if (uid === null) return res.status(401).json({ error: 'Não autenticado.' });

  const { orderId } = req.body as { orderId?: string };
  if (!orderId) return res.status(400).json({ error: 'ID do pedido é obrigatório.' });

  try {
    const adminDb = getAdminDb();
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();

    if (!orderDoc.exists || orderDoc.data()?.uid !== uid) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const orderData = orderDoc.data()!;

    const mpResponse = await fetch('https://mercadopago.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN_SANDBOX}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: orderId,
            title: `Pedido #${orderId}`,
            quantity: 1,
            unit_price: orderData.total, 
            currency_id: 'BRL',
          }
        ],
        external_reference: orderId, 
        back_urls: {
          success: 'https://vercel.app',
          failure: 'https://vercel.app',
        },
        auto_return: 'approved',
      }),
    });

    if (!mpResponse.ok) {
      const errorBody = await mpResponse.text();
      console.error('Erro retornado pelo Mercado Pago:', errorBody);
      return res.status(500).json({ error: 'Erro ao gerar preferência no Mercado Pago.' });
    }

    const preference = await mpResponse.json();

    // Retorna o link de testes correto gerado pela API deles
    return res.status(200).json({ url: preference.sandbox_init_point });

  } catch (error) {
    console.error('Falha ao gerar link Mercado Pago:', error);
    return res.status(500).json({ error: 'Erro interno no gateway.' });
  }
}
