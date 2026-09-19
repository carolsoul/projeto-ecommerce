import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Menu, X } from 'lucide-react';
import { useCart } from '../context/useCart';

export const Header: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { itemCount } = useCart()
    return (
        <header className='bg-white shadow-md sticky top-0 z-50'>
            <div className='container mx-auto px-4 py-3 flex items-center gap-4'>

                {/* Logo */}
                <Link to='/' className='text-xl font-bold text-gray-800 flex-shrink-0'>
                    Minha Loja
                </Link>

                {/* Search Bar - sempre visível, ocupa o espaço disponível */}
                <div className='relative flex-1 min-w-0'>
                    <input
                        type="text"
                        placeholder="Buscar produtos..."
                        className="w-full bg-gray-100 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search size={18} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' />
                </div>

                {/* Ações à direita */}
                <div className='flex items-center gap-4 flex-shrink-0'>

                    {/* Wishlist - apenas desktop */}
                    <Link
                        to='/whishlist'
                        className="hidden md:block text-gray-600 hover:text-blue-500 transition-colors"
                    >
                        <Heart size={24} />
                    </Link>

                    {/* Carrinho - sempre visível (mobile e desktop) */}
                    <Link to='/cart' className="relative text-gray-600 hover:text-blue-500 transition-colors">
                        <ShoppingBag size={24} />
                        <span className='absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
                            {itemCount}
                        </span>
                    </Link>

                    {/* Botão de Signup - apenas desktop */}
                    <Link
                        to='/signup'
                        className='hidden md:inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors'
                    >
                        Cadastre-se
                    </Link>

                    {/* Menu de navegação - apenas desktop */}
                    <nav className='hidden md:flex items-center gap-4'>
                        <Link to='/perfil' className='text-gray-600 hover:text-blue-500 transition-colors'>
                            <User size={24} />
                        </Link>
                    </nav>

                    {/* Botão do menu mobile (hamburguer) */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className='md:hidden text-gray-600 hover:text-blue-500 transition-colors'
                        aria-label="Abrir menu"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Menu mobile - slider horizontal */}
            {isMenuOpen && (
                <div className='md:hidden border-t border-gray-100 overflow-x-auto'>
                    <div className='flex items-center gap-6 px-4 py-3 whitespace-nowrap'>
                        <Link
                            to='/whishlist'
                            className='flex items-center gap-1 text-gray-600 hover:text-blue-500 transition-colors text-sm font-medium'
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <Heart size={18} /> Favoritos
                        </Link>
                        <Link
                            to='/perfil'
                            className='flex items-center gap-1 text-gray-600 hover:text-blue-500 transition-colors text-sm font-medium'
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <User size={18} /> Perfil
                        </Link>
                        <Link
                            to='/signup'
                            className='text-blue-600 hover:text-blue-700 transition-colors text-sm font-semibold'
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Cadastre-se
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;