import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUidFromRequest } from '../_lib/auth.js';
import { getAdminDb } from '../_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  // 1. Garante que quem está pedindo o checkout é um usuário logado real
  const uid = await getUidFromRequest(req);
  if (!uid) return res.status(401).json({ error: 'Não autenticado.' });

  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId é obrigatório.' });

  try {
    const adminDb = getAdminDb();
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();

    if (!orderDoc.exists || orderDoc.data()?.uid !== uid) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const orderData = orderDoc.data()!;

    // 2. Criar a preferência na API do Mercado Pago usando seu Access Token da Sandbox
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
            unit_price: orderData.total, // O valor exato e congelado do banco
            currency_id: 'BRL',
          }
        ],
        // O SEGREDO: Guardamos o ID do pedido aqui dentro. O Mercado Pago vai nos devolver isso no Webhook.
        external_reference: orderId, 
        back_urls: {
          success: 'https://vercel.app',
          failure: 'https://vercel.app',
        },
        auto_return: 'approved',
      }),
    });

    const preference = await mpResponse.json();

    // 3. Retorna o link do checkout Sandbox (init_point ou sandbox_init_point)
    return res.status(200).json({ initPoint: preference.sandbox_init_point });

  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    return res.status(500).json({ error: 'Erro interno no gateway de pagamento.' });
  }
}
