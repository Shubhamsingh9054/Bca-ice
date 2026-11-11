import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
import { OrderTimingProvider } from './context/OrderTimingContext';
import { CartProvider } from './context/CartContext';

// Customer Pages
import { HomePage } from './pages/HomePage';
import { BrandPage } from './pages/BrandPage';
import { SearchPage } from './pages/SearchPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { OffersPage } from './pages/OffersPage';
import { ProfilePage } from './pages/ProfilePage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminDailyStock } from './pages/admin/AdminDailyStock';
import { AdminTokenVerify } from './pages/admin/AdminTokenVerify';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminBrands } from './pages/admin/AdminBrands';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminBanners } from './pages/admin/AdminBanners';
import { AdminSettings } from './pages/admin/AdminSettings';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AuthProvider>
          <OrderTimingProvider>
            <CartProvider>
              <Routes>
                {/* Customer Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/brand/:brandSlug" element={<BrandPage />} />
                <Route path="/menu" element={<SearchPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="/offers" element={<OffersPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Admin Management Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/stock" element={<AdminDailyStock />} />
                <Route path="/admin/verify-token" element={<AdminTokenVerify />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/brands" element={<AdminBrands />} />
                <Route path="/admin/payments" element={<AdminPayments />} />
                <Route path="/admin/banners" element={<AdminBanners />} />
                <Route path="/admin/settings" element={<AdminSettings />} />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CartProvider>
          </OrderTimingProvider>
        </AuthProvider>
      </StoreProvider>
    </BrowserRouter>
  );
};

export default App;
