import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDK — o acesso privilegiado do servidor.
 *
 * Diferente do SDK do navegador, este IGNORA as security rules: ele roda como
 * administrador do projeto. É por isso que só pode existir aqui, em /api, e
 * nunca pode ser importado de dentro de src/ — a chave privada não pode chegar
 * ao navegador de jeito nenhum.
 */

function buildCredential() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error(
      'Faltam credenciais do Firebase Admin. Defina FIREBASE_PROJECT_ID, ' +
        'FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY nas variáveis de ambiente.'
    );
  }

  // Variável de ambiente guarda a quebra de linha como os dois caracteres "\" e
  // "n". Sem esta troca, o SDK rejeita a chave com um erro de PEM inválido.
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

  return cert({ projectId, clientEmail, privateKey });
}

/**
 * Em serverless a mesma instância é reaproveitada entre requisições, então
 * inicializar duas vezes estoura. Só criamos o app se ainda não existir.
 */
function getAdminApp() {
  if (getApps().length > 0) return getApp();
  return initializeApp({ credential: buildCredential() });
}

export const adminDb = getFirestore(getAdminApp());
