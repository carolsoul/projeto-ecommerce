import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDK — o acesso privilegiado do servidor.
 *
 * Diferente do SDK do navegador, este IGNORA as security rules: ele roda como
 * administrador do projeto. É por isso que só pode existir aqui, em /api, e
 * nunca pode ser importado de dentro de src/ — a chave privada não pode chegar
 * ao navegador de jeito nenhum.
 *
 * A inicialização é preguiçosa de propósito. Se fosse no topo do módulo, uma
 * variável de ambiente faltando derrubaria a função ANTES do handler rodar, e a
 * Vercel devolveria um FUNCTION_INVOCATION_FAILED opaco em vez de uma mensagem
 * que diz o que está errado.
 */

/**
 * Erro de configuração do servidor — credencial ausente ou malformada.
 *
 * Tem classe própria porque só acontece na fase de setup, e a mensagem pode ser
 * devolvida ao cliente: dizer "falta FIREBASE_PROJECT_ID" não vaza segredo
 * nenhum, e economiza uma caçada no painel de logs.
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

function buildCredential() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  const missing: string[] = [];
  if (!projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!rawPrivateKey) missing.push('FIREBASE_PRIVATE_KEY');

  if (missing.length > 0) {
    throw new ConfigError(
      `Variáveis de ambiente ausentes na Vercel: ${missing.join(', ')}. ` +
        'Lembre de fazer um novo deploy depois de adicioná-las.'
    );
  }

  // Variável de ambiente guarda a quebra de linha como os dois caracteres "\" e
  // "n". Sem esta troca, o SDK rejeita a chave com um erro de PEM inválido.
  const privateKey = (rawPrivateKey as string).replace(/\\n/g, '\n');

  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new ConfigError(
      'FIREBASE_PRIVATE_KEY não parece uma chave PEM. Copie o valor do campo ' +
        '"private_key" do JSON, do BEGIN ao END, sem as aspas do JSON.'
    );
  }

  return cert({
    projectId: projectId as string,
    clientEmail: clientEmail as string,
    privateKey,
  });
}

let cachedDb: Firestore | null = null;

/**
 * Em serverless a mesma instância é reaproveitada entre requisições, então
 * inicializar duas vezes estoura. Guardamos a conexão já pronta.
 */
export function getAdminDb(): Firestore {
  if (cachedDb !== null) return cachedDb;

  const app = getApps().length > 0 ? getApp() : initializeApp({ credential: buildCredential() });

  cachedDb = getFirestore(app);
  return cachedDb;
}
