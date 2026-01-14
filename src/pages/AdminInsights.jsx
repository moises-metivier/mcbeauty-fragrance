// src/pages/AdminInsights.jsx
import { useEffect, useState } from "react";
import { getStoreInsights } from "../services/insightsService";
import "../admin.css";

export default function AdminInsights() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const res = await getStoreInsights();
      setData(res);
    } catch (e) {
      console.error(e);
      alert("Error cargando insights");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="admin-main">Cargando insights...</div>;
  }

  if (!data) {
    return <div className="admin-main">No hay datos</div>;
  }

  const { campaign, topViewed, missingSearches } = data;

  return (
    <div className="admin-main">
      <header className="admin-main-header">
        <h1>🧠 Panel de Estrategia</h1>
        <p>Decisiones reales basadas en datos, no en suposiciones.</p>
      </header>

      {/* CAMPAÑA */}
      <section className="admin-card">
        <h2>🎯 Campaña activa</h2>
        {campaign ? (
          <>
            <strong>{campaign.title}</strong>
            {campaign.subtitle && <p>{campaign.subtitle}</p>}
          </>
        ) : (
          <p>No hay campaña activa</p>
        )}
      </section>

      {/* PRODUCTOS TOP */}
      <section className="admin-card">
        <h2>🔥 Productos más vistos</h2>
        <ul>
          {(topViewed || []).map((p) => (
            <li key={p.product_id}>
              {p.product?.name || "Producto eliminado"} — {p.views} vistas
            </li>
          ))}
        </ul>
      </section>

      {/* BÚSQUEDAS SIN RESULTADOS */}
      <section className="admin-card">
        <h2>❗ Búsquedas sin productos</h2>
        <ul>
          {(missingSearches || []).map((s) => (
            <li key={s.canonical}>
              <strong>{s.canonical}</strong> — {s.total} búsquedas
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}