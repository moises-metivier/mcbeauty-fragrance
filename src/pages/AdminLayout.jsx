// src/pages/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import "../Admin.css";
import { subscribeToPresence } from "../services/presenceService";
import { supabase } from "../lib/supabaseClient";
import {
  trackPageView,
  getTotalVisits,
  getTodayVisits,
} from "../services/analyticsService";

export default function AdminLayout() {
  const navigate = useNavigate();

async function handleLogout() {
  localStorage.removeItem("mfa-verified"); // 🔑 LIMPIA EL BYPASS 2FA
  await supabase.auth.signOut();
  navigate("/admin/login", { replace: true });
}

  // presencia
  const [onlineUsers, setOnlineUsers] = useState(0);

  // visitas
  const [totalVisits, setTotalVisits] = useState(0);
  const [todayVisits, setTodayVisits] = useState(0);

  /* PRESENCIA */
  useEffect(() => {
    const unsubscribe = subscribeToPresence((count) =>
      setOnlineUsers(count)
    );
    return () => unsubscribe?.();
  }, []);

  /* VISITAS */
  useEffect(() => {
    (async () => {
      try {
        await trackPageView("/admin");
        const [t, d] = await Promise.all([
          getTotalVisits(),
          getTodayVisits(),
        ]);
        setTotalVisits(t);
        setTodayVisits(d);
      } catch {}
    })();
  }, []);

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      
      <aside className="admin-sidebar">
        {/* LOGO */}
        <div className="admin-logo">
          <div className="admin-logo-circle">MC</div>
          <div className="admin-logo-text">
            <span>MC Beauty</span>
            <span>Fragrance & Glow</span>
          </div>
        </div>

       {/* NAV PRINCIPAL (MENÚ) */}
        <div className="admin-sidebar-nav">
          <div className="admin-nav-section-title">Panel</div>

          <button
            className="admin-nav-link primary"
            onClick={() => navigate("/admin")}
          >
            <span>📊 Dashboard</span>
          </button>

          <button
            className="admin-nav-link secondary"
            onClick={() => navigate("/admin")}
          >
            <span>🧴 Productos</span>
          </button>

          <button
            className="admin-nav-link secondary"
            onClick={() => navigate("/admin/orders")}
          >
            <span>📦 Órdenes</span>
          </button>

          <button
            className="admin-nav-link secondary"
            onClick={() => navigate("/admin/payment-methods")}
          >
            <span>💳 Métodos de pago</span>
          </button>

          <button
            className="admin-nav-link secondary"
            onClick={() => navigate("/admin/marketing-images")}
          >
            <span>🖼️ Recursos de Marketing</span>
          </button>

          <button
            className="admin-nav-link secondary"
            onClick={() => navigate("/admin/designer")}
          >
            <span>🎨 Diseñador (Mini-Canva)</span>
          </button>

          <button
            className="admin-nav-link"
            onClick={() => navigate("/admin/designs")}
          >
            🎨 Diseños
          </button>

          <button
            className="admin-nav-link secondary"
            onClick={() => navigate("/admin/marketing-posts")}
          >
            <span>🤖 Publicaciones IA</span>
          </button>

          <button
            className="admin-nav-link secondary"
            onClick={() => navigate("/admin/posts")}
          >
            <span>📢 Publicaciones</span>
          </button>

          {/* 🧠 NUEVO — PANEL DE ESTRATEGIA */}
          <button
            className="admin-nav-link secondary"
            onClick={() => navigate("/admin/insights")}
          >
            <span>🧠 Estrategia</span>
          </button>
        </div>

        {/* INFO DE SESIÓN (NO SE VA AL FONDO) */}
        <div className="admin-sidebar-info">
          <div>
            Sesión: <strong>Administrador</strong>
          </div>
          <div style={{ marginTop: 6, fontSize: 12 }}>
            👥 Online: <strong>{onlineUsers}</strong>
          </div>
          <div style={{ marginTop: 4, fontSize: 12 }}>
            👀 Visitas: <strong>{totalVisits}</strong> (hoy:{" "}
            <strong>{todayVisits}</strong>)
          </div>
        </div>

        {/* FOOTER SOLO PARA LOGOUT */}
        <div className="admin-sidebar-footer">
          <button
            onClick={handleLogout}
            className="admin-logout-btn"
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}