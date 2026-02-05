// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import PublicLayout from "./layouts/PublicLayout";

// Detalle
import Product from "./pages/Product";

// Public
import Home from "./pages/Home";
import Category from "./pages/Category";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

// Admin
import AdminLayout from "./pages/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import AdminPaymentMethods from "./pages/AdminPaymentMethods";
import AdminCampaigns from "./pages/AdminCampaigns";
import AdminInsights from "./pages/AdminInsights";

// Auth
import AdminLogin from "./pages/AdminLogin";
import RequireAuth from "./components/RequireAuth";

// 2FA
import Enable2FA from "./pages/Enable2FA";
import Verify2FA from "./pages/Verify2FA";

// Mini-Canva-Publicidad
import AdminMarketingImages from "./pages/AdminMarketingImages";
import AdminDesigner from "./pages/AdminDesigner";
import AdminDesigns from "./pages/AdminDesigns";


// Post-Marketin
import AdminMarketingPosts from "./pages/AdminMarketingPosts";
import AdminPosts from "./pages/AdminPosts";
import AdminHomeSections from "./pages/AdminHomeSections";

export default function App() {
  return (
    <Routes>
      {/* 🌍 PUBLIC SITE */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
      </Route>

      {/* 🔐 ADMIN LOGIN */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* 🔑 2FA */}
      <Route
        path="/admin/2fa"
        element={
          <RequireAuth>
            <Enable2FA />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/2fa/verify"
        element={
          <RequireAuth>
            <Verify2FA />
          </RequireAuth>
        }
      />

      {/* 🧱 ADMIN PANEL */}
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="payment-methods" element={<AdminPaymentMethods />} />
        <Route path="campaigns" element={<AdminCampaigns />} />
        <Route path="insights" element={<AdminInsights />} />
        <Route path="marketing-images" element={<AdminMarketingImages />} />
        <Route path="marketing-posts" element={<AdminMarketingPosts />} />
        <Route path="designer" element={<AdminDesigner />} />
        <Route path="designs" element={<AdminDesigns />} />
        <Route path="posts" element={<AdminPosts />} />
        <Route path="/admin/home-sections" element={<AdminHomeSections />} />
      </Route>

      {/* ❓ FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}