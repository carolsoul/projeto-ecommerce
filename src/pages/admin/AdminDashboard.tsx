import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import {
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  Store,
  TriangleAlert,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../context/useAuth';
import { fulfillmentPresentation } from '../../lib/orderStatus';
import { BORDER, BRAND, BRAND_BG, CARD, DISABLED_SUBTLE, FOCUS, HOVER_BRAND, HOVER_BRAND_BORDER, MUTED, OUTLINE, OUTLINE_FOCUS, PINK_HOVER, SUBTLE } from '../../lib/theme';

/**
 * Porta de entrada do admin — /admin/dashboard
 * 
 * As contagens usam `getCountFromServer`, não `getDocs`. O Firestore não tem
 * SELECT COUNT: ler os documentos para contá-los custaria uma leitura por
 * pedido a cada abertura da tela. A agregação devolve só o número, por uma
 * fração do preço.
 */

interface QueueCard {
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  className: string;
  /** Filtro de uma única igualdade, sem índice composto para configurar. */
  field: string;
  value: string;
}

const QUEUES: QueueCard[] = [
  {
    key: 'processing',
    label: 'Aguardando despacho',
    hint: 'Pagos e ainda não enviados',
    icon: fulfillmentPresentation('processing').icon,
    className: fulfillmentPresentation('processing').className,
    // `fulfillment.status` só recebe 'processing' quando o webhook confirma o
    // pagamento, então esta igualdade já implica pedido pago — e evita o índice
    // composto que um segundo filtro exigiria.
    field: 'fulfillment.status',
    value: 'processing',
  },
  {
    key: 'underpaid',
    label: 'Revisão manual',
    hint: 'Valor pago não cobriu o total',
    icon: TriangleAlert,
    className: 'bg-amber-100 text-amber-700',
    field: 'paymentIssue',
    value: 'underpaid',
  },
  {
    key: 'delivery_failed',
    label: 'Falha na entrega',
    hint: 'Precisa de reenvio ou devolução',
    icon: fulfillmentPresentation('delivery_failed').icon,
    className: fulfillmentPresentation('delivery_failed').className,
    field: 'fulfillment.status',
    value: 'delivery_failed',
  },
];

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/admin/dashboard', label: 'Painel', icon: LayoutDashboard },
  { to: '/admin/orders', label: 'Pedidos', icon: ClipboardList },
  { to: '/admin/products/upload', label: 'Importar produtos', icon: Upload },
  { to: '/', label: 'Ver a loja', icon: Store },
];

type Counts = Record<string, number>;

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [counts, setCounts] = useState<Counts | null>(null);
  const [countsError, setCountsError] = useState(false);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');

  const profileRef = useRef<HTMLDivElement | null>(null);
  const sidebarToggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let active = true;

    setLoadingCounts(true);

    Promise.all(
      QUEUES.map(async (queue) => {
        const snapshot = await getCountFromServer(
          query(collection(db, 'orders'), where(queue.field, '==', queue.value))
        );

        return [queue.key, snapshot.data().count] as const;
      })
    )
      .then((entries) => {
        if (!active) return;

        setCounts(Object.fromEntries(entries));
        setCountsError(false);
      })
      .catch((error) => {
        if (!active) return;

        console.error('Não foi possível contar os pedidos:', error);
        setCountsError(true);
      })
      .finally(() => {
        if (active) setLoadingCounts(false);
      });

    return () => {
      active = false;
    };
  }, [reloadToken]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsProfileOpen(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (profileRef.current && target && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOrderSearch = (event: React.FormEvent) => {
    event.preventDefault();

    const id = orderSearch.trim();
    if (id === '') return;

    navigate(`/admin/orders/${encodeURIComponent(id)}`);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login', { replace: true });
  };

  return (
    <main className="relative h-screen pt-[68px]">
      <nav
        className={`fixed top-0 z-20 flex min-h-[68px] w-full border-b ${BORDER} ${CARD} px-4 py-2 md:px-8`}
        aria-label="Navegação do topo"
      >
        <div className="flex w-full flex-wrap items-center gap-6">
          <div className="flex flex-1">
            <Link
              to="/admin/dashboard"
              className={`rounded text-lg font-bold ${BRAND} ${FOCUS}`}
            >
              The Bush. <span className={`font-normal ${SUBTLE}`}>admin</span>
            </Link>
          </div>

          <form
            role="search"
            onSubmit={handleOrderSearch}
            className={`flex max-w-xs items-center gap-2.5 rounded-md ${CARD} px-3 py-2.5 outline-1 -outline-offset-1 ${OUTLINE} focus-within:outline-2 focus-within:-outline-offset-2 ${OUTLINE_FOCUS}`}
          >
            <label htmlFor="order-search" className="sr-only">
              Abrir pedido pelo id
            </label>
            <Search className={`size-4 shrink-0 ${SUBTLE}`} aria-hidden="true" />
            <input
              id="order-search"
              type="search"
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
              placeholder="Id do pedido..."
              className={`w-full bg-transparent text-sm ${BRAND} outline-none`}
            />
          </form>

          <div className="relative flex w-max flex-col" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-haspopup="true"
              aria-expanded={isProfileOpen}
              aria-controls="admin-menu"
              className={`flex size-9 cursor-pointer items-center justify-center rounded-full border ${BORDER} text-sm font-semibold ${MUTED} ${FOCUS}`}
            >
              {user?.email?.[0]?.toUpperCase() ?? 'A'}
            </button>

            <div
              id="admin-menu"
              className={`${isProfileOpen ? 'block' : 'hidden'} absolute right-0 top-full z-20 mt-2 min-w-56 rounded-md border ${BORDER} ${CARD} p-2 shadow-lg`}
            >
              <p className={`truncate px-2 py-1.5 text-xs ${SUBTLE}`}>{user?.email}</p>
              <button
                type="button"
                onClick={handleLogout}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md p-2 text-sm font-medium ${BRAND} transition-colors ${PINK_HOVER} ${HOVER_BRAND} ${FOCUS}`}
              >
                <LogOut className="size-[18px]" aria-hidden="true" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-start">
        <aside className="relative w-max max-lg:min-w-8 lg:min-w-[264px]">
          <div
            className={`fixed left-0 top-[68px] z-10 h-[calc(100vh-68px)] overflow-auto border-r ${BORDER} ${CARD} px-4 py-6 transition-all duration-500 ${ isSidebarOpen ? 'visible w-[264px] opacity-100' : 'lg:w-[264px] max-lg:invisible max-lg:w-0 max-lg:opacity-0' }`}
          >
            <nav aria-label="Navegação principal">
              <ul className={`space-y-1 text-sm font-medium ${BRAND}`}>
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      aria-current={to === '/admin/dashboard' ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors ${PINK_HOVER} ${HOVER_BRAND} ${FOCUS}`}
                    >
                      <Icon className="size-[18px]" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <button
            ref={sidebarToggleRef}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-expanded={isSidebarOpen}
            aria-label="Abrir ou fechar o menu"
            style={{ left: isSidebarOpen ? '250px' : '10px' }}
            className={`fixed top-[74px] z-[100] flex size-8 cursor-pointer items-center justify-center rounded-full ${BRAND_BG} transition-all duration-500 lg:hidden`}
          >
            <ChevronRight
              className={`size-4 text-white transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </aside>

        <section className="main-content w-full overflow-auto p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className={`text-2xl font-bold ${BRAND}`}>Painel</h1>
              <p className={`mt-2 text-sm ${MUTED}`}>
                O que está esperando ação. Clique num número para ir aos pedidos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              disabled={loadingCounts}
              className={`flex cursor-pointer items-center gap-2 rounded-md border ${BORDER} ${CARD} px-3.5 py-2 text-sm font-medium ${BRAND} transition-colors ${PINK_HOVER} disabled:cursor-not-allowed ${DISABLED_SUBTLE} ${FOCUS}`}
            >
              <RefreshCw
                className={`size-4 ${loadingCounts ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              Atualizar
            </button>
          </div>

          {countsError && (
            <p className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Não foi possível ler os pedidos. Confirme que seu uid está na coleção
              admins/ e que as regras do Firestore foram publicadas.
            </p>
          )}

          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {QUEUES.map(({ key, label, hint, icon: Icon, className }) => (
              <Link
                key={key}
                to="/admin/orders"
                className={`rounded-lg border ${BORDER} ${CARD} p-6 transition-colors ${HOVER_BRAND_BORDER} ${FOCUS}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-sm font-medium ${MUTED}`}>{label}</p>
                    <p className={`mt-3 text-3xl font-bold ${BRAND}`}>
                      {loadingCounts && counts === null
                        ? '—'
                        : countsError
                          ? '?'
                          : (counts?.[key] ?? 0)}
                    </p>
                    <p className={`mt-2 text-xs ${SUBTLE}`}>{hint}</p>
                  </div>

                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${className}`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

//testing
