import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  mrp?: number | null;
  rating: number;
  reviewCount: number;
  category?: string | null;
  stock?: number | null;
  createdAt?: Timestamp;
}