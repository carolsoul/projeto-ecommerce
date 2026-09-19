import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { CartProvider } from './context/CartContext';

import StoreLayout from './layouts/StoreLayout';
//import CheckoutLayout from './layouts/CheckoutLayout';
import FooterLayout from './layouts/FooterLayout'

import  Home from './pages/Home';
import ProductPage from "./pages/ProductPage"
import Cart from "./pages/Cart";
//import Whishlist from "./pages/Wishlist";
//import Orders from "./pages/Orders";
//import Checkout from "./pages/Checkout";


// As telas de admin ficam em chunks separados: elas carregam Zod e PapaParse,
// que não têm por que pesar no bundle de quem só quer comprar.
const Login = lazy(() => import('./pages/admin/Login'));
const ProductUpload = lazy(() => import('./pages/admin/ProductUpload'));
//import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
       <AuthProvider>
        <CartProvider>
          <Suspense fallback={<p className="text-center py-20">Carregando...</p>}>
            <Routes>
              <Route element={<FooterLayout />}>
                <Route element={<StoreLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/produto/:sku" element={<ProductPage />} />
                  <Route path="/cart" element={<Cart />} />
                </Route>

                {/* se o Checkout também deve ter footer, mas com header diferente:
                <Route element={<CheckoutLayout />}>
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout/pagamento" element={<Payment />} />
                </Route>*/}
              </Route>

              {/* Admin fica fora do FooterLayout inteiramente, se não quiser footer lá */}
              <Route path="/admin/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                {/*<Route path="/admin" element={<AdminDashboard />} />*/}
                <Route path="/admin/products/upload" element={<ProductUpload />} />
              </Route>
            </Routes>
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;