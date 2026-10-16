import { Timestamp } from 'firebase/firestore';

/**
 * Uma avaliação como está gravada em `reviews`.
 *
 * `id` não é campo do documento — é o id dele (`${userId}_${sku}`, montado por
 * `reviewDocId`), que o componente acrescenta ao ler. Os demais vêm de
 * `api/reviews.ts`; o cliente nunca escreve nesta coleção.
 *
 * `userName` é cópia desnormalizada do perfil, as regras impedem ler `users/{uid}` de outra pessoa, então sem o nome aqui dentro
 * a lista de avaliações seria impossível de renderizar.
 */
export interface Review {
  id: string;
  sku: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt?: Timestamp;
}
