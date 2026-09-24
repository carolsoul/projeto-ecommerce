/** @jest-environment node */
import { createHmac } from 'node:crypto';
import {
  MP_API_BASE,
  PREFERENCES_URL,
  buildPreferencePayload,
  checkoutUrlOf,
  coversTotal,
  isSignatureValid,
  mapPaymentStatus,
  paidAmountOf,
  paymentUrl,
  type StoredOrder,
} from './mercadopago.js';

const SITE = 'https://loja.example.com';

const ORDER: StoredOrder = {
  uid: 'user-1',
  status: 'pending',
  items: [{ sku: 'cam-001', name: 'Camiseta', unitPrice: 50, quantity: 2 }],
  shipping: 15,
  tax: 3,
  total: 118,
};

describe('URLs da API', () => {
  // Este bloco existe por causa de um bug real: as duas rotas apontavam para
  // https://mercadopago.com, o site institucional, que devolve HTML.
  it('usa o host da API, não o site institucional', () => {
    expect(MP_API_BASE).toBe('https://api.mercadopago.com');
    expect(PREFERENCES_URL).toBe('https://api.mercadopago.com/checkout/preferences');
  });

  it('monta a URL do pagamento com o id interpolado', () => {
    expect(paymentUrl('123456')).toBe('https://api.mercadopago.com/v1/payments/123456');
    expect(paymentUrl(987)).toBe('https://api.mercadopago.com/v1/payments/987');
  });

  it('não deixa o id vazar para fora do caminho', () => {
    expect(paymentUrl('../../hack')).not.toContain('../');
  });
});

describe('buildPreferencePayload', () => {
  it('soma itens, frete e taxa exatamente no total do pedido', () => {
    const payload = buildPreferencePayload('order-1', ORDER, SITE);

    const itemsTotal = payload.items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    const shipping = payload.shipments?.cost ?? 0;

    expect(itemsTotal + shipping).toBeCloseTo(ORDER.total, 2);
  });

  it('usa os preços gravados no pedido, nunca recalcula', () => {
    const payload = buildPreferencePayload('order-1', ORDER, SITE);

    expect(payload.items[0]).toMatchObject({ unit_price: 50, quantity: 2, currency_id: 'BRL' });
  });

  it('aponta a notificação para o webhook deste site', () => {
    const payload = buildPreferencePayload('order-1', ORDER, SITE);

    expect(payload.notification_url).toBe(`${SITE}/api/webhooks/mercadopago`);
  });

  it('usa back_urls absolutas do próprio site', () => {
    const payload = buildPreferencePayload('order-1', ORDER, SITE);

    for (const url of Object.values(payload.back_urls)) {
      expect(url.startsWith(`${SITE}/`)).toBe(true);
    }
  });

  it('manda as três back_urls para a tela de retorno, com o id no caminho', () => {
    const payload = buildPreferencePayload('order-1', ORDER, SITE);
    const esperada = `${SITE}/checkout/retorno/order-1`;

    expect(payload.back_urls.success).toBe(esperada);
    expect(payload.back_urls.failure).toBe(esperada);
    expect(payload.back_urls.pending).toBe(esperada);
  });

  it('não põe query string própria na back_url', () => {
    const payload = buildPreferencePayload('order-1', ORDER, SITE);

    // O MP anexa a query dele na volta, incluindo um `status`. Um `status`
    // nosso na mesma URL colidiria com o dele.
    for (const url of Object.values(payload.back_urls)) {
      expect(url).not.toContain('?');
    }
  });

  it('escapa o id do pedido no caminho da back_url', () => {
    const payload = buildPreferencePayload('a/../b', ORDER, SITE);

    expect(payload.back_urls.success).toBe(`${SITE}/checkout/retorno/a%2F..%2Fb`);
  });

  it('liga o pagamento ao pedido por external_reference', () => {
    const payload = buildPreferencePayload('order-42', ORDER, SITE);

    expect(payload.external_reference).toBe('order-42');
    expect(payload.metadata).toEqual({ order_id: 'order-42', uid: 'user-1' });
  });

  it('omite taxa e frete zerados (o MP recusa item com preço 0)', () => {
    const semExtras: StoredOrder = { ...ORDER, shipping: 0, tax: 0, total: 100 };
    const payload = buildPreferencePayload('order-1', semExtras, SITE);

    expect(payload.shipments).toBeUndefined();
    expect(payload.items).toHaveLength(1);
  });
});

