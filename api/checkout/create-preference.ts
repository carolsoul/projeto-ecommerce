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

    // Segurança: o pedido existe e pertence a quem está logado?
    if (!orderDoc.exists || orderDoc.data()?.uid !== uid) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const orderData = orderDoc.data()!;

    // Cria a preferência na Sandbox do Mercado Pago
    const mpResponse = await fetch('https://mercadopago.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN_SANDBOX}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: `Pedido #${orderId}`,
            quantity: 1,
            unit_price: orderData.total, // Pega o total calculado de forma segura do banco
            currency_id: 'BRL',
          }
        ],
        external_reference: orderId, // Crucial: vincula o ID do pedido no Mercado Pago
        back_urls: {
          success: 'https://vercel.app',
          failure: 'https://vercel.app',
        },
        auto_return: 'approved',
      }),
    });

    const preference = await mpResponse.json();

    // Retorna o link de testes para o frontend abrir
    return res.status(200).json({ url: preference.sandbox_init_point });

  } catch (error) {
    console.error('Falha ao gerar link Mercado Pago:', error);
    return res.status(500).json({ error: 'Erro interno no gateway.' });
  }
}
