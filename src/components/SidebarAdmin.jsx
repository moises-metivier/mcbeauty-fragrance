import { useNavigate, useLocation } from "react-router-dom";

export default function SidebarAdmin() {
  const navigate = useNavigate();
  const location = useLocation();

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-logo">
        <strong>MC Beauty</strong>
        <span>Fragrance & Glow</span>
      </div>

      <nav className="admin-nav">
        <button
          className={isActive("/admin") ? "active" : ""}
          onClick={() => navigate("/admin")}
        >
          📊 Dashboard
        </button>

        <button onClick={() => navigate("/admin/orders")}>
          📦 Órdenes
        </button>

        <button onClick={() => navigate("/admin/payment-methods")}>
          💳 Métodos de pago
        </button>

        <button onClick={() => navigate("/admin/campaigns")}>
          🤖 Publicaciones IA
        </button>
      </nav>
    </aside>
  );
}