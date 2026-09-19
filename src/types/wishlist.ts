export interface WishlistItem {
    sku: string;
    name: string;
    imageUrl: string;
    price: number;
    mrp?: number | null;
}
