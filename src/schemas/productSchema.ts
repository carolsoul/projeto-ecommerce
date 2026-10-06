import { z } from 'zod';

/**
 * Uma linha do CSV de produtos.
 */
export const productRowSchema = z
  .object({
    sku: z.coerce.string().min(1, 'SKU é obrigatório'),
    name: z.coerce.string().min(1, 'Nome é obrigatório'),
    imageUrl: z.string().url('URL de imagem inválida'),
    description: z.coerce.string().min(1, 'Descrição é obrigatória'),

    /**
     * Lista de características, separadas por `|` no CSV.
     * Vira `string[]` e é gravada como array no Firestore, para a tela do produto poder renderizar uma lista de verdade .
     */
    features: z.coerce
      .string()
      .min(1, 'Características são obrigatórias')
      .transform((value) =>
        value
          .split('|')
          .map((feature) => feature.trim())
          .filter((feature) => feature !== '')
      )
      .refine((list) => list.length > 0, 'Informe ao menos uma característica'),

    price: z.number().positive('Preço deve ser maior que zero'),
    mrp: z.number().positive('MRP deve ser maior que zero').nullish(),
    rating: z.number().min(0, 'Rating mínimo é 0').max(5, 'Rating máximo é 5'),
    reviewCount: z.number().int('Deve ser um número inteiro').nonnegative('Não pode ser negativo'),
    category: z.coerce.string().optional(),
    stock: z.number().int().nonnegative().nullish(),
  })
  .refine((data) => data.mrp == null || data.mrp >= data.price, {
    message: 'MRP deve ser maior ou igual ao preço',
    path: ['mrp'],
  });

export type ProductRow = z.infer<typeof productRowSchema>;