describe('checkoutUrlOf', () => {
  it('ignora o link de sandbox mesmo quando ele vem junto', () => {
    // O MP devolve os dois campos em toda preferência. Mandar o comprador para
    // o sandbox com credencial APP_USR- faz o checkout recusar o pagamento.
    expect(
      checkoutUrlOf({ init_point: 'https://prod', sandbox_init_point: 'https://sandbox' })
    ).toBe('https://prod');
  });

  it('usa o link de produção quando é o único', () => {
    expect(checkoutUrlOf({ init_point: 'https://prod' })).toBe('https://prod');
  });

  it('cai para o sandbox só quando não veio init_point', () => {
    expect(checkoutUrlOf({ sandbox_init_point: 'https://sandbox' })).toBe('https://sandbox');
  });

  it('devolve null quando a resposta não trouxe link nenhum', () => {
    expect(checkoutUrlOf({ id: 'abc' })).toBeNull();
  });
});

describe('mapPaymentStatus', () => {
  it('traduz os status conhecidos', () => {
    expect(mapPaymentStatus('approved')).toBe('paid');
    expect(mapPaymentStatus('pending')).toBe('pending');
    expect(mapPaymentStatus('in_process')).toBe('pending');
    expect(mapPaymentStatus('rejected')).toBe('failed');
    expect(mapPaymentStatus('refunded')).toBe('cancelled');
  });

  it('devolve null para status desconhecido, para não mexer no pedido', () => {
    expect(mapPaymentStatus('coisa_nova')).toBeNull();
    expect(mapPaymentStatus(undefined)).toBeNull();
  });
});

describe('paidAmountOf', () => {
  it('lê o valor detalhado quando ele vem', () => {
    expect(paidAmountOf({ transaction_details: { total_paid_amount: 118 } })).toBe(118);
  });

  it('não estoura quando transaction_details não existe', () => {
    // Era aqui que o webhook quebrava com TypeError em pagamentos Pix pendentes.
    expect(paidAmountOf({ transaction_amount: 118 })).toBe(118);
    expect(paidAmountOf({ transaction_details: null, transaction_amount: 118 })).toBe(118);
    expect(paidAmountOf({})).toBeNull();
  });
});

describe('coversTotal', () => {
  it('aceita o valor exato sem tropeçar em ponto flutuante', () => {
    expect(coversTotal(0.3, 0.1 + 0.2)).toBe(true);
  });

  it('aceita pagamento maior que o total', () => {
    expect(coversTotal(200, 118)).toBe(true);
  });

  it('RECUSA pagamento menor que o total do servidor', () => {
    expect(coversTotal(0.01, 118)).toBe(false);
  });

  it('recusa quando não sabe o valor pago ou o total', () => {
    expect(coversTotal(null, 118)).toBe(false);
    expect(coversTotal(118, undefined)).toBe(false);
  });
});

describe('isSignatureValid', () => {
  const SECRET = 'segredo-de-teste';
  const REQUEST_ID = 'req-abc';
  const TS = '1700000000';

  function signatureFor(dataId: string, secret = SECRET): string {
    const manifest = `id:${dataId.toLowerCase()};request-id:${REQUEST_ID};ts:${TS};`;
    const hash = createHmac('sha256', secret).update(manifest).digest('hex');
    return `ts=${TS},v1=${hash}`;
  }

  it('aceita a assinatura correta', () => {
    const ok = isSignatureValid(
      { signature: signatureFor('123'), requestId: REQUEST_ID },
      '123',
      SECRET
    );

    expect(ok).toBe(true);
  });

  it('recusa assinatura feita com outra chave', () => {
    const ok = isSignatureValid(
      { signature: signatureFor('123', 'chave-errada'), requestId: REQUEST_ID },
      '123',
      SECRET
    );

    expect(ok).toBe(false);
  });

  it('recusa quando o id do pagamento foi trocado', () => {
    const ok = isSignatureValid(
      { signature: signatureFor('123'), requestId: REQUEST_ID },
      '999',
      SECRET
    );

    expect(ok).toBe(false);
  });

  it('recusa header ausente ou malformado', () => {
    expect(isSignatureValid({ signature: null, requestId: REQUEST_ID }, '123', SECRET)).toBe(false);
    expect(isSignatureValid({ signature: 'lixo', requestId: REQUEST_ID }, '123', SECRET)).toBe(
      false
    );
  });

  it('passa direto quando não há segredo configurado (o handshake ainda protege)', () => {
    expect(isSignatureValid({ signature: null, requestId: null }, '123', undefined)).toBe(true);
  });
});
