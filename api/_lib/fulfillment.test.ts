/** @jest-environment node */
import {
  buildTrackingEvent,
  canTransition,
  describeStatus,
  isFulfillmentStatus,
  requiresPaidOrder,
  type FulfillmentStatus,
} from './fulfillment.js';

describe('isFulfillmentStatus', () => {
  it('aceita os cinco estados do vocabulário', () => {
    for (const status of [
      'processing',
      'shipped',
      'delivered',
      'delivery_failed',
      'returned',
    ]) {
      expect(isFulfillmentStatus(status)).toBe(true);
    }
  });

  it('recusa qualquer outra coisa', () => {
    // Este é o portão de entrada do corpo da requisição: sem ele, um status
    // inventado chegaria até o Firestore e ficaria gravado para sempre.
    expect(isFulfillmentStatus('entregue')).toBe(false);
    expect(isFulfillmentStatus('paid')).toBe(false);
    expect(isFulfillmentStatus('')).toBe(false);
    expect(isFulfillmentStatus(undefined)).toBe(false);
    expect(isFulfillmentStatus(null)).toBe(false);
    expect(isFulfillmentStatus(42)).toBe(false);
  });
});

describe('canTransition', () => {
  it('parte de processing ou shipped quando não há estado anterior', () => {
    expect(canTransition(null, 'processing')).toBe(true);
    // shipped direto existe para os pedidos antigos, que nunca tiveram o campo
    // fulfillment e ficariam presos sem esta porta.
    expect(canTransition(null, 'shipped')).toBe(true);

    expect(canTransition(null, 'delivered')).toBe(false);
    expect(canTransition(null, 'returned')).toBe(false);
    expect(canTransition(null, 'delivery_failed')).toBe(false);
  });

  it('segue o caminho feliz', () => {
    expect(canTransition('processing', 'shipped')).toBe(true);
    expect(canTransition('shipped', 'delivered')).toBe(true);
  });

  it('permite falhar a entrega e tentar de novo', () => {
    expect(canTransition('shipped', 'delivery_failed')).toBe(true);
    expect(canTransition('delivery_failed', 'shipped')).toBe(true);
    expect(canTransition('delivery_failed', 'returned')).toBe(true);
  });

  it('permite devolver depois de entregue', () => {
    expect(canTransition('delivered', 'returned')).toBe(true);
  });

  it('NÃO deixa pular o despacho', () => {
    // A garantia central: nada chega ao cliente sem ter saído daqui.
    expect(canTransition('processing', 'delivered')).toBe(false);
    expect(canTransition('processing', 'delivery_failed')).toBe(false);
  });

  it('NÃO deixa voltar no tempo', () => {
    expect(canTransition('delivered', 'shipped')).toBe(false);
    expect(canTransition('shipped', 'processing')).toBe(false);
    expect(canTransition('delivered', 'processing')).toBe(false);
  });

  it('trata returned como fim de linha', () => {
    for (const destino of [
      'processing',
      'shipped',
      'delivered',
      'delivery_failed',
      'returned',
    ] as FulfillmentStatus[]) {
      expect(canTransition('returned', destino)).toBe(false);
    }
  });

  it('recusa repetir o mesmo estado', () => {
    // Marcar "despachado" duas vezes é quase sempre clique duplo, e sujaria a
    // linha do tempo com um evento que não aconteceu.
    const estados: FulfillmentStatus[] = [
      'processing',
      'shipped',
      'delivered',
      'delivery_failed',
      'returned',
    ];

    for (const estado of estados) {
      expect(canTransition(estado, estado)).toBe(false);
    }
  });

  it('recusa destino que não é um status válido', () => {
    expect(canTransition('shipped', 'entregue' as FulfillmentStatus)).toBe(false);
  });
});

describe('requiresPaidOrder', () => {
  it('exige pagamento só para despachar', () => {
    expect(requiresPaidOrder('shipped')).toBe(true);

    // Os demais descrevem consequências de um despacho que já ocorreu —
    // rechecar o pagamento neles só impediria registrar a realidade.
    expect(requiresPaidOrder('processing')).toBe(false);
    expect(requiresPaidOrder('delivered')).toBe(false);
    expect(requiresPaidOrder('delivery_failed')).toBe(false);
    expect(requiresPaidOrder('returned')).toBe(false);
  });
});

describe('buildTrackingEvent', () => {
  const BASE = { uid: 'user-1', status: 'shipped' as const, source: 'admin' as const };

  it('carrega o uid para dentro do evento', () => {
    // Não é redundância: é o que deixa a regra do Firestore autorizar a leitura
    // sem um get() no pedido pai.
    expect(buildTrackingEvent(BASE).uid).toBe('user-1');
  });

  it('usa a descrição padrão quando nenhuma é informada', () => {
    expect(buildTrackingEvent(BASE).description).toBe(describeStatus('shipped'));
  });

  it('usa a descrição informada, sem espaços nas pontas', () => {
    const evento = buildTrackingEvent({ ...BASE, description: '  Saiu de São Paulo  ' });

    expect(evento.description).toBe('Saiu de São Paulo');
  });

  it('cai para o padrão quando a descrição é só espaço', () => {
    expect(buildTrackingEvent({ ...BASE, description: '   ' }).description).toBe(
      describeStatus('shipped')
    );
  });

  it('OMITE os campos vazios em vez de mandar undefined', () => {
    // O Firestore recusa `undefined` dentro de um documento: deixar a chave com
    // esse valor faria a gravação inteira falhar.
    const evento = buildTrackingEvent(BASE);

    expect(Object.prototype.hasOwnProperty.call(evento, 'location')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(evento, 'idempotencyKey')).toBe(false);
  });

  it('inclui location e idempotencyKey quando vêm preenchidos', () => {
    const evento = buildTrackingEvent({
      ...BASE,
      location: ' Campinas/SP ',
      idempotencyKey: ' abc-123 ',
    });

    expect(evento.location).toBe('Campinas/SP');
    expect(evento.idempotencyKey).toBe('abc-123');
  });

  it('não inventa occurredAt', () => {
    // O carimbo é do Admin SDK e entra na rota. Se ele aparecesse aqui, este
    // teste precisaria de infraestrutura para rodar.
    expect(Object.prototype.hasOwnProperty.call(buildTrackingEvent(BASE), 'occurredAt')).toBe(
      false
    );
  });
});
