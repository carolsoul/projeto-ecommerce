/**
 * Integração com o Mercado Pago — a parte que dá para testar sem rede.
 *
 * As duas rotas (`create-preference` e o webhook) compartilham daqui: URL da
 * API, leitura do token, montagem do payload e interpretação do status. Tudo o
 * que é decisão de negócio mora em função pura, para `mercadopago.test.ts`
 * exercitar sem precisar de um servidor do lado de lá.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { ConfigError } from './firebaseAdmin.js';

/**
 * O host da API. O bug que quebrou as duas rotas foi exatamente este valor:
 * `https://mercadopago.com` é o site institucional, não a API — ele responde
 * HTML, nunca JSON. A API vive em api.mercadopago.com.
 */
export const MP_API_BASE = 'https://api.mercadopago.com';

export const PREFERENCES_URL = `${MP_API_BASE}/checkout/preferences`;

export function paymentUrl(paymentId: string | number): string {
  return `${MP_API_BASE}/v1/payments/${encodeURIComponent(String(paymentId))}`;
}

/** Token de acesso do vendedor. Só existe no servidor — nunca com prefixo VITE_. */
export function getAccessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN_SANDBOX ?? process.env.MP_ACCESS_TOKEN;

  if (!token) {
    throw new ConfigError(
      'Variável de ambiente MP_ACCESS_TOKEN_SANDBOX ausente na Vercel. ' +
        'Pegue o token de teste em Mercado Pago > Suas integrações > Credenciais de teste.'
    );
  }

  return token;
}

/**
 * URL pública do site, para montar `back_urls` e `notification_url`.
 *
 * O Mercado Pago exige URLs absolutas e acessíveis: uma `https://vercel.app`
 * genérica faz a API recusar a preferência com `invalid_auto_return`.
 */
export function getSiteUrl(): string {
  const explicit = process.env.PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  // A Vercel injeta estas duas sozinha em toda função.
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (host) return `https://${host}`;

  throw new ConfigError(
    'Não sei a URL pública do site. Defina PUBLIC_SITE_URL na Vercel ' +
      '(ex.: https://projeto-ecommerce-brown.vercel.app).'
  );
}

/** O pedido como está gravado em `orders`, do ponto de vista desta integração. */
export interface StoredOrder {
  uid: string;
  status: string;
  items: { sku: string; name: string; unitPrice: number; quantity: number }[];
  shipping: number;
  tax: number;
  total: number;
  mercadopagoPreferenceId?: string;
}

export interface PreferencePayload {
  items: {
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: 'BRL';
  }[];
  shipments?: { cost: number; mode: 'not_specified' };
  external_reference: string;
  notification_url: string;
  back_urls: { success: string; failure: string; pending: string };
  auto_return: 'approved';
  metadata: { order_id: string; uid: string };
}

/**
 * Monta o corpo da preferência a partir do pedido JÁ gravado.
 *
 * Os preços vêm do documento do pedido, que o `create-order` escreveu com os
 * valores calculados em `pricing.ts`. Nada aqui recalcula nada — se este
 * arquivo pudesse decidir preço, a brecha que fechamos voltaria por outra porta.
 */
export function buildPreferencePayload(
  orderId: string,
  order: StoredOrder,
  siteUrl: string
): PreferencePayload {
  const items: PreferencePayload['items'] = order.items.map((item) => ({
    id: item.sku,
    title: item.name,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    currency_id: 'BRL',
  }));

  // A taxa de serviço não é um produto, mas precisa aparecer para o total
  // cobrado bater com o total do pedido. O Mercado Pago recusa item com
  // unit_price zerado, então só entra quando existe.
  if (order.tax > 0) {
    items.push({
      id: 'taxa-servico',
      title: 'Taxa de serviço',
      quantity: 1,
      unit_price: order.tax,
      currency_id: 'BRL',
    });
  }

  const payload: PreferencePayload = {
    items,
    external_reference: orderId,
    notification_url: `${siteUrl}/api/webhooks/mercadopago`,
    back_urls: {
      success: `${siteUrl}/checkout?status=sucesso&pedido=${orderId}`,
      failure: `${siteUrl}/checkout?status=falha&pedido=${orderId}`,
      pending: `${siteUrl}/checkout?status=pendente&pedido=${orderId}`,
    },
    auto_return: 'approved',
    metadata: { order_id: orderId, uid: order.uid },
  };

  if (order.shipping > 0) {
    payload.shipments = { cost: order.shipping, mode: 'not_specified' };
  }

  return payload;
}

