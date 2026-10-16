import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { BRAND_BG, CREAM, FOCUS, HOVER_ON_BRAND, MUTED, ON_BRAND } from '../lib/theme';

/**
 * Rodapé da loja.
 */

interface FooterLink {
  name: string;
  to: string;
}

const STORE_LINKS: FooterLink[] = [
  { name: 'Coleção nova', to: '/?colecao=novidades' },
  { name: 'Todos os produtos', to: '/' },
  { name: 'Carrinho', to: '/cart' },
];

/** O que faz sentido oferecer a quem já entrou. */
const ACCOUNT_LINKS_SIGNED_IN: FooterLink[] = [
  { name: 'Meus pedidos', to: '/orders' },
  { name: 'Meus favoritos', to: '/wishlist' },
];

const ACCOUNT_LINKS_SIGNED_OUT: FooterLink[] = [
  { name: 'Entrar', to: '/login' },
  { name: 'Criar conta', to: '/signup' },
];

export default function FooterLayout() {
   const { user } = useAuth();

   const accountLinks = user ? ACCOUNT_LINKS_SIGNED_IN : ACCOUNT_LINKS_SIGNED_OUT;

   const sections = [
      { title: 'Loja', links: STORE_LINKS },
      { title: 'Minha conta', links: accountLinks },
   ];

   return (
      <div className={`${CREAM} flex min-h-screen flex-col`}>
         <div className="flex-1">
            <Outlet />
         </div>

         <footer className={`${BRAND_BG} rounded-lg pt-16 pb-8 m-4 px-4 md:px-8`}>
            <div className="max-w-7xl mx-auto">
               <div className="grid grid-cols-2 gap-y-12 gap-x-6 sm:gap-x-8 lg:grid-cols-4">
                  {sections.map((section) => (
                     <nav key={section.title} aria-label={section.title}>
                        <h3 className={`${ON_BRAND} font-semibold text-sm mb-6`}>
                           {section.title}
                        </h3>
                        <ul className={`space-y-4 ${MUTED} text-sm font-normal`}>
                           {section.links.map((link) => (
                              <li key={link.name}>
                                 <Link
                                    to={link.to}
                                    className={`${HOVER_ON_BRAND} ${FOCUS} rounded transition-all`}
                                 >
                                    {link.name}
                                 </Link>
                              </li>
                           ))}
                        </ul>
                     </nav>
                  ))}

                  <div className="col-span-2">
                     <h3 className={`${ON_BRAND} font-semibold text-sm mb-6`}>The Bush.</h3>
                     <p className={`${MUTED} text-sm max-w-sm`}>
                        Peças de coleção retrô com modelos únicos, em cores e formas
                        diferentes. Enviamos para todo o Brasil.
                     </p>
                  </div>
               </div>

               <hr className={`${MUTED} my-8`} />

               <div className="text-left">
                  <p className={`${MUTED} text-sm`}>
                     © {new Date().getFullYear()} The Bush. Todos os direitos reservados.
                  </p>
               </div>
            </div>
         </footer>
      </div>
   );
}
