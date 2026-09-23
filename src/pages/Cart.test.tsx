import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Cart from './Cart';
import { CartContext, type CartContextType } from '../context/useCart';
import type { CartItem } from '../types/cart';

/**
 * O carrinho já mostrou frete de R$4,00 e taxa de R$4,00 fixos, enquanto o
 * checkout cobrava R$15–35 de frete e 3% de taxa. Estes testes existem para que
 * nenhum número de dinheiro volte a ser inventado no navegador.
 */

const ITEMS: CartItem[] = [
  { sku: 'cam-001', name: 'Camiseta', price: 50, quantity: 2, imageUrl: '/cam.png' },
  { sku: 'bon-002', name: 'Boné', price: 30, quantity: 1, imageUrl: '/bon.png' },
];

function renderCart(overrides: Partial<CartContextType> = {}) {
  const value: CartContextType = {
    items: ITEMS,
    itemCount: ITEMS.length,
    loading: false,
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateQuantity: jest.fn(),
    ...overrides,
  };

  return render(
    <MemoryRouter>
      <CartContext.Provider value={value}>
        <Cart />
      </CartContext.Provider>
    </MemoryRouter>
  );
}

describe('Cart', () => {
  it('mostra o subtotal somado dos itens', () => {
    renderCart();

    // 2 x 50 + 1 x 30
    expect(screen.getByText('R$130.00')).toBeInTheDocument();
  });

  it('NÃO mostra frete, taxa nem total — esses valores vêm do servidor', () => {
    renderCart();

    expect(screen.queryByText('Entrega')).not.toBeInTheDocument();
    expect(screen.queryByText('Taxa')).not.toBeInTheDocument();
    expect(screen.queryByText('Total')).not.toBeInTheDocument();

    // E nenhum resquício dos valores fixos antigos.
    expect(screen.queryByText('R$4.00')).not.toBeInTheDocument();
    expect(screen.queryByText('R$138.00')).not.toBeInTheDocument();
  });

  it('avisa onde entrega e taxa serão calculadas', () => {
    renderCart();

    expect(screen.getByText(/calculadas no checkout/i)).toBeInTheDocument();
  });

  it('mostra o carrinho vazio sem resumo nenhum', () => {
    renderCart({ items: [], itemCount: 0 });

    expect(screen.getByText(/vazio/i)).toBeInTheDocument();
    expect(screen.queryByText('Subtotal')).not.toBeInTheDocument();
  });
});
