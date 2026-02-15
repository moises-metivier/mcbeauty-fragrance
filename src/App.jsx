// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

// Layouts
import PublicLayout from "./layouts/PublicLayout";

// Auth / Guards
import RequireAuth from "./components/RequireAuth";

/* ============================= */
/* LAZY LOADING (PAGES)          */
/* ============================= */

// Public
const Home = lazy(() => import("./pages/Home"));
const Category = lazy(() => import("./pages/Category"));
const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));

// 🆕 Legal Pages (IMPORT NORMAL o lazy, pero lo dejamos lazy profesional)
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const DataDeletion = lazy(() => import("./pages/DataDeletion"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));

// Admin Core
const AdminLayout = lazy(() => import("./pages/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminOrderDetail = lazy(() => import("./pages/AdminOrderDetail"));
const AdminPaymentMethods = lazy(() => import("./pages/AdminPaymentMethods"));
const AdminCampaigns = lazy(() => import("./pages/AdminCampaigns"));
const AdminInsights = lazy(() => import("./pages/AdminInsights"));
const AdminPublisher = lazy(() => import("./pages/AdminPublisher"));

// Auth
const AdminLogin = lazy(() => import("./pages/AdminLogin"));

// 2FA
const Enable2FA = lazy(() => import("./pages/Enable2FA"));
const Verify2FA = lazy(() => import("./pages/Verify2FA"));

// Marketing / Designer
const AdminMarketingImages = lazy(() => import("./pages/AdminMarketingImages"));
const AdminMarketingPosts = lazy(() => import("./pages/AdminMarketingPosts"));
const AdminDesigner = lazy(() => import("./pages/AdminDesigner"));
const AdminDesigns = lazy(() => import("./pages/AdminDesigns"));
const AdminPosts = lazy(() => import("./pages/AdminPosts"));
const AdminHomeSections = lazy(() => import("./pages/AdminHomeSections"));

export default function App() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Cargando…</div>}>
      <Routes>

        {/* 🌍 PUBLIC SITE */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* 🆕 LEGAL PAGES (SEO + META REQUIRED) */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/data-deletion" element={<DataDeletion />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
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
          <Route path="home-sections" element={<AdminHomeSections />} />
          <Route path="publisher" element={<AdminPublisher />} />
        </Route>

        {/* ❓ FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Suspense>
  );
}