import { getAdminDb } from './firebaseAdmin.js';
import {
  PricingError,
  priceOrder,
  toCartLines,
  type CatalogEntry,
  type OrderTotals,
} from './pricing.js';

export interface ShippingAddress {
  recipient: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface OrderContext {
  address: ShippingAddress;
  totals: OrderTotals;
}

/**
 * Monta o pedido a partir do que está no Firestore.
 *
 * O cliente informa QUAL endereço usar. O carrinho, preços e o
 * endereço são lidos pelo servidor.
 */
export async function loadOrderContext(uid: string, addressId: string): Promise<OrderContext> {
  const adminDb = getAdminDb();

  const addressSnap = await adminDb.doc(`users/${uid}/addresses/${addressId}`).get();

  if (!addressSnap.exists) {
    throw new PricingError('Endereço de entrega não encontrado.', 'UNKNOWN_STATE');
  }

  const address = addressSnap.data() as ShippingAddress;

  // Só sku e quantidade sobrevivem desta leitura: `toCartLines` descarta o `price` que o navegador gravou no documento do carrinho.
  const cartSnap = await adminDb.collection(`users/${uid}/cart`).get();
  const lines = toCartLines(
    cartSnap.docs.map((doc) => ({ sku: doc.id, quantity: doc.data().quantity }))
  );

  if (lines.length === 0) {
    throw new PricingError('O carrinho está vazio.', 'EMPTY_CART');
  }

  // Preço e nome vêm de `products`, coleção que o cliente só consegue ler.
  const productSnaps = await adminDb.getAll(
    ...lines.map((line) => adminDb.doc(`products/${line.sku}`))
  );

  const catalog = new Map<string, CatalogEntry>();

  for (const snap of productSnaps) {
    if (!snap.exists) continue;

    const data = snap.data() as {
      name: string;
      price: number;
      stock?: number | null;
      imageUrl: string;
    };

    catalog.set(snap.id, {
      sku: snap.id,
      name: data.name,
      price: data.price,
      stock: data.stock,
      imageUrl: data.imageUrl,
    });
  }

  return {
    address,
    totals: priceOrder(lines, catalog, address.state),
  };
}
