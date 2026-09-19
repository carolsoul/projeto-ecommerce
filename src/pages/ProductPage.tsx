import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type Product } from '../types/products'
import ProductView from '../components/ProductView';

export default function ProductPage() {
    const { sku } = useParams<{ sku: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!sku) return;

        async function fetchProduct() {
            setLoading(true);
            setNotFound(false);
            setProduct(null);

            const snap = await getDoc(doc(db, 'products', sku as string));

            if (!snap.exists()) {
                setNotFound(true);
            } else {
                setProduct({ id: snap.id, ...snap.data() } as Product);
            }

            setLoading(false);
        }

        fetchProduct()
    }, [sku]);

    if (loading) return <p className="text-center py-20">Carregando produto...</p>;
    if (notFound) return <p className="text-center py-20">Produto não encontrado.</p>;
    if (!product) return null;


    return < ProductView product={product} />
}