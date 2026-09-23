import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from '../_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { action, data, type } = req.body;

    // Queremos apenas eventos relacionados a pagamentos
    if (action === "payment.created" || action === "payment.updated" || type === "payment") {
      const paymentId = data?.id || req.body.data?.id;

      if (!paymentId) return res.status(400).json({ error: 'ID ausente' });

      // Verificação de Segurança Cruzada: Consulta direta na API deles
      const mpResponse = await fetch(`https://mercadopago.com{paymentId}`, {
        headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN_SANDBOX}` }
      });

      if (!mpResponse.ok) return res.status(500).json({ error: 'Erro ao validar com MP' });

      const paymentData = await mpResponse.json();
      
      const status = paymentData.status; 
      const orderId = paymentData.external_reference; // O ID do pedido que injetamos no Passo 1
      const amountPaid = paymentData.transaction_details.total_paid_amount;

      if (status === 'approved' && orderId) {
        const adminDb = getAdminDb();
        const orderRef = adminDb.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (orderDoc.exists) {
          const order = orderDoc.data()!;
          
          // Validação extra: O valor pago bate com o valor calculado e congelado no servidor?
          if (amountPaid >= order.total) {
            // Atualiza o status de 'pending' para 'paid' (ou o termo que preferir)
            await orderRef.update({
              status: 'paid',
              updatedAt: new Date(),
              mercadopagoPaymentId: paymentId
            });
            console.log(`Pedido ${orderId} atualizado para PAGO.`);
          }
        }
      }
    }

    // O Mercado Pago exige um retorno rápido status 200/201 para não reenviar a notificação
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Erro no processamento do webhook:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
