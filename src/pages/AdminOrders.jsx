// src/pages/AdminOrders.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../Admin.css";

export default function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* -------------------- CARGAR ÓRDENES -------------------- */
  async function loadOrders() {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        customer_name,
        total,
        status,
        created_at,
        payment_methods (
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando órdenes:", error);
      setOrders([]);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  /* -------------------- FILTRO BUSCADOR -------------------- */
  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return orders;

    return orders.filter((o) => {
      return (
        o.customer_name?.toLowerCase().includes(q) ||
        String(o.order_number).includes(q) ||
        o.status?.toLowerCase().includes(q)
      );
    });
  }, [orders, search]);

  /* -------------------- UI -------------------- */
  return (
    <div className="admin-main">
      <header className="admin-main-header">
        <div className="admin-main-title-block">
          <h1>📦 Órdenes</h1>
          <p>Gestión completa de pedidos realizados</p>
        </div>
      </header>

      <section className="admin-card">
        <div className="admin-card-header">
          <h2>Pedidos</h2>
          <span>
            {loading
              ? "Cargando..."
              : `${filteredOrders.length} de ${orders.length} órdenes`}
          </span>
        </div>

        {/* 🔎 BUSCADOR */}
        <input
          type="text"
          placeholder="Buscar por cliente, número o estado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: 14,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 14,
          }}
        />

        {/* TABLA */}
        <table className="admin-products-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Cargando órdenes...</td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7}>No hay órdenes</td>
              </tr>
            ) : (
              filteredOrders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>#{o.order_number || o.id}</strong>
                  </td>

                  <td>{o.customer_name}</td>

                  <td>RD${Number(o.total).toFixed(2)}</td>

                  <td>{o.payment_methods?.name || "—"}</td>

                  <td>
                    <span className={`status-pill status-${o.status}`}>
                      {o.status}
                    </span>
                  </td>

                  <td>
                    {new Date(o.created_at).toLocaleDateString("es-DO")}
                  </td>

                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        navigate(`/admin/orders/${o.id}`)
                      }
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}