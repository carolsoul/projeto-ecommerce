/**
 * Cálculo de valores do pedido — a autoridade sobre dinheiro.
 *
 * Este módulo vive em /api e NUNCA é empacotado no bundle do navegador. As
 * regras de frete e taxa não estão no código que o cliente baixa: ele não tem
 * como lê-las nem como forjá-las. O cliente recebe os números prontos.
 *
 * Tudo aqui é função pura, sem Firebase e sem rede, justamente para poder ser
 * testado sem infraestrutura nenhuma.
 */

export type Region = 'norte' | 'nordeste' | 'centro-oeste' | 'sudeste' | 'sul';

/** Taxa de serviço: 3% sobre o subtotal (produtos), sem incidir sobre o frete. */
const TAX_RATE = 0.03;

/**
 * Frete por região, em reais. ESTE é o único lugar que define preço de frete —
 * ajuste aqui e o checkout inteiro acompanha.
 */
const SHIPPING_BY_REGION: Record<Region, number> = {
  sudeste: 15.0,
  sul: 20.0,
  'centro-oeste': 25.0,
  nordeste: 30.0,
  norte: 35.0,
};

const REGION_BY_STATE: Record<string, Region> = {
  AC: 'norte', AP: 'norte', AM: 'norte', PA: 'norte',
  RO: 'norte', RR: 'norte', TO: 'norte',

  AL: 'nordeste', BA: 'nordeste', CE: 'nordeste', MA: 'nordeste',
  PB: 'nordeste', PE: 'nordeste', PI: 'nordeste', RN: 'nordeste', SE: 'nordeste',

  DF: 'centro-oeste', GO: 'centro-oeste', MT: 'centro-oeste', MS: 'centro-oeste',

  ES: 'sudeste', MG: 'sudeste', RJ: 'sudeste', SP: 'sudeste',

  PR: 'sul', RS: 'sul', SC: 'sul',
};

/**
 * Item do carrinho como o servidor o enxerga.
 *
 * Repare no que NÃO existe aqui: preço. O documento em users/{uid}/cart guarda
 * um `price` escrito pelo navegador — e é justamente esse campo que alguém
 * poderia adulterar para R$0,01. Ao não existir neste tipo, o TypeScript torna
 * impossível passá-lo adiante por engano: a regra de segurança vira regra de
 * compilação.
 */
export interface CartLine {
  sku: string;
  quantity: number;
}

/** Produto como está em `products`, que só admin escreve. Esta é a fonte da verdade. */
export interface CatalogEntry {
  sku: string;
  name: string;
  price: number;
  imageUrl: string;
  stock?: number | null;
}

export interface PricedItem {
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string;
}

export interface OrderTotals {
  items: PricedItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

// Dinheiro em ponto flutuante acumula erro: 0.1 + 0.2 dá 0.30000000000000004.Soma tudo em centavos (inteiros) e só converte de volta no fim.
function toCents(value: number): number {
  return Math.round(value * 100);
}

function toReais(cents: number): number {
  return cents / 100;
}

/** Devolve o frete para uma UF, ou null se a sigla não for reconhecida. */
export function shippingForState(state: string): number | null {
  const region = REGION_BY_STATE[state.trim().toUpperCase()];
  if (region === undefined) return null;
  return SHIPPING_BY_REGION[region];
}

/**
 * Converte os documentos crus do carrinho e descarta tudo menos SKU e quantidade. Nome e preço são relidos do catálogo depois.
 */
export function toCartLines(rawItems: { sku: string; quantity: unknown }[]): CartLine[] {
  const lines: CartLine[] = [];

  for (const raw of rawItems) {
    const quantity = Number(raw.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) continue;
    if (typeof raw.sku !== 'string' || raw.sku.trim() === '') continue;

    lines.push({ sku: raw.sku, quantity });
  }

  return lines;
}

export type PricingErrorCode =
  | 'EMPTY_CART'
  | 'UNKNOWN_PRODUCT'
  | 'UNKNOWN_STATE'
  | 'OUT_OF_STOCK';

export class PricingError extends Error {
  readonly code: PricingErrorCode;

  constructor(message: string, code: PricingErrorCode) {
    super(message);
    this.name = 'PricingError';
    this.code = code;
  }
}

/**
 * Calcula os valores do pedido.
 *
 * O preço unitário SEMPRE vem do `catalog` (lido de `products` no Firestore), nunca do carrinho.
 */
export function priceOrder(
  lines: CartLine[],
  catalog: Map<string, CatalogEntry>,
  state: string
): OrderTotals {
  if (lines.length === 0) {
    throw new PricingError('O carrinho está vazio.', 'EMPTY_CART');
  }

  const shipping = shippingForState(state);
  if (shipping === null) {
    throw new PricingError(`Não entregamos para a UF "${state}".`, 'UNKNOWN_STATE');
  }

  const items: PricedItem[] = [];
  let subtotalCents = 0;

  for (const line of lines) {
    const product = catalog.get(line.sku);

    if (product === undefined) {
      throw new PricingError(`Produto "${line.sku}" não existe mais.`, 'UNKNOWN_PRODUCT');
    }

    if (typeof product.stock === 'number' && product.stock < line.quantity) {
      throw new PricingError(
        `Estoque insuficiente para "${product.name}".`,
        'OUT_OF_STOCK'
      );
    }

    const unitCents = toCents(product.price);
    const lineCents = unitCents * line.quantity;

    subtotalCents += lineCents;

    items.push({
      sku: line.sku,
      name: product.name,
      unitPrice: toReais(unitCents),
      quantity: line.quantity,
      lineTotal: toReais(lineCents),
      imageUrl: product.imageUrl,
    });
  }

  const shippingCents = toCents(shipping);
  const taxCents = Math.round(subtotalCents * TAX_RATE);

  return {
    items,
    subtotal: toReais(subtotalCents),
    shipping: toReais(shippingCents),
    tax: toReais(taxCents),
    total: toReais(subtotalCents + shippingCents + taxCents),
  };
}