export interface PreferenceResponse {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
}

/**
 * Escolhe para onde mandar o comprador: sempre o `init_point`.
 *
 * A versão anterior preferia o `sandbox_init_point` achando que ele só vinha
 * com credencial de teste. Não é assim — o Mercado Pago devolve os dois campos
 * em qualquer preferência. O efeito era mandar um comprador de credencial
 * `APP_USR-` para o ambiente de sandbox, e o checkout recusava com "uma das
 * partes com as quais você está tentando efetuar o pagamento é de teste".
 *
 * O sandbox foi descontinuado: hoje testar é criar usuários de teste, que têm
 * credenciais `APP_USR-` próprias e pagam pelo `init_point` normal. O fallback
 * só existe para não devolver `null` numa resposta fora do formato esperado.
 */
export function checkoutUrlOf(preference: PreferenceResponse): string | null {
  return preference.init_point ?? preference.sandbox_init_point ?? null;
}

export type OrderPaymentStatus = 'paid' | 'pending' | 'failed' | 'cancelled' | null;

/**
 * Traduz o status do Mercado Pago para o do pedido.
 *
 * `null` significa "não sei, não mexa no pedido" — melhor ignorar um status
 * desconhecido do que marcar como pago algo que não foi.
 */
export function mapPaymentStatus(mpStatus: unknown): OrderPaymentStatus {
  switch (mpStatus) {
    case 'approved':
      return 'paid';
    case 'pending':
    case 'in_process':
    case 'authorized':
      return 'pending';
    case 'rejected':
      return 'failed';
    case 'cancelled':
    case 'refunded':
    case 'charged_back':
      return 'cancelled';
    default:
      return null;
  }
}

/** Quanto foi de fato pago, atravessando os vários formatos de resposta do MP. */
export function paidAmountOf(payment: {
  transaction_details?: { total_paid_amount?: unknown } | null;
  transaction_amount?: unknown;
}): number | null {
  // Em Pix e boleto pendente o bloco transaction_details pode nem vir; a versão
  // anterior acessava `.total_paid_amount` direto e estourava TypeError, o que
  // virava 500 e fazia o Mercado Pago reenviar o webhook em looping.
  const detailed = Number(payment.transaction_details?.total_paid_amount);
  if (Number.isFinite(detailed) && detailed > 0) return detailed;

  const fallback = Number(payment.transaction_amount);
  if (Number.isFinite(fallback) && fallback > 0) return fallback;

  return null;
}

/**
 * O valor pago cobre o total do pedido?
 *
 * Comparado em centavos: `0.1 + 0.2 >= 0.3` é falso em ponto flutuante, e um
 * pedido legítimo ficaria eternamente pendente por causa disso.
 */
export function coversTotal(paid: number | null, total: unknown): boolean {
  if (paid === null) return false;
  if (typeof total !== 'number' || !Number.isFinite(total)) return false;

  return Math.round(paid * 100) >= Math.round(total * 100);
}

/**
 * Confere a assinatura do webhook.
 *
 * O Mercado Pago manda `x-signature: ts=...,v1=...` e assina o texto
 * `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` com a chave secreta da
 * notificação. Sem isso, qualquer pessoa que descubra a URL pode POSTar nela.
 *
 * Quando `secret` não está configurado devolvemos `true`: a rota ainda é segura
 * porque reconsulta o pagamento na API do MP antes de acreditar em qualquer
 * coisa — a assinatura é a segunda tranca, não a única.
 */
export function isSignatureValid(
  headers: { signature?: string | null; requestId?: string | null },
  dataId: string,
  secret: string | undefined
): boolean {
  if (!secret) return true;

  const signature = headers.signature;
  if (typeof signature !== 'string') return false;

  const parts = new Map<string, string>();
  for (const chunk of signature.split(',')) {
    const [key, value] = chunk.split('=');
    if (key && value) parts.set(key.trim(), value.trim());
  }

  const ts = parts.get('ts');
  const v1 = parts.get('v1');
  if (!ts || !v1) return false;

  // O MP normaliza o id para minúsculas ao montar o manifesto.
  const manifest = `id:${dataId.toLowerCase()};request-id:${headers.requestId ?? ''};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  const received = Buffer.from(v1, 'utf8');
  const computed = Buffer.from(expected, 'utf8');

  if (received.length !== computed.length) return false;

  return timingSafeEqual(received, computed);
}
