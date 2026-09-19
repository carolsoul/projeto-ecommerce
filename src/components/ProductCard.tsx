import { type Product } from '../types/products';
import StarRating from './StarRating';
import { getDiscountPercentage } from '../utils/pricing';
import { Link } from 'react-router-dom';

import { useCart } from '../context/useCart';
import { useAuth } from '../context/useAuth';

const HEART_PATH =
  'M45.5 4A18.53 18.53 0 0 0 32 9.86 18.5 18.5 0 0 0 0 22.5C0 40.92 29.71 59 31 59.71a2 2 0 0 0 2.06 0C34.29 59 64 40.92 64 22.5A18.52 18.52 0 0 0 45.5 4ZM32 55.64C26.83 52.34 4 36.92 4 22.5a14.5 14.5 0 0 1 26.36-8.33 2 2 0 0 0 3.27 0A14.5 14.5 0 0 1 60 22.5c0 14.41-22.83 29.83-28 33.14Z';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const discount = product.mrp != null ? getDiscountPercentage(product.price, product.mrp) : null;

  const { addItem } = useCart();
  const { user } = useAuth();
  
  const handleAddToCart = () => {
    if (!user) {
      alert('Você precisa estar logado para adicionar ao carrinho.');
      return;
    }
    addItem(product);
  };
  return (
    <li className="flex flex-col border border-slate-300 shadow-sm rounded-md p-1.5 transition-all relative overflow-hidden">
      {discount !== null && (
        <span className="absolute top-2 left-2 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
          -{discount}%
        </span>
      )}

      <Link to={`/produto/${product.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
        <div className="w-full bg-slate-50 rounded-sm overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            width={400}
            height={400}
            loading="lazy"
            decoding="async"
            className="w-full aspect-square object-cover object-top"
          />
        </div>

        <div className="py-4 px-2 text-left">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2">{product.name}</h3>

          <StarRating rating={product.rating} reviewCount={product.reviewCount} />

          <div className="mt-4">
            <p className="text-slate-900 font-semibold text-sm sm:text-base break-words">
              {product.mrp != null && (
                <span className="mr-1.5 text-slate-600 line-through">${product.mrp.toFixed(2)}</span>
              )}
              ${product.price.toFixed(2)}
            </p>
          </div>
        </div>
      </Link>

      <div className="flex flex-col items-center mt-2">
        <button type="button" onClick={handleAddToCart} className="w-full cursor-pointer text-sm px-3.5 py-2 font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" >
          Adicionar ao carrinho
        </button>
        
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 pb-1.5 pt-3 cursor-pointer text-sm text-slate-900 font-medium whitespace-nowrap rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-current" viewBox="0 0 66 66" aria-hidden="true">
            <path d={HEART_PATH} />
          </svg>
          <span>Adicionar aos favoritos</span>
        </button>
      </div>
    </li>
  );
}