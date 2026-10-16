/** @jest-environment node */
import {
  COMMENT_MAX,
  COMMENT_MIN,
  ReviewError,
  TITLE_MAX,
  buildReview,
  canReview,
  parseReviewInput,
  reviewDocId,
  type OrderForReview,
} from './reviews.js';

const VALID_BODY = {
  sku: 'cam-001',
  rating: 5,
  title: 'Muito bom',
  comment: 'Chegou rápido e o tecido é melhor do que eu esperava.',
};

/** Pedido pago e entregue com a camiseta — o caso que libera a avaliação. */
const DELIVERED: OrderForReview = {
  status: 'paid',
  fulfillment: { status: 'delivered' },
  items: [{ sku: 'cam-001' }, { sku: 'bon-002' }],
};

describe('parseReviewInput', () => {
  it('aceita um corpo válido e devolve os campos limpos', () => {
    const input = parseReviewInput({ ...VALID_BODY, sku: '  cam-001  ' });

    expect(input).toEqual({
      sku: 'cam-001',
      rating: 5,
      title: 'Muito bom',
      comment: VALID_BODY.comment,
    });
  });

  // Este bloco existe por causa de um defeito real: a primeira versão aceitava
  // nota fracionada. Média é fracionada; nota de pessoa não.
  it('recusa nota fracionada', () => {
    expect(() => parseReviewInput({ ...VALID_BODY, rating: 4.7 })).toThrow(ReviewError);
  });

  it('recusa nota fora de 1 a 5', () => {
    expect(() => parseReviewInput({ ...VALID_BODY, rating: 0 })).toThrow(ReviewError);
    expect(() => parseReviewInput({ ...VALID_BODY, rating: 6 })).toThrow(ReviewError);
  });

  it('recusa SKU vazio ou ausente', () => {
    expect(() => parseReviewInput({ ...VALID_BODY, sku: '   ' })).toThrow(ReviewError);
    expect(() => parseReviewInput({ rating: 5, comment: VALID_BODY.comment })).toThrow(
      ReviewError
    );
  });

  it('aceita avaliação sem título', () => {
    expect(parseReviewInput({ ...VALID_BODY, title: '' }).title).toBe('');
  });

  it('respeita os limites de tamanho', () => {
    expect(() =>
      parseReviewInput({ ...VALID_BODY, title: 'a'.repeat(TITLE_MAX + 1) })
    ).toThrow(ReviewError);

    expect(() =>
      parseReviewInput({ ...VALID_BODY, comment: 'a'.repeat(COMMENT_MIN - 1) })
    ).toThrow(ReviewError);

    expect(() =>
      parseReviewInput({ ...VALID_BODY, comment: 'a'.repeat(COMMENT_MAX + 1) })
    ).toThrow(ReviewError);
  });

  it('marca a recusa como INVALID_INPUT, para a rota responder 400', () => {
    try {
      parseReviewInput({ ...VALID_BODY, rating: 99 });
      throw new Error('deveria ter recusado');
    } catch (error) {
      expect(error).toBeInstanceOf(ReviewError);
      expect((error as ReviewError).code).toBe('INVALID_INPUT');
    }
  });

  // O teste que tranca a segurança: quem avalia e o selo de compra são
  // conclusões do servidor. Injetá-los no corpo não pode surtir efeito nenhum.
  it('descarta identidade e selo injetados no corpo', () => {
    const input = parseReviewInput({
      ...VALID_BODY,
      userId: 'outro-usuario',
      userName: 'Equipe da Loja',
      isVerifiedBuyer: true,
    });

    expect(input).not.toHaveProperty('userId');
    expect(input).not.toHaveProperty('userName');
    expect(input).not.toHaveProperty('isVerifiedBuyer');
  });
});

describe('reviewDocId', () => {
  it('é determinístico — a segunda avaliação colide com a primeira', () => {
    expect(reviewDocId('user-1', 'cam-001')).toBe(reviewDocId('user-1', 'cam-001'));
  });

  it('separa pessoas e produtos diferentes', () => {
    expect(reviewDocId('user-1', 'cam-001')).not.toBe(reviewDocId('user-2', 'cam-001'));
    expect(reviewDocId('user-1', 'cam-001')).not.toBe(reviewDocId('user-1', 'bon-002'));
  });

  it('não produz id que o Firestore recusaria', () => {
    const id = reviewDocId('user-1', 'cam-001');

    expect(id).not.toContain('/');
    expect(id).not.toBe('.');
    expect(id).not.toBe('..');
  });
});

describe('canReview', () => {
  it('libera quando o pedido está pago, entregue e contém o SKU', () => {
    expect(canReview([DELIVERED], 'cam-001')).toBe(true);
    expect(canReview([DELIVERED], 'bon-002')).toBe(true);
  });

  it('bloqueia pedido pago que ainda não foi entregue', () => {
    const emTransito: OrderForReview = { ...DELIVERED, fulfillment: { status: 'shipped' } };

    expect(canReview([emTransito], 'cam-001')).toBe(false);
  });

  it('bloqueia pedido sem estado de entrega nenhum', () => {
    expect(canReview([{ ...DELIVERED, fulfillment: undefined }], 'cam-001')).toBe(false);
  });

  // O caso perigoso: o pedido existe e foi entregue, mas o dinheiro não entrou.
  it('bloqueia pedido entregue que não foi pago', () => {
    const naoPago: OrderForReview = { ...DELIVERED, status: 'pending' };

    expect(canReview([naoPago], 'cam-001')).toBe(false);
  });

  it('bloqueia SKU que não está em nenhum pedido', () => {
    expect(canReview([DELIVERED], 'ten-014')).toBe(false);
  });

  it('bloqueia quando não há pedido', () => {
    expect(canReview([], 'cam-001')).toBe(false);
  });

  it('encontra o SKU mesmo quando só um dos pedidos serve', () => {
    const orders: OrderForReview[] = [
      { status: 'pending', fulfillment: { status: 'delivered' }, items: [{ sku: 'ten-014' }] },
      DELIVERED,
    ];

    expect(canReview(orders, 'cam-001')).toBe(true);
    expect(canReview(orders, 'ten-014')).toBe(false);
  });

  it('não quebra com pedido malformado', () => {
    const lixo = [null, {}, { status: 'paid' }, { status: 'paid', items: 'nada' }];

    expect(canReview(lixo as OrderForReview[], 'cam-001')).toBe(false);
  });

  it('recusa SKU vazio', () => {
    expect(canReview([DELIVERED], '')).toBe(false);
  });
});

describe('buildReview', () => {
  const ARGS = {
    sku: 'cam-001',
    userId: 'user-1',
    userName: 'Ana',
    rating: 5,
    title: 'Muito bom',
    comment: VALID_BODY.comment,
  };

  it('monta o documento sem createdAt — quem carimba é a rota', () => {
    expect(buildReview(ARGS)).not.toHaveProperty('createdAt');
  });

  it('omite o título vazio em vez de gravar undefined', () => {
    const body = buildReview({ ...ARGS, title: '' });

    expect(body).not.toHaveProperty('title');
    expect(Object.values(body)).not.toContain(undefined);
  });

  it('não grava selo de compra verificada', () => {
    expect(buildReview(ARGS)).not.toHaveProperty('isVerifiedBuyer');
  });
});
