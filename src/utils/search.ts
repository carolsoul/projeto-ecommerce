import { type Product } from '../types/products';

/**
 * Normaliza texto para comparação: sem acento, minúsculo, sem espaço sobrando.
 * Em português isso é essencial — sem normalizar, "cafe" não encontra "Café".
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Busca pelo nome do produto. Todos os termos digitados precisam aparecer, em
 * qualquer ordem — "camiseta azul" encontra "Camiseta Básica Azul".
 */
export function matchesSearch(product: Product, searchTerm: string): boolean {
  const terms = normalizeText(searchTerm).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const haystack = normalizeText(product.name);
  return terms.every((term) => haystack.includes(term));
}

export interface CategoryTile {
  name: string;
  imageUrl: string;
}

/**
 * Categorias com uma imagem representativa — a do primeiro produto encontrado
 * em cada uma. É o que permite os cards da Home saírem de imagens fixas e
 * passarem a refletir o catálogo real, sem exigir coluna nova no CSV.
 */
export function collectCategoryTiles(products: Product[]): CategoryTile[] {
  const imageByCategory = new Map<string, string>();

  for (const product of products) {
    const category = product.category;
    if (typeof category !== 'string') continue;

    const name = category.trim();
    if (name === '' || imageByCategory.has(name)) continue;

    imageByCategory.set(name, product.imageUrl);
  }

  return [...imageByCategory.entries()]
    .map(([name, imageUrl]) => ({ name, imageUrl }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/**
 * Categorias presentes num conjunto de produtos, ordenadas alfabeticamente.
 * Só faz sentido oferecer como filtro o que de fato existe nos resultados.
 */
export function collectCategories(products: Product[]): string[] {
  const categories = new Set<string>();

  for (const product of products) {
    const category = product.category;
    if (typeof category === 'string' && category.trim() !== '') {
      categories.add(category.trim());
    }
  }

  return [...categories].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
