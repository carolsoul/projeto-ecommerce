import { z } from 'zod';

export const productRowSchema = z
.object({
  sku: z.string().min(1, 'SKU é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  imageUrl: z.string().url('URL de imagem inválida'),
  price: z.number().positive('Preço deve ser maior que zero'),
  mrp: z.number().positive('MRP deve ser maior que zero').nullish(),
  rating: z.number().min(0, 'Rating mínimo é 0').max(5, 'Rating máximo é 5'),
  reviewCount: z.number().int('Deve ser um número inteiro').nonnegative('Não pode ser negativo'),
  category: z.string().optional(),
  stock: z.number().int().nonnegative().nullish(),
})
.refine((data) => data.mrp == null || data.mrp >= data.price, {
  message: 'MRP deve ser maior ou igual ao preço',
  path: ['mrp'],
});

export type ProductRow = z.infer<typeof productRowSchema>;