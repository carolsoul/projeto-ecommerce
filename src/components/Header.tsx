import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Heart, LogOut, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useCart } from '../context/useCart';
import { useAuth } from '../context/useAuth';
import { useWishlist } from '../context/useWishlist';
import { BORDER, BRAND, BRAND_BG, BRAND_BG_HOVER, BRAND_HOVER, CARD, CREAM, FOCUS, FOCUS_RING, HOVER_BRAND, HOVER_PINK, LOGO_BG, LOGO_BG_HOVER, MUTED, PINK, PINK_HOVER, PLACEHOLDER_MUTED, RING_OFFSET, SUBTLE } from '../lib/theme';

const NAV_LINKS = [
  { to: '/', label: 'Catálogo', end: true },
  { to: '/orders', label: 'Pedidos', end: false },
  { to: '/wishlist', label: 'Favoritos', end: false },
];

function IconButton({
  to,
  label,
  count,
  onClick,
  children,
}: {
  to?: string;
  label: string;
  count?: number;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const className = `relative inline-flex size-10 items-center justify-center rounded-full ${PINK} ${PINK_HOVER} transition-colors cursor-pointer ${FOCUS}`;

  const badge =
    count !== undefined && count > 0 ? (
      <span className={`absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full ${BRAND_BG} px-1 text-[10px] font-semibold text-white`}>
        {count}
      </span>
    ) : null;

  if (to) {
    return (
      <Link to={to} aria-label={label} className={className}>
        {children}
        {badge}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} className={className}>
      {children}
      {badge}
    </button>
  );
}

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const { itemCount } = useCart();
  const { itemCount: favoriteCount } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const accountRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const activeSearch = searchParams.get('q') ?? '';

  useEffect(() => {
    if (activeSearch !== '') setIsSearchOpen(true);
  }, [activeSearch]);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      setIsAccountOpen(false);
      setIsMenuOpen(false);
      if (activeSearch === '') setIsSearchOpen(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (accountRef.current && target && !accountRef.current.contains(target)) {
        setIsAccountOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeSearch]);

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
    setIsSearchOpen(false);

    // Só mexe na URL quando existe busca para desfazer. Antes isto fazia
    // `navigate('/')` sempre, então fechar o campo no carrinho, nos favoritos
    // ou em qualquer outra tela jogava a pessoa para a home.
    if (activeSearch === '') return;

    // E remove só o parâmetro `q`, em vez de ir para `/`: assim a pessoa
    // continua onde está, sem o filtro, e os demais parâmetros sobrevivem.
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setIsMenuOpen(false);
    setIsAccountOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
      isActive ? `${BRAND_BG} text-white` : `${MUTED} ${HOVER_BRAND}`
    }`;

  return (
    <header className={`${CREAM} sticky top-0 z-50`}>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        {/* ── Mobile: hambúrguer ── */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
          aria-controls="menu-mobile"
          className={`${BRAND} cursor-pointer rounded-md p-1 transition-colors ${FOCUS} md:hidden`}
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* ── Desktop: logo circular ── */}
        <Link
          to="/"
          aria-label="The Bush — início"
          className={`hidden size-10 shrink-0 items-center justify-center rounded-full ${LOGO_BG} font-serif text-lg font-bold text-white transition-colors ${LOGO_BG_HOVER} ${FOCUS} focus-visible:ring-offset-2 ${RING_OFFSET} md:inline-flex`}
        >
          B.
        </Link>

        {/* ── Mobile: marca centralizada ── */}
        <Link
          to="/"
          className={`${BRAND} flex-1 text-center font-serif text-xl font-bold tracking-tight md:hidden`}
        >
          The Bush.
        </Link>

        {/* ── Desktop: navegação no miolo ── */}
        <nav aria-label="Navegação da loja" className="hidden flex-1 justify-center md:flex">
          <ul className={`flex items-center gap-1 rounded-full ${PINK} p-1`}>
            {NAV_LINKS.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={navLinkClass}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Ações à direita ── */}
        <div className="flex shrink-0 items-center gap-2">
          <IconButton
            label={isSearchOpen ? 'Fechar busca' : 'Buscar produtos'}
            onClick={() => (isSearchOpen ? handleClearSearch() : setIsSearchOpen(true))}
          >
            {isSearchOpen ? <X size={18} /> : <Search size={18} />}
          </IconButton>

          <span className="hidden md:inline-flex">
            <IconButton to="/wishlist" label={`Favoritos (${favoriteCount})`} count={favoriteCount}>
              <Heart size={18} />
            </IconButton>
          </span>

          <IconButton to="/cart" label={`Carrinho (${itemCount})`} count={itemCount}>
            <ShoppingBag size={18} />
          </IconButton>

          {/* ── Desktop: conta ── */}
          <div className="relative hidden md:block" ref={accountRef}>
            <IconButton
              label="Conta"
              onClick={() => setIsAccountOpen(!isAccountOpen)}
            >
              <User size={18} />
            </IconButton>

            <div
              className={`${isAccountOpen ? 'block' : 'hidden'} absolute right-0 top-full z-20 mt-2 min-w-56 rounded-xl border ${BORDER} ${CARD} p-2 shadow-lg`}
            >
              {user ? (
                <>
                  <p className={`truncate px-2 py-1.5 text-xs ${SUBTLE}`}>
                    {user.displayName || user.email}
                  </p>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-md p-2 text-sm font-medium ${BRAND} transition-colors ${PINK_HOVER} ${FOCUS}`}
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`block rounded-md p-2 text-sm font-medium ${BRAND} transition-colors ${PINK_HOVER}`}
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/signup"
                    className={`mt-1 block rounded-md ${BRAND_BG} p-2 text-center text-sm font-semibold text-white transition-colors ${BRAND_BG_HOVER}`}
                  >
                    Cadastre-se
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Busca, revelada pelo ícone ── */}
      {isSearchOpen && (
        <div className={`border-t ${BORDER} px-4 pb-3 pt-3`}>
          <form onSubmit={handleSearch} role="search" className="relative mx-auto max-w-7xl">
            <input
              ref={searchInputRef}
              key={activeSearch}
              name="q"
              type="search"
              defaultValue={activeSearch}
              placeholder="Buscar produtos..."
              aria-label="Buscar produtos"
              className={`w-full rounded-full ${PINK} py-2 pl-10 pr-10 ${BRAND} ${PLACEHOLDER_MUTED} ${FOCUS_RING}`}
            />
            <button
              type="submit"
              aria-label="Buscar"
              className={`${BRAND} absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors ${BRAND_HOVER}`}
            >
              <Search size={18} />
            </button>

            {activeSearch !== '' && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Limpar busca"
                className={`${BRAND} absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors ${BRAND_HOVER}`}
              >
                <X size={18} />
              </button>
            )}
          </form>
        </div>
      )}

      {/* ── Menu mobile ── */}
      {isMenuOpen && (
        <div id="menu-mobile" className={`border-t ${BORDER} px-4 py-3 md:hidden`}>
          <nav aria-label="Navegação da loja">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map(({ to, label, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive ? `${BRAND_BG} text-white` : `${MUTED} ${HOVER_PINK}`
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className={`mt-3 border-t ${BORDER} pt-3`}>
            {user ? (
              <>
                <p className={`truncate px-3 pb-2 text-xs ${MUTED}`}>
                  {user.displayName || user.email}
                </p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`${MUTED} flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${HOVER_PINK}`}
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className={`${MUTED} flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors ${HOVER_PINK}`}
                >
                  Entrar
                </Link>
                <Link
                  to="/signup"
                  className={`flex-1 rounded-md ${BRAND_BG} px-3 py-2 text-center text-sm font-semibold text-white transition-colors ${BRAND_BG_HOVER}`}
                >
                  Cadastre-se
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
