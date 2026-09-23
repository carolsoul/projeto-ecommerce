import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from '../_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { action, data, type } = req.body;

    if (action === "payment.created" || action === "payment.updated" || type === "payment") {
      const paymentId = data?.id || req.body.data?.id;
      if (!paymentId) return res.status(400).json({ error: 'ID ausente' });

      // Handshake de segurança com o Mercado Pago
      const mpResponse = await fetch(`https://mercadopago.com{paymentId}`, {
        headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN_SANDBOX}` }
      });

      if (!mpResponse.ok) return res.status(500).json({ error: 'Erro ao validar com MP' });
      const paymentData = await mpResponse.json();
      
      const status = paymentData.status; 
      const orderId = paymentData.external_reference; 
      const amountPaid = paymentData.transaction_details.total_paid_amount;

      if (status === 'approved' && orderId) {
        const adminDb = getAdminDb();
        const orderRef = adminDb.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (orderDoc.exists && amountPaid >= orderDoc.data()!.total) {
          await orderRef.update({
            status: 'paid',
            updatedAt: new Date(),
            mercadopagoPaymentId: paymentId
          });
        }
      }
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
