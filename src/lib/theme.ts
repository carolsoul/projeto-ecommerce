/**
 * Paleta da loja, em classes completas do Tailwind.
 */

/** Fundo das páginas da loja, antigo FBEDE6. */
export const CREAM = 'bg-[#f8efde]';

/** Fundo dos cartões, um tom acima do creme, antigo FDF6F1 */
export const CARD = 'bg-[#fcf6ed]';

/** Superfície rosa: miniaturas, botões circulares, pílulas. */
export const PINK = 'bg-[#F8CEC6]';
export const PINK_HOVER = 'hover:bg-[#F3BCB1]';

/** Vermelho da marca: títulos, preços, ações principais. */
export const BRAND = 'text-[#C23B2B]';
export const BRAND_HOVER = 'hover:text-[#A93224]';
export const BRAND_BG = 'bg-[#C23B2B]';
export const BRAND_BG_HOVER = 'hover:bg-[#A93224]';
export const BRAND_BORDER = 'border-[#C23B2B]';

/** Salmão do logo circular, o único tom que não é marca nem creme. */
export const LOGO_BG = 'bg-[#F28C7E]';
export const LOGO_BG_HOVER = 'hover:bg-[#EE7B6B]';

/** Texto secundário, sobre o creme. */
export const MUTED = 'text-[#B4675C]';

/** Texto terciário: legendas, placeholders, informação de apoio. */
export const SUBTLE = 'text-[#C9A396]';

/** Divisórias e bordas discretas, nos três prefixos que o projeto usa. */
export const BORDER = 'border-[#F0D6CC]';
export const DIVIDE = 'divide-[#F0D6CC]';
export const OUTLINE = 'outline-[#F0D6CC]';

/** Estado desabilitado de botão. */
export const DISABLED = 'disabled:bg-[#E7CFC6] disabled:border-[#E7CFC6]';

/**
 * Vermelho de erro, distinto do vermelho da marca.
 *
 * Mora aqui para ficar centralizado, mas é semântico: mensagem de validação e
 * ação destrutiva. Não troque por BRAND — a pessoa precisa distinguir "isto é
 * da loja" de "isto deu errado".
 */
export const DANGER = 'text-red-600';

/** Anel de foco, para teclado. */
export const RING = 'focus-visible:ring-[#C23B2B]';
export const FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C23B2B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8efde]';

/** Contorno de campo em foco, para os formulários que usam `outline` em vez de `ring`. */
export const OUTLINE_FOCUS = 'focus-within:outline-[#C23B2B] focus:outline-[#C23B2B]';

/** Botão circular das ações de linha (quantidade, remover). */
export const ROUND_BUTTON = `inline-flex size-7 shrink-0 items-center justify-center rounded-full ${PINK} ${PINK_HOVER} ${BRAND} transition-colors cursor-pointer ${FOCUS}`;

/** Botão primário, o de ação principal de cada tela. */
export const PRIMARY_BUTTON = `rounded-full ${BRAND_BG} ${BRAND_BG_HOVER} px-4 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer ${DISABLED} disabled:cursor-not-allowed ${FOCUS}`;

/** Botão secundário, sobre o creme. */
export const SECONDARY_BUTTON = `rounded-full ${CARD} ${BORDER} ${BRAND} ${PINK_HOVER} border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${FOCUS}`;

/** Texto sobre o vermelho da marca (botões, badges preenchidos). */
export const ON_BRAND = 'text-[#f8efde]';

/**
 * Cor do anel que "corta" a linha vertical do stepper.
 *
 * Tem que ser igual ao fundo da página, senão o anel vira um halo visível. Era
 * `ring-white` quando o fundo era branco; com o creme, precisa acompanhar.
 */
export const RING_GAP = 'ring-[#f8efde]';

/** Cor do `accent-color` de inputs nativos (checkbox, radio, range). */
export const ACCENT = 'accent-[#C23B2B]';

/** Deslocamento do anel de foco: tem que ser o fundo da página. */
export const RING_OFFSET = 'focus-visible:ring-offset-[#f8efde]';

/** Ícones em SVG preenchido, quando são apoio e não ação. */
export const FILL_SUBTLE = 'fill-[#C9A396]';

/** Estrelas de avaliação: preenchida e vazia. */
export const STAR_ON = 'fill-[#E8A33D]';
export const STAR_OFF = 'fill-[#E7D9C9]';

/* ── Variantes prefixadas ──────────────────────────────────────────────────
 *
 * Existem porque `hover:${BRAND}` NÃO funciona. O Tailwind varre o código atrás
 * de nomes de classe literais; escrever o prefixo fora da constante produz
 * `hover:text-[#C23B2B]` apenas em tempo de execução, e essa classe nunca é
 * gerada no CSS. Cada combinação prefixo+cor precisa existir inteira, escrita
 * aqui uma vez.
 */

export const HOVER_BRAND = 'hover:text-[#C23B2B]';
export const HOVER_ON_BRAND = 'hover:text-[#f8efde]';
export const HOVER_PINK = 'hover:bg-[#F8CEC6]';
export const HOVER_BRAND_BORDER = 'hover:border-[#C23B2B]';
export const FOCUS_BRAND_BORDER = 'focus:border-[#C23B2B]';
export const PLACEHOLDER_MUTED = 'placeholder:text-[#B4675C]';
export const DISABLED_SUBTLE = 'disabled:text-[#C9A396]';
export const DISABLED_PINK = 'disabled:bg-[#F8CEC6]';
export const DISABLED_BORDER = 'disabled:border-[#F0D6CC]';
export const LG_BORDER = 'lg:border-[#F0D6CC]';
export const CHECKED_BRAND = 'checked:bg-[#C23B2B]';
export const FOCUS_RING = 'focus:outline-none focus:ring-2 focus:ring-[#C23B2B]';
