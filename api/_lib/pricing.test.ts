import {
  PricingError,
  priceOrder,
  shippingForState,
  toCartLines,
  type CatalogEntry,
} from './pricing.js';

function catalogOf(...entries: CatalogEntry[]): Map<string, CatalogEntry> {
  return new Map(entries.map((entry) => [entry.sku, entry]));
}

const CAMISETA: CatalogEntry = { sku: 'cam-001', name: 'Camiseta', price: 50.0, stock: 10 };

describe('shippingForState', () => {
  it('cobra por região', () => {
    expect(shippingForState('SP')).toBe(15); // sudeste
    expect(shippingForState('RS')).toBe(20); // sul
    expect(shippingForState('GO')).toBe(25); // centro-oeste
    expect(shippingForState('BA')).toBe(30); // nordeste
    expect(shippingForState('AM')).toBe(35); // norte
  });

  it('aceita a sigla em minúsculas e com espaço', () => {
    expect(shippingForState(' sp ')).toBe(15);
  });

  it('devolve null para UF desconhecida', () => {
    expect(shippingForState('XX')).toBeNull();
  });
});

describe('toCartLines', () => {
  it('descarta o preço vindo do navegador', () => {
    // O documento do carrinho tem price, name e imageUrl escritos pelo cliente.
    // Só sku e quantidade podem sobreviver.
    const raw = [{ sku: 'cam-001', quantity: 2, price: 0.01, name: 'Hackeado' }];

    expect(toCartLines(raw)).toEqual([{ sku: 'cam-001', quantity: 2 }]);
  });

  it('ignora quantidade inválida', () => {
    const raw = [
      { sku: 'a', quantity: 0 },
      { sku: 'b', quantity: -5 },
      { sku: 'c', quantity: 1.5 },
      { sku: 'd', quantity: 'muitos' },
      { sku: 'e', quantity: 3 },
    ];

    expect(toCartLines(raw)).toEqual([{ sku: 'e', quantity: 3 }]);
  });
});

describe('priceOrder', () => {
  it('IGNORA o preço forjado no carrinho e usa o do catálogo', () => {
    // Este é o teste que prova a brecha fechada. Alguém gravou price: 0.01 no
    // próprio documento do carrinho pelo console do navegador.
    const forjado = [{ sku: 'cam-001', quantity: 2, price: 0.01 }];
    const lines = toCartLines(forjado);

    const result = priceOrder(lines, catalogOf(CAMISETA), 'SP');

    // 2 x R$50,00 do catálogo — não 2 x R$0,01
    expect(result.subtotal).toBe(100);
    expect(result.items[0].unitPrice).toBe(50);
    expect(result.total).toBe(118); // 100 + 15 frete + 3 taxa
  });

  it('cobra 3% de taxa sobre o subtotal, sem incidir no frete', () => {
    const result = priceOrder([{ sku: 'cam-001', quantity: 2 }], catalogOf(CAMISETA), 'SP');

    expect(result.subtotal).toBe(100);
    expect(result.tax).toBe(3); // 3% de 100, e não de 115
    expect(result.shipping).toBe(15);
    expect(result.total).toBe(118);
  });

  it('arredonda a taxa para centavos', () => {
    const produto: CatalogEntry = { sku: 'x', name: 'X', price: 99.99, stock: 5 };
    const result = priceOrder([{ sku: 'x', quantity: 1 }], catalogOf(produto), 'SP');

    // 3% de 99,99 = 2,9997 -> 3,00
    expect(result.tax).toBe(3);
    expect(result.total).toBe(117.99);
  });

  it('não acumula erro de ponto flutuante', () => {
    // 0.1 + 0.2 em float dá 0.30000000000000004. Somando em centavos, não.
    const produto: CatalogEntry = { sku: 'y', name: 'Y', price: 0.1, stock: 100 };
    const result = priceOrder([{ sku: 'y', quantity: 3 }], catalogOf(produto), 'SP');

    expect(result.subtotal).toBe(0.3);
  });

  it('muda o frete conforme a UF do endereço', () => {
    const sp = priceOrder([{ sku: 'cam-001', quantity: 1 }], catalogOf(CAMISETA), 'SP');
    const am = priceOrder([{ sku: 'cam-001', quantity: 1 }], catalogOf(CAMISETA), 'AM');

    expect(sp.shipping).toBe(15);
    expect(am.shipping).toBe(35);
    expect(am.total - sp.total).toBe(20);
  });

  it('recusa carrinho vazio', () => {
    expect(() => priceOrder([], catalogOf(CAMISETA), 'SP')).toThrow(PricingError);
  });

  it('recusa produto que saiu do catálogo', () => {
    expect(() => priceOrder([{ sku: 'sumiu', quantity: 1 }], catalogOf(CAMISETA), 'SP')).toThrow(
      /não existe mais/
    );
  });

  it('recusa UF para onde não entregamos', () => {
    expect(() => priceOrder([{ sku: 'cam-001', quantity: 1 }], catalogOf(CAMISETA), 'XX')).toThrow(
      /não entregamos/i
    );
  });

  it('recusa quantidade acima do estoque', () => {
    const result = () =>
      priceOrder([{ sku: 'cam-001', quantity: 99 }], catalogOf(CAMISETA), 'SP');

    expect(result).toThrow(/estoque insuficiente/i);
  });
});
