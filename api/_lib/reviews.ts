/**
 * Regras das avaliações de produto — a parte que decide.
 *
 * Como `pricing.ts` e `fulfillment.ts`, este módulo não importa Firebase nem
 * toca em rede: tudo aqui é função pura, exercitada por `reviews.test.ts` sem
 * precisar de infraestrutura. Quem grava é `api/reviews.ts`.
 *
 * A política é: só avalia quem comprou E recebeu. Isso não dá para expressar em
 * security rule — validar exigiria um `get()` em `orders` dentro da regra,
 * leitura cobrada e limitada a 10 por requisição, e o documento da avaliação
 * nem sabe qual pedido o originou. Por isso `reviews` tem
 * `allow write: if false` e a gravação passa por aqui.
 */

export type ReviewErrorCode =
  | 'INVALID_INPUT'
  | 'PRODUCT_NOT_FOUND'
  | 'NOT_DELIVERED'
  | 'ALREADY_REVIEWED';

/**
 * Recusa de regra de negócio, separada de falha de infraestrutura. É o tipo do
 * erro que diz se a resposta é 4xx (quem chamou errou) ou 5xx (deu ruim aqui) —
 * mesmo padrão do `PricingError` e do `FulfillmentError`.
 */
export class ReviewError extends Error {
  readonly code: ReviewErrorCode;

  constructor(message: string, code: ReviewErrorCode) {
    super(message);
    this.name = 'ReviewError';
    this.code = code;
  }
}

/** Limites do texto. Os mesmos do `reviewSchema.ts` no cliente. */
export const TITLE_MAX = 50;
export const COMMENT_MIN = 10;
export const COMMENT_MAX = 240;

/**
 * O que o cliente pode mandar.
 *
 * Repare no que NÃO existe aqui: `userId`, `userName` e qualquer selo de compra
 * verificada. O uid vem do token, o nome é relido de `users/{uid}`, e a
 * verificação é conclusão do servidor sobre `orders`. Ao não existirem neste
 * tipo, o TypeScript torna impossível passá-los adiante por engano — a mesma
 * técnica do `CartLine` em `pricing.ts`, que omite `price` de propósito.
 */
export interface ReviewInput {
  sku: string;
  rating: number;
  title: string;
  comment: string;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Valida e limpa o corpo da requisição.
 *
 * Parser manual, sem Zod, seguindo `create-order.ts` e `tracking.ts`: nenhuma
 * rota desta pasta usa Zod. O schema Zod do cliente (`src/schemas/reviewSchema.ts`)
 * existe para a experiência do formulário; a autoridade é esta função. Os
 * limites de texto são os mesmos nos dois lados de propósito.
 */
export function parseReviewInput(body: unknown): ReviewInput {
  const raw = (body ?? {}) as Record<string, unknown>;

  const sku = readString(raw.sku);
  if (sku === '') {
    throw new ReviewError('O código do produto (SKU) é obrigatório.', 'INVALID_INPUT');
  }

  // Nota é inteira de 1 a 5. `Number.isInteger` é o ponto central: sem ele
  // 4,7 passava, e nota individual fracionada não existe — média é outra coisa.
  const rating = Number(raw.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ReviewError('A nota deve ser um número inteiro de 1 a 5.', 'INVALID_INPUT');
  }

  // Título é opcional, igual ao schema do cliente: nota com comentário e sem
  // título é uma avaliação legítima.
  const title = readString(raw.title);
  if (title.length > TITLE_MAX) {
    throw new ReviewError(
      `O título deve ter no máximo ${TITLE_MAX} caracteres.`,
      'INVALID_INPUT'
    );
  }

  const comment = readString(raw.comment);
  if (comment.length < COMMENT_MIN) {
    throw new ReviewError(
      `O comentário deve ter no mínimo ${COMMENT_MIN} caracteres.`,
      'INVALID_INPUT'
    );
  }
  if (comment.length > COMMENT_MAX) {
    throw new ReviewError(
      `O comentário deve ter no máximo ${COMMENT_MAX} caracteres.`,
      'INVALID_INPUT'
    );
  }

  return { sku, rating, title, comment };
}

/**
 * Id determinístico do documento: uma avaliação por pessoa por produto.
 *
 * A unicidade fica ESTRUTURAL, não dependente de consulta — mesma ideia de usar
 * o SKU como id em `products`, `cart` e `wishlist`. Combinado com o `create()`
 * do Admin SDK (que falha se o documento existe), a segunda avaliação é barrada
 * atomicamente, sem transaction e sem leitura extra.
 *
 * Uid do Firebase é alfanumérico e o SKU já chega normalizado na importação, então
 * o id resultante não contém `/` nem é `.`/`..`, que o Firestore recusaria.
 */
export function reviewDocId(uid: string, sku: string): string {
  return `${uid}_${sku}`;
}

/** O pedido do ponto de vista desta decisão — só o que ela precisa olhar. */
export interface OrderForReview {
  status?: unknown;
  fulfillment?: { status?: unknown } | null;
  items?: unknown;
}

/**
 * A pessoa pode avaliar este SKU?
 *
 * Recebe os pedidos JÁ lidos — é isso que mantém a função pura e testável.
 *
 * As condições de pago e entregue são reconferidas aqui mesmo a rota já
 * filtrando por elas na query. Não é redundância esquecida: é esta função que o
 * teste exercita, e uma que confiasse no chamador não provaria nada sobre a
 * política. Se a query mudar, o portão continua de pé.
 *
 * O SKU é procurado em memória porque `items` é array de MAPS, e o
 * `array-contains` do Firestore só casa o objeto inteiro — não há query que
 * pergunte "algum item tem este sku".
 */
export function canReview(orders: OrderForReview[], sku: string): boolean {
  if (!Array.isArray(orders) || sku === '') return false;

  for (const order of orders) {
    if (order === null || typeof order !== 'object') continue;
    if (order.status !== 'paid') continue;
    if (order.fulfillment?.status !== 'delivered') continue;
    if (!Array.isArray(order.items)) continue;

    for (const item of order.items as { sku?: unknown }[]) {
      if (item !== null && typeof item === 'object' && item.sku === sku) return true;
    }
  }

  return false;
}

export interface ReviewBody {
  sku: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
}

/**
 * Monta o documento — sem o `createdAt`.
 *
 * O carimbo de tempo fica de fora porque `FieldValue.serverTimestamp()` vem do
 * Admin SDK, e importá-lo aqui obrigaria o teste a subir infraestrutura. A rota
 * acrescenta esse único campo. Mesmo arranjo do `buildTrackingEvent`.
 *
 * Título vazio é OMITIDO em vez de ir como `undefined`: o Firestore rejeita
 * `undefined` num documento e a gravação falharia inteira.
 *
 * Não existe campo de "compra verificada": nesta política toda avaliação gravada
 * é de quem comprou e recebeu, então um booleano sempre `true` não distinguiria
 * nada. Se um dia avaliação sem compra for liberada, o campo volta com sentido.
 */
export function buildReview(input: {
  sku: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
}): ReviewBody {
  const body: ReviewBody = {
    sku: input.sku,
    userId: input.userId,
    userName: input.userName,
    rating: input.rating,
    comment: input.comment,
  };

  if (input.title !== '') body.title = input.title;

  return body;
}
