import { z } from 'zod';

/**
 * Formulário de avaliação.
 *
 * Validação de experiência. Quem decide de verdade é `parseReviewInput` em
 * `api/_lib/reviews.ts`.
 */
export const reviewSchema = z.object({
  sku: z.string().min(1, 'SKU é obrigatório'),
  rating: z
    .number()
    .int('Escolha uma nota de 1 a 5')
    .min(1, 'Escolha uma nota de 1 a 5')
    .max(5, 'Escolha uma nota de 1 a 5'),
  title: z.string().max(50, 'O título deve ter no máximo 50 caracteres').optional(),
  comment: z
    .string()
    .min(10, 'O comentário deve ter no mínimo 10 caracteres')
    .max(240, 'O comentário deve ter no máximo 240 caracteres'),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
