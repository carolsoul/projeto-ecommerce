import { type Product } from '../types/products';
import { getDiscountPercentage } from '../utils/pricing';
import { Link, useNavigate } from 'react-router-dom';

import { useCart } from '../context/useCart';
import { useAuth } from '../context/useAuth';
import { useWishlist } from '../context/useWishlist';
import { BRAND, BRAND_BG, CARD, FOCUS, HOVER_BRAND, MUTED, PINK, PINK_HOVER, RING } from '../lib/theme';

const HEART_PATH = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const discount = product.mrp != null ? getDiscountPercentage(product.price, product.mrp) : null;

  const { addItem } = useCart();
  const { user } = useAuth();
  const { has, toggleItem } = useWishlist();
  const navigate = useNavigate();

  const isFavorite = has(product.id);
  const productPath = `/produto/${product.id}`;
  
  const handleAddToCart = () => {
    if (!user) {
      alert('Você precisa estar logado para adicionar ao carrinho.');
      return;
    }
    addItem(product);
  };

  const handleToggleFavorite = () => {
    if (!user) {
      navigate('/login', { state: { from: productPath } });
      return;
    }
    toggleItem(product);
  };
  
  return (
    <li className={`flex flex-col p-1.5 transition-all relative overflow-hidden ${className}`}>
      {discount !== null && (
        <span className={`absolute top-2 left-2 z-10 bg-[#008000] text-white text-xs font-bold px-2 py-1 rounded`}>
          -{discount}%
        </span>
      )}

      <button 
        onClick={handleToggleFavorite} 
        aria-pressed={isFavorite} 
        className={`absolute top-2 right-2 size-8 inline-flex items-center justify-center rounded-full ${PINK} cursor-pointer transition-colors ${PINK_HOVER} ${BRAND}`} 
      > 
        <svg 
          xmlns="http://w3.org"
          className={`size-4 stroke-current transition-all duration-200 ${ isFavorite ? 'fill-current stroke-0 scale-110' : 'fill-none stroke-2' }`}
          viewBox="0 0 24 24" 
          aria-hidden="true"
        > 
          <path d={HEART_PATH} /> 
        </svg> 
      </button>

      <Link to={`/produto/${product.id}`} className={`block ${FOCUS} rounded`}>
        <div className={`w-full ${CARD} rounded-lg overflow-hidden`}>
          <img src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover object-top" />
        </div>
      </Link>

      <div className={`py-4 px-2 mt-2 rounded-lg text-left ${CARD}`}>
          <h3 className={`text-sm sm:text-base font-semibold ${BRAND} truncate`}>{product.name}</h3>

          <div className="mt-2">
            <p className={`${BRAND} font-semibold text-sm sm:text-base break-words`}>
              {product.mrp != null && (
                <span className={`mr-1.4 ${MUTED} line-through`}>R${product.mrp.toFixed(2)}</span>
              )}
              R${product.price.toFixed(2)}
            </p>
          </div>

          <div className="flex flex-col items-center mt-2">
            <button type="button" onClick={handleAddToCart} className={`w-full px-6 py-2 text-white font-semibold rounded-4xl cursor-pointer ${BRAND_BG} ${PINK_HOVER} ${HOVER_BRAND} transition-colors focus:outline-none focus-visible:ring-2 ${RING} `} >
              Adicionar
            </button>
          </div>
        </div>
    </li>
  );
}