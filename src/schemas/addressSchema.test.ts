import { addressSchema } from './addressSchema';

const validAddress = {
  label: 'Trabalho',
  recipient: 'João Silva',
  phone: '11999999999',
  cep: '01310-100',
  street: 'Avenida Paulista',
  number: '1000',
  complement: 'Apto 42',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  isDefault: true,
};

describe('addressSchema', () => {
  it('aceita um endereço válido', () => {
    const result = addressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it('aceita CEP começando com zero', () => {
    // Este é o caso que o regex quebrado rejeitava. Todo CEP de São Paulo
    // começa com zero, então errar aqui derruba um estado inteiro.
    const result = addressSchema.safeParse({ ...validAddress, cep: '01001-000' });
    expect(result.success).toBe(true);
  });

  it('rejeita CEP sem hífen', () => {
    const result = addressSchema.safeParse({ ...validAddress, cep: '01310100' });
    expect(result.success).toBe(false);
  });

  it('coloca a UF em maiúsculas', () => {
    const result = addressSchema.safeParse({ ...validAddress, state: 'sp' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.state).toBe('SP');
    }
  });

  it('rejeita estado com mais de duas letras', () => {
    const result = addressSchema.safeParse({ ...validAddress, state: 'São Paulo' });
    expect(result.success).toBe(false);
  });

  it('aceita telefone com máscara', () => {
    const result = addressSchema.safeParse({ ...validAddress, phone: '(11) 99999-9999' });
    expect(result.success).toBe(true);
  });

  it('rejeita telefone sem DDD', () => {
    const result = addressSchema.safeParse({ ...validAddress, phone: '99999999' });
    expect(result.success).toBe(false);
  });

  it('aceita endereço sem complemento', () => {
    const result = addressSchema.safeParse({ ...validAddress, complement: undefined });
    expect(result.success).toBe(true);
  });

  it('aceita "S/N" como número', () => {
    // Nem toda casa tem número — por isso o campo é texto, não número.
    const result = addressSchema.safeParse({ ...validAddress, number: 'S/N' });
    expect(result.success).toBe(true);
  });
});
