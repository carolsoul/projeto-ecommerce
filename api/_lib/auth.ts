import { getAuth } from 'firebase-admin/auth';
import type { VercelRequest } from '@vercel/node';

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
    const decoded = await getAuth().verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    // ATENÇÃO: Adicione este console.error para o erro real subir nos logs da Vercel
    console.error("FALHA NA VERIFICAÇÃO DO TOKEN FIREBASE:", error);
    return null;
  }

}
