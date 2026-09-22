import { z } from 'zod';

// Telefone brasileiro com DDD: 10 dígitos (fixo) ou 11 (celular). Validamos
// sobre os dígitos, ignorando a máscara, para aceitar tanto "11999999999"
// quanto "(11) 99999-9999".
const phoneWithAreaCode = z.string().refine((value) => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}, 'Insira um número de telefone válido com DDD');

export const addressSchema = z.object({
  label: z.string().optional(),
  recipient: z.string().min(3, 'O nome do destinatário deve ter pelo menos 3 caracteres'),
  phone: phoneWithAreaCode,
  cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido (use o formato 00000-000)'),
  street: z.string().min(1, 'A rua é obrigatória'),
  number: z.string().min(1, 'O número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'O bairro é obrigatório'),
  city: z.string().min(1, 'A cidade é obrigatória'),
  // .length(2) já cobre mínimo e máximo — o .min(2) junto era redundante.
  state: z
    .string()
    .length(2, 'Use apenas a sigla do estado (UF), como SP')
    .transform((value) => value.toUpperCase()),
  isDefault: z.boolean().optional().default(false),
});

export type AddressFormData = z.infer<typeof addressSchema>;
