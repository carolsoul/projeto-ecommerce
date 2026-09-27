import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import StoreLayout from './layouts/StoreLayout';
import CheckoutLayout from './layouts/CheckoutLayout';
import FooterLayout from './layouts/FooterLayout'

import Home from './pages/Home';
import ProductPage from "./pages/ProductPage"
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
//import Orders from "./pages/Orders";

const Checkout = lazy(() => import('./pages/Checkout'));
const CheckoutReturn = lazy(() => import('./pages/CheckoutReturn'));

// telas de admin ficam em chunks separados
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const ProductUpload = lazy(() => import('./pages/admin/ProductUpload'));
//import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
       <AuthProvider>
        <CartProvider>
         <WishlistProvider>
          <Suspense fallback={<p className="text-center py-20">Carregando...</p>}>
            <Routes>
              <Route element={<FooterLayout />}>
                <Route element={<StoreLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/produto/:sku" element={<ProductPage />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                </Route>

                {/* Checkout com header minimalista, com footer */}
                <Route element={<CheckoutLayout />}>
                  <Route path="/checkout" element={<Checkout />} />
                  {/* Volta do Mercado Pago. O id vai no caminho porque o MP
                      anexa a query string dele por cima da nossa. */}
                  <Route path="/checkout/retorno/:orderId" element={<CheckoutReturn />} />
                  {/*<Route path="/checkout/pagamento" element={<Payment />} /> */}
                </Route>
              </Route>

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<ProtectedRoute />}>
                {/*<Route path="/admin" element={<AdminDashboard />} />*/}
                <Route path="/admin/products/upload" element={<ProductUpload />} />
              </Route>
            </Routes>
          </Suspense>
         </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;