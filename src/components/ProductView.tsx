import { useNavigate, Link } from 'react-router-dom';
import { type Product } from '../types/products';
import StarRating from './StarRating';
import { getDiscountPercentage } from '../utils/pricing';

import { useCart } from '../context/useCart';
import { useAuth } from '../context/useAuth';
import { useWishlist } from '../context/useWishlist';
import { BRAND, BRAND_BG, CARD, CREAM, HOVER_BRAND, ON_BRAND, PINK, PINK_HOVER, RING } from '../lib/theme';

const HEART_PATH = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

interface ProductViewProps {
  product: Product;
}

export default function ProductView({ product }: ProductViewProps) {
  const discount = product.mrp != null ? getDiscountPercentage(product.price, product.mrp) : null;

  const { addItem } = useCart();
  const { user } = useAuth();
  const { has, toggleItem } = useWishlist();
  const navigate = useNavigate();

  const isFavorite = has(product.id);
  const productPath = `/produto/${product.id}`;

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login', { state: { from: productPath } });
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
    <section className={`px-4 md:px-8 ${CREAM}`}>
      <div className="max-w-xl mx-auto lg:max-w-6xl">

        <Link to={`/`} 
        className={`${BRAND} font-semibold text-lg`}>
          Voltar
        </Link>

        <div className="grid items-start gap-6 lg:grid-cols-2 sm:gap-2 lg:gap-2 w-full pb-8">

          {/* IMAGEM (única, sem galeria por enquanto) */}
          <div className="w-full lg:sticky lg:top-1 relative">
            {discount !== null && (
              <span className={`absolute top-2 left-2 z-10 ${BRAND_BG} text-white text-sm font-bold px-3 py-2 rounded`}>
                -{discount}%
              </span>
            )}
            <div className={`${CARD} rounded-2xl overflow-hidden`}>
              <img
                src={product.imageUrl}
                alt={product.name}
                width={600}
                height={600}
                fetchPriority="high"
                decoding="async"
                className="w-full object-cover max-h-[500px]"
              />
            </div>
          </div>

          {/* INFO DO PRODUTO */}
          <div className={`w-full ${CARD} rounded-2xl px-6 py-4`} id="product-main">

            <div>
              <div className='mb-3'>
                <StarRating rating={product.rating} reviewCount={product.reviewCount} />
              </div>

              <div className='flex flex-row items-start justify-between content-between'>
                <h1 className={`text-4xl font-bold ${BRAND}`}>{product.name}</h1>

                <div className="flex flex-col flex-wrap">
                  <p className={`${BRAND} font-bold text-3xl md:text-4xl`}>
                    <span className="sr-only">Preço:</span>R${product.price.toFixed(2)}
                  </p>
                  {product.mrp != null && (
                    <p className={`${BRAND} text-lg`}>
                      <s aria-label={`Preço original: $${product.mrp.toFixed(2)}`}>
                        <span aria-hidden="true">R${product.mrp.toFixed(2)}</span>
                      </s>
                    </p>
                  )}
                </div>
              </div>
              <div className='py-5'>
                  <p className={`${BRAND} font-bold text-2xl md:text-2xl`}>Descrição</p>
                  <p className={`${BRAND} text-lg`}>
                    Descrição do produto aqui
                  </p>
              </div>
              <div className='py-5'>
                  <p className={`${BRAND} font-bold text-2xl md:text-2xl`}>Características</p>
                  <p className={`${BRAND} text-lg`}>
                    Características do produto aqui
                  </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4"> 
              <button
                type="button" onClick={handleAddToCart}
                className={`px-6 py-2 text-white text-sm font-semibold rounded-4xl cursor-pointer ${BRAND_BG} ${PINK_HOVER} ${HOVER_BRAND} transition-colors focus:outline-none focus-visible:ring-2 ${RING}`}
              >
                Adicionar ao carrinho
              </button>

              <button 
                onClick={handleToggleFavorite} 
                aria-pressed={isFavorite} 
                className={`size-10 inline-flex items-center justify-center rounded-full ${PINK} cursor-pointer transition-colors ${PINK_HOVER} ${BRAND}`} 
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
            </div>

            {/* add localização de entrega, accordion de detalhes, reviews depois*/}
          </div>
        </div>
        <div className={`flex ${BRAND_BG} my-8 py-8 px-6 rounded-2xl`}>
              
              <div className="flex flex-wrap gap-4 mb-6">

                <h2 className={`text-4xl font-bold ${ON_BRAND} pb-6 pt-3`}>Gift Card da The Bush.</h2>

                <p className={`${ON_BRAND}`}>Dê de presente estilo e a atmosfera da The Bush! Designs únicos que vão decorar qualquer interior e trazer alegria. Uma escolha ideal para aqueles que apreciam estética e qualidade</p>

                <button className={`my-8 px-6 py-2 ${BRAND} text-sm font-semibold rounded-4xl cursor-pointer ${PINK} ${PINK_HOVER} ${HOVER_BRAND} transition-colors focus:outline-none focus-visible:ring-2 ${RING}`}>
                Adicionar Gift Card
              </button>
              </div>

              <img src="https://plus.unsplash.com/premium_photo-1742833661693-d54d72a51b1a?q=80&w=997&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Gift-card-the-bush" className='rounded-3xl w-full overflow-hidden object-cover' />
            </div>

            <div className="">
              <p className={`text-4xl font-bold ${BRAND}`}>Você pode gostar</p>
              {/*Produtos Populares com slide horizontal */}
            </div>

            <div className="">
              <p className={`text-4xl font-bold ${BRAND}`}>Avaliações</p>
              {/*Avaliações do produto */}
            </div>
      </div>
    </section>
  );
}