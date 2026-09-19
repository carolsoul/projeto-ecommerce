import { type Product } from '../types/products';
import StarRating from './StarRating';
import { getDiscountPercentage } from '../utils/pricing';

import { useCart } from '../context/useCart';
import { useAuth } from '../context/useAuth';

const HEART_PATH =
  'M45.5 4A18.53 18.53 0 0 0 32 9.86 18.5 18.5 0 0 0 0 22.5C0 40.92 29.71 59 31 59.71a2 2 0 0 0 2.06 0C34.29 59 64 40.92 64 22.5A18.52 18.52 0 0 0 45.5 4ZM32 55.64C26.83 52.34 4 36.92 4 22.5a14.5 14.5 0 0 1 26.36-8.33 2 2 0 0 0 3.27 0A14.5 14.5 0 0 1 60 22.5c0 14.41-22.83 29.83-28 33.14Z';

interface ProductViewProps {
  product: Product;
}

export default function ProductView({ product }: ProductViewProps) {
  const discount = product.mrp != null ? getDiscountPercentage(product.price, product.mrp) : null;

  const { addItem } = useCart();
  const { user } = useAuth();
  const handleAddToCart = () => {
    if (!user) {
        alert("Você precisa etar logado para adicionar itens ao carrinho.");
        return;
    }
    addItem(product);
  };

  return (
    <section className="px-4 md:px-8 mt-6">
      <div className="max-w-xl mx-auto lg:max-w-6xl">
        <div className="grid items-start gap-8 lg:grid-cols-2 sm:gap-12 lg:gap-12">

          {/* IMAGEM (única, sem galeria por enquanto) */}
          <div className="w-full lg:sticky lg:top-0 relative">
            {discount !== null && (
              <span className="absolute top-2 left-2 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                -{discount}%
              </span>
            )}
            <div className="bg-gray-100 rounded overflow-hidden">
              <img src={product.imageUrl} alt={product.name} className="w-full object-cover" />
            </div>
          </div>

          {/* INFO DO PRODUTO */}
          <div className="w-full" id="product-main">

            <div>
              <h1 className="text-xl font-bold text-slate-900 md:text-2xl">{product.name}</h1>

              <div className="flex items-center flex-wrap gap-4 mt-6">
                <p className="text-slate-900 font-bold text-2xl md:text-3xl">
                  <span className="sr-only">Preço:</span>R${product.price.toFixed(2)}
                </p>
                {product.mrp != null && (
                  <p className="text-slate-600 text-lg">
                    <s aria-label={`Preço original: $${product.mrp.toFixed(2)}`}>
                      <span aria-hidden="true">R${product.mrp.toFixed(2)}</span>
                    </s>
                  </p>
                )}
              </div>

              <div className="mt-4">
                <StarRating rating={product.rating} reviewCount={product.reviewCount} />
              </div>
            </div>

            <hr className="my-6 border-slate-300" />

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                type="button"
                className="w-[45%] px-4 py-2.5 text-slate-900 text-sm font-semibold rounded-md cursor-pointer bg-white border border-slate-300 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-current" viewBox="0 0 66 66" aria-hidden="true">
                    <path d={HEART_PATH} />
                  </svg>
                  Adicionar aos favoritos
                </span>
              </button>
              <button
                type="button" onClick={handleAddToCart}
                className="w-[45%] px-4 py-2.5 text-white text-sm font-semibold rounded-md cursor-pointer bg-blue-600 hover:bg-blue-700 border border-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Adicionar ao carrinho
              </button>
            </div>

            {/* add localização de entrega, accordion de detalhes, reviews depois*/}
          </div>
        </div>
      </div>
    </section>
  );
}