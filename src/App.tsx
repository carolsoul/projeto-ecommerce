import { BrowserRouter, Route, Routes } from "react-router-dom";
import  Home from './pages/Home';
import Cart from "./pages/Cart";
//import Whishlist from "./pages/Wishlist";
//import Orders from "./pages/Orders";
//import Checkout from "./pages/Checkout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        {/* <Route path="/wishlist" element={<Whishlist />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/checkout" element={<Checkout />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;