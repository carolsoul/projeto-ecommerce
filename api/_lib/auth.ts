import { getAuth } from 'firebase-admin/auth';
import type { VercelRequest } from '@vercel/node';
import { getAdminDb } from './firebaseAdmin.js';
/**
 * Descobre quem está chamando, a partir do ID token do Firebase.
 *
 * O cliente manda o token no header Authorization. NUNCA aceitamos um `uid` no
 * corpo da requisição: qualquer pessoa poderia escrever o uid de outra e ler ou
 * comprar no lugar dela. O token é assinado pelo Firebase e verificado aqui.
 */
export async function getUidFromRequest(req: VercelRequest): Promise<string | null> {
  const header = req.headers.authorization;

  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice('Bearer '.length).trim();
  if (token === '') return null;

  try {
    // `getAuth()` sem argumento exige que o app padrão já exista. Esta chamada
    // está aqui só para garantir a inicialização — o Firestore em si não é
    // usado nesta função.
    getAdminDb();

    const decoded = await getAuth().verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    // Sem este log, um token recusado vira um 401 mudo e não dá para saber se o
    // problema foi expiração, projeto errado ou credencial do servidor.
    console.error('Falha ao verificar o ID token do Firebase:', error);
    return null;
  }
}
