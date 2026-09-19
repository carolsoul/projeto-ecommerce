import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Search, ShoppingBag, Heart, LogOut, Menu, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useCart } from '../context/useCart';
import { useAuth } from '../context/useAuth';
import { useWishlist } from '../context/useWishlist';

export const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { itemCount } = useCart()
    const { itemCount: favoriteCount } = useWishlist()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    // O termo vem da URL, não de um estado local. O `key` remonta o input
    // quando a URL muda, então voltar pelo histórico ou limpar a busca deixa o
    // campo coerente sem precisar de um efeito sincronizando as duas coisas.
    const activeSearch = searchParams.get('q') ?? '';

    const handleSearch = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const term = String(formData.get('q') ?? '').trim();

        setIsMenuOpen(false);

        if (term === '') {
            navigate('/');
            return;
        }

        navigate(`/?q=${encodeURIComponent(term)}`);
    };

    const handleClearSearch = () => {
        navigate('/');
    };

    const handleSignOut = async () => {
        await signOut(auth);
        setIsMenuOpen(false);
        navigate('/');
    };
    return (
        <header className='bg-white shadow-md sticky top-0 z-50'>
            <div className='container mx-auto px-4 py-3 flex items-center gap-4'>

                {/* Logo */}
                <Link to='/' className='text-xl font-bold text-gray-800 flex-shrink-0'>
                    Minha Loja
                </Link>

                {/* Search Bar - sempre visível, ocupa o espaço disponível */}
                <form onSubmit={handleSearch} role='search' className='relative flex-1 min-w-0'>
                    <input
                        key={activeSearch}
                        name='q'
                        type="search"
                        defaultValue={activeSearch}
                        placeholder="Buscar produtos..."
                        aria-label="Buscar produtos"
                        className="w-full bg-gray-100 rounded-full py-2 px-4 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button
                        type='submit'
                        aria-label='Buscar'
                        className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors cursor-pointer'
                    >
                        <Search size={18} />
                    </button>

                    {activeSearch !== '' && (
                        <button
                            type='button'
                            onClick={handleClearSearch}
                            aria-label='Limpar busca'
                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors cursor-pointer'
                        >
                            <X size={18} />
                        </button>
                    )}
                </form>

                {/* Ações à direita */}
                <div className='flex items-center gap-4 flex-shrink-0'>

                    {/* Wishlist - apenas desktop */}
                    <Link
                        to='/wishlist'
                        className="hidden md:block relative text-gray-600 hover:text-blue-500 transition-colors"
                        aria-label={`Favoritos (${favoriteCount})`}
                    >
                        <Heart size={24} />
                        {favoriteCount > 0 && (
                            <span className='absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
                                {favoriteCount}
                            </span>
                        )}
                    </Link>

                    {/* Carrinho - sempre visível (mobile e desktop) */}
                    <Link to='/cart' className="relative text-gray-600 hover:text-blue-500 transition-colors">
                        <ShoppingBag size={24} />
                        <span className='absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
                            {itemCount}
                        </span>
                    </Link>

                    {/* Entrar/Cadastrar ou saudação + sair - apenas desktop */}
                    {user ? (
                        <div className='hidden md:flex items-center gap-3'>
                            <span className='text-sm text-gray-600 max-w-[12rem] truncate'>
                                Olá, {user.displayName || user.email}
                            </span>
                            <button
                                type='button'
                                onClick={handleSignOut}
                                className='inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-500 transition-colors cursor-pointer'
                            >
                                <LogOut size={18} />
                                Sair
                            </button>
                        </div>
                    ) : (
                        <div className='hidden md:flex items-center gap-3'>
                            <Link
                                to='/login'
                                className='text-sm font-medium text-gray-600 hover:text-blue-500 transition-colors'
                            >
                                Entrar
                            </Link>
                            <Link
                                to='/signup'
                                className='inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors'
                            >
                                Cadastre-se
                            </Link>
                        </div>
                    )}

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
                            to='/wishlist'
                            className='flex items-center gap-1 text-gray-600 hover:text-blue-500 transition-colors text-sm font-medium'
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <Heart size={18} /> Favoritos
                            {favoriteCount > 0 && <span className='text-red-600'>({favoriteCount})</span>}
                        </Link>

                        {user ? (
                            <button
                                type='button'
                                onClick={handleSignOut}
                                className='flex items-center gap-1 text-gray-600 hover:text-blue-500 transition-colors text-sm font-medium cursor-pointer'
                            >
                                <LogOut size={18} /> Sair
                            </button>
                        ) : (
                            <>
                                <Link
                                    to='/login'
                                    className='text-gray-600 hover:text-blue-500 transition-colors text-sm font-medium'
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Entrar
                                </Link>
                                <Link
                                    to='/signup'
                                    className='text-blue-600 hover:text-blue-700 transition-colors text-sm font-semibold'
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Cadastre-se
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;