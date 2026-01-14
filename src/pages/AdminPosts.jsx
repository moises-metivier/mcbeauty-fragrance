// src/pages/AdminPosts.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import "../admin.css";

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // filtros UI
  const [statusFilter, setStatusFilter] = useState("all"); // all | draft | published
  const [campaignFilter, setCampaignFilter] = useState("all"); // all | uuid

  useEffect(() => {
    (async () => {
      await Promise.all([loadCampaigns(), loadPosts()]);
    })();
  }, []);

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return "";
    }
  }

  async function loadCampaigns() {
    const { data, error } = await supabase
      .from("campaigns")
      .select("id,title,active,priority,created_at")
      .order("active", { ascending: false })
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error cargando campañas:", error);
      return;
    }

    setCampaigns(data || []);
  }

  async function loadPosts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("marketing_posts")
      .select(
        `
        id,
        platform,
        content,
        image_id,
        status,
        created_at,
        template_type,
        objective,
        format,
        campaign_id,
        campaigns:campaign_id ( id, title, active, priority )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error cargando posts:", error);
      alert("❌ Error cargando publicaciones");
      setLoading(false);
      return;
    }

    setPosts(data || []);
    setLoading(false);
  }

  async function markAsPublished(id) {
    const ok = confirm("¿Marcar esta publicación como publicada?");
    if (!ok) return;

    const { error } = await supabase
      .from("marketing_posts")
      .update({ status: "published" })
      .eq("id", id);

    if (error) {
      console.error("❌ Error actualizando estado:", error);
      alert("❌ No se pudo marcar como publicado");
      return;
    }

    loadPosts();
  }

  async function assignCampaign(postId, campaignId) {
    // campaignId puede ser "null" (string) cuando eliges "Sin campaña"
    const next = campaignId === "null" ? null : campaignId;

    const { error } = await supabase
      .from("marketing_posts")
      .update({ campaign_id: next })
      .eq("id", postId);

    if (error) {
      console.error("❌ Error asignando campaña:", error);
      alert("❌ No se pudo asignar la campaña");
      return;
    }

    loadPosts();
  }

  async function copyText(content) {
    try {
      await navigator.clipboard.writeText(content || "");
      alert("✅ Texto copiado");
    } catch {
      alert("❌ No se pudo copiar");
    }
  }

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const statusOk =
        statusFilter === "all" ? true : (p.status || "") === statusFilter;

      const campaignOk =
        campaignFilter === "all"
          ? true
          : (p.campaign_id || "") === campaignFilter;

      return statusOk && campaignOk;
    });
  }, [posts, statusFilter, campaignFilter]);

  return (
    <div className="admin-page">
      <h1>📣 Publicaciones generadas</h1>
      <p>Todo lo que la IA ha creado listo para publicar.</p>

      {/* TOOLBAR PRO */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          marginTop: 14,
          marginBottom: 18,
        }}
      >
        {/* Filtro de estado */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>Estado:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 10 }}
          >
            <option value="all">Todos</option>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
          </select>
        </div>

        {/* Filtro de campaña */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>Campaña:</span>
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 10, minWidth: 220 }}
          >
            <option value="all">Todas</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.active ? "✅ " : ""}{c.title} {c.active ? `(P${c.priority ?? "-"})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Acciones */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={() => loadPosts()}
            title="Recargar"
          >
            🔄 Actualizar
          </button>

          <button
            className="btn-secondary"
            onClick={() => navigate ("/admin/campaigns")}
            title="Ir a campañas"
          >
            🎯 Administrar campañas
          </button>
        </div>
      </div>

      {loading && <p>Cargando publicaciones...</p>}

      {!loading && filteredPosts.length === 0 && (
        <p>No hay publicaciones con esos filtros.</p>
      )}

      <div className="admin-grid">
        {filteredPosts.map((p) => (
          <div key={p.id} className="admin-card">
            {/* HEADER */}
            <div className="admin-card-header">
              <strong style={{ textTransform: "lowercase" }}>
                {p.platform || "red social"}
              </strong>

              <span className={`status ${p.status}`}>
                {(p.status || "draft").toUpperCase()}
              </span>
            </div>

            {/* FECHA (ELEGANTE) */}
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
              {formatDate(p.created_at)}
            </div>

            {/* CONTENIDO */}
            <pre className="post-content">{p.content}</pre>

            {/* META + CAMPAÑA */}
            <div className="meta" style={{ marginTop: 12 }}>
              <div>
                <b>Plantilla:</b> {p.template_type || "-"}
              </div>
              <div>
                <b>Objetivo:</b> {p.objective || "-"}
              </div>
              <div>
                <b>Formato:</b> {p.format || "-"}
              </div>

              {/* Selector de campaña */}
              <div style={{ marginTop: 10 }}>
                <b>Campaña:</b>{" "}
                <select
                  value={p.campaign_id || "null"}
                  onChange={(e) => assignCampaign(p.id, e.target.value)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    marginLeft: 8,
                    minWidth: 220,
                  }}
                >
                  <option value="null">— Sin campaña —</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.active ? "✅ " : ""}{c.title}
                    </option>
                  ))}
                </select>

                {/* badge suave */}
                {p.campaigns?.title && (
                  <span
                    style={{
                      marginLeft: 10,
                      fontSize: 12,
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: "1px solid rgba(0,0,0,0.08)",
                      opacity: 0.85,
                      display: "inline-block",
                    }}
                    title="Campaña asignada"
                  >
                    🎯 {p.campaigns.title}
                    {p.campaigns.active ? " ✅" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* ACCIONES */}
            <div className="actions" style={{ marginTop: 14 }}>
              <button onClick={() => copyText(p.content)}>
                📋 Copiar texto
              </button>

              {p.status !== "published" && (
                <button
                  className="btn-secondary"
                  onClick={() => markAsPublished(p.id)}
                >
                  ✅ Marcar como publicado
                </button>
              )}

              {/* FUTURO */}
              <button disabled title="Próximamente">
                📅 Programar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}