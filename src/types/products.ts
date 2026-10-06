import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  /**
   * Características, uma por item.
   *
   * No CSV é uma célula só com os valores separados por `|`; o`productRowSchema` quebra em array antes de gravar.
   */
  features: string[];
  price: number;
  mrp?: number | null;
  rating: number;
  reviewCount: number;
  category?: string | null;
  stock?: number | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * O mínimo que o carrinho precisa para guardar um produto.
 */
export type CartableProduct = Pick<Product, 'id' | 'name' | 'price' | 'imageUrl'>;
