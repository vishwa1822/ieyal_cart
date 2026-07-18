import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";

import HomePage from "./pages/HomePage";
import PublicHomePage from "./pages/PublicHomePage";
import LoginPage from "./pages/LoginPage";
import LocationPage from "./pages/LocationPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/OrdersPage";
import AddressPage from "./pages/AddressPage";
import OutletSelectionPage from "./pages/OutletSelectionPage";
import SplashPage from "./pages/SplashPage";
import StoreClosedPage from "./pages/StoreClosedPage";
import BookTablePage from "./pages/BookTablePage";
import SearchPage from "./pages/SearchPage";

// "/" is the public marketing homepage (guest-accessible, no auth required).
// "/home" is the authenticated Home experience — reached only via
// Login → OTP → Location selection, and reused as the landing point for
// every other authenticated flow (Dine In, Cart, etc. link back here).

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/splash" element={<SplashPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/location" element={<LocationPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/address" element={<AddressPage />} />
          <Route path="/outlets" element={<OutletSelectionPage />} />
          <Route path="/closed" element={<StoreClosedPage />} />
          <Route path="/book-table" element={<BookTablePage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
