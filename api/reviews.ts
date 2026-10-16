import { FieldValue } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ConfigError, getAdminDb } from './_lib/firebaseAdmin.js';
import { getUidFromRequest } from './_lib/auth.js';
import {
  ReviewError,
  buildReview,
  canReview,
  parseReviewInput,
  reviewDocId,
  type OrderForReview,
} from './_lib/reviews.js';

/**
 * POST /api/reviews
 *
 * Grava a avaliação de um produto. É o único caminho pelo qual `reviews` ganha
 * documento: `firestore.rules` mantém `allow write: if false` na coleção, e esta
 * rota grava pelo Admin SDK, que não é avaliado pelas regras.
 *
 * Corpo: { sku, rating, title?, comment }
 *
 * O arquivo fica em `api/reviews.ts`, e não em `api/_lib/`: a Vercel só roteia
 * o que NÃO começa com `_`. Um handler dentro de `_lib/` nunca seria chamado.
 *
 * Nada que identifique quem avalia vem do corpo — o uid sai do token e o nome é
 * relido de `users/{uid}`. Aceitar o nome do cliente permitiria assinar uma
 * avaliação como "Equipe da Loja".
 */

const HTTP_BY_CODE: Record<ReviewError['code'], number> = {
  INVALID_INPUT: 400,
  PRODUCT_NOT_FOUND: 404,
  NOT_DELIVERED: 403,
  ALREADY_REVIEWED: 409,
};

/** O Firestore devolve o código gRPC 6 (ALREADY_EXISTS) quando o `create()` colide. */
function isAlreadyExists(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === 6;
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

  try {
    const { sku, rating, title, comment } = parseReviewInput(req.body);
    const adminDb = getAdminDb();

    const productSnap = await adminDb.doc(`products/${sku}`).get();
    if (!productSnap.exists) {
      throw new ReviewError('Este produto não existe.', 'PRODUCT_NOT_FOUND');
    }

    // Três filtros de IGUALDADE: nenhum índice composto necessário, pelo mesmo
    // zigzag merge join que o `create-order` usa. `fulfillment.status` é field
    // path válido, e subcampo de map é indexado automaticamente.
    const ordersSnap = await adminDb
      .collection('orders')
      .where('uid', '==', uid)
      .where('status', '==', 'paid')
      .where('fulfillment.status', '==', 'delivered')
      .get();

    const orders = ordersSnap.docs.map((doc) => doc.data() as OrderForReview);

    if (!canReview(orders, sku)) {
      throw new ReviewError(
        'Você só pode avaliar produtos que já comprou e recebeu.',
        'NOT_DELIVERED'
      );
    }

    // O nome vem do perfil, nunca do corpo da requisição. Fica desnormalizado
    // dentro da avaliação porque as regras impedem ler `users/{uid}` de outra
    // pessoa — sem a cópia, a lista de avaliações seria impossível de renderizar.
    const userSnap = await adminDb.doc(`users/${uid}`).get();
    const profileName = userSnap.data()?.name;
    const userName =
      typeof profileName === 'string' && profileName.trim() !== ''
        ? profileName.trim()
        : 'Cliente';

    const reviewId = reviewDocId(uid, sku);

    // `create()`, não `set()`: ele falha se o documento já existe, e é essa
    // falha que barra a segunda avaliação do mesmo produto — atômico, sem
    // transaction e sem consulta extra.
    await adminDb.doc(`reviews/${reviewId}`).create({
      ...buildReview({ sku, userId: uid, userName, rating, title, comment }),
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ reviewId });
  } catch (error) {
    if (error instanceof ReviewError) {
      return res.status(HTTP_BY_CODE[error.code]).json({
        error: error.message,
        code: error.code,
      });
    }

    if (isAlreadyExists(error)) {
      return res.status(409).json({
        error: 'Você já avaliou este produto.',
        code: 'ALREADY_REVIEWED',
      });
    }

    if (error instanceof ConfigError) {
      console.error('Configuração do servidor incompleta:', error.message);
      return res.status(500).json({ error: error.message, code: 'CONFIG' });
    }

    console.error('Falha ao gravar a avaliação:', error);
    return res.status(500).json({ error: 'Não foi possível salvar sua avaliação.' });
  }
}
