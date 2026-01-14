// src/pages/AdminCampaigns.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { generateMarketingContent } from "../services/marketingAIService";

import "../admin.css";


function safeInt(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fb;
}

export default function AdminCampaigns() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);

  const [marketingImages, setMarketingImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    banner_url: "",
    start_date: "",
    end_date: "",
    priority: 1,
    active: true,
  });

  async function loadCampaigns() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (e) {
      console.error("Error cargando campañas:", e);
      setCampaigns([]);
      alert("No se pudieron cargar las campañas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return campaigns;
    return campaigns.filter((c) =>
      [c.title, c.subtitle]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [campaigns, search]);

  
  useEffect(() => {
    async function loadImages() {
      const { data } = await supabase
        .from("marketing_images")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      setMarketingImages(data || []);
    }

    loadImages();
  }, []);



  function resetForm() {
    setEditingId(null);
    setForm({
      title: "",
      subtitle: "",
      banner_url: "",
      start_date: "",
      end_date: "",
      priority: campaigns.length + 1,
      active: true,
    });
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      title: c.title || "",
      subtitle: c.subtitle || "",
      banner_url: c.banner_url || "",
      start_date: c.start_date || "",
      end_date: c.end_date || "",
      priority: safeInt(c.priority, 1),
      active: Boolean(c.active),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!String(form.title || "").trim()) {
      alert("La campaña debe tener un título");
      return;
    }

    const payload = {
      title: String(form.title).trim(),
      subtitle: String(form.subtitle || "").trim() || null,
      banner_url: String(form.banner_url || "").trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      priority: safeInt(form.priority, 1),
      active: Boolean(form.active),
    };

    try {
      setLoading(true);

      if (editingId) {
        const { error } = await supabase
          .from("campaigns")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("campaigns")
          .insert(payload);
        if (error) throw error;
      }

      await loadCampaigns();
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Error guardando la campaña (revisa RLS/columnas)");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id) {
    const c = campaigns.find((x) => x.id === id);
    if (!c) return;

    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ active: !c.active })
        .eq("id", id);
      if (error) throw error;
      await loadCampaigns();
    } catch (e) {
      console.error(e);
      alert("No se pudo cambiar el estado");
    }
  }

  async function deleteCampaign(id) {
    const c = campaigns.find((x) => x.id === id);
    if (!window.confirm(`¿Eliminar "${c?.title || "campaña"}"?`)) return;

    try {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await loadCampaigns();
      if (editingId === id) resetForm();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar la campaña");
    }
  }

  async function handleGenerateAI(mode = "growth") {
    try {
      // 🔒 Validación PRO: exigir imagen seleccionada
      if (!selectedImage) {
        alert("Selecciona una imagen antes de generar la publicación.");
        return;
      }

      setAiLoading(true);
      setAiError(null);
      setAiResult(null);

      const result = await generateMarketingContent({
        mode,
        image: selectedImage, // 👈 conexión directa con la imagen
      });

      setAiResult(result.text);
    } catch (e) {
      console.error("Error IA:", e);
      setAiError(e.message || "Error generando contenido");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="admin-main">
      <header className="admin-main-header">
        <div className="admin-main-title-block">
          <h1>🎯 Campañas / Temporadas</h1>
          <p>
            Navidad, Día de la Madre, Padre, Black Friday.  
            La campaña activa con mayor prioridad es la que se muestra en la web.
          </p>
        </div>
      </header>

      {/* FORM */}
      <section className="admin-card" style={{ marginTop: 18 }}>
        <div className="admin-card-header">
          <h2>{editingId ? "Editar campaña" : "Nueva campaña"}</h2>
          <span>{loading ? "Procesando..." : `${campaigns.length} campañas`}</span>
        </div>

        <form className="admin-product-form" onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Título</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Ej: Navidad Brillante 🎄" />
          </div>

          <div className="admin-form-group">
            <label>Subtítulo</label>
            <input name="subtitle" value={form.subtitle} onChange={handleChange} placeholder="Descuentos y regalos especiales" />
          </div>

          <div className="admin-form-group">
            <label>Banner (URL o base64)</label>
            <input name="banner_url" value={form.banner_url} onChange={handleChange} placeholder="https://..." />
          </div>

          <div className="admin-form-group">
            <label>Fecha inicio (opcional)</label>
            <input type="date" name="start_date" value={form.start_date} onChange={handleChange} />
          </div>

          <div className="admin-form-group">
            <label>Fecha fin (opcional)</label>
            <input type="date" name="end_date" value={form.end_date} onChange={handleChange} />
          </div>

          <div className="admin-form-group">
            <label>Prioridad (más alto = manda)</label>
            <input type="number" min="1" name="priority" value={form.priority} onChange={handleChange} />
          </div>

          <div className="admin-form-group">
            <label>Activa</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="checkbox" name="active" checked={Boolean(form.active)} onChange={handleChange} />
              <span>{form.active ? "Sí" : "No"}</span>
            </div>
          </div>

          <div className="admin-form-footer">
            <button className="btn-primary" type="submit" disabled={loading}>
              {editingId ? "💾 Guardar cambios" : "+ Agregar campaña"}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm} style={{ marginLeft: 10 }}>
              Cancelar
            </button>
          </div>
        </form>
      </section>

      {/* 🤖 PANEL DE PUBLICACIONES IA */}
      <section className="admin-card" style={{ marginTop: 18 }}>
        <div className="admin-card-header">
          <h2>🤖 Generador de publicaciones con IA</h2>
          <span>Marketing inteligente</span>
        </div>

        <div className="admin-card">
          <h3>🖼️ Imagen para la publicación</h3>

          {marketingImages.length === 0 ? (
            <p>No hay imágenes activas.</p>
          ) : (
            <div className="grid">
              {marketingImages.map((img) => (
                <div
                  key={img.id}
                  className={`card selectable ${
                    selectedImage?.id === img.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedImage(img)}
                >
                  <div className="gallery-img-box">
                    <img src={img.image_url} alt={img.title} />
                  </div>
                  <strong>{img.title}</strong>
                  <div>#{img.tag}</div>
                </div>
              ))}
            </div>
          )}

          {selectedImage && (
            <p style={{ marginTop: 10 }}>
              ✅ Imagen seleccionada: <strong>{selectedImage.title}</strong>
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn-primary"
            disabled={aiLoading}
            onClick={() => handleGenerateAI("growth")}
          >
            {aiLoading ? "Generando..." : "✨ Contenido de crecimiento"}
          </button>

          <button
            className="btn-secondary"
            disabled={aiLoading}
            onClick={() => handleGenerateAI("campaign")}
          >
            🎯 Para campaña activa
          </button>
        </div>

        {/* RESULTADO */}
        {aiResult && (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 10,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              whiteSpace: "pre-wrap",
            }}
          >
            <h4 style={{ marginBottom: 8 }}>Resultado IA</h4>
            <pre style={{ fontSize: 14 }}>{aiResult}</pre>
          </div>
        )}

        {/* ERROR */}
        {aiError && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: "#fee2e2",
              color: "#991b1b",
            }}
          >
            ❌ {aiError}
          </div>
        )}
      </section>

      {/* LISTA */}
      <section className="admin-card" style={{ marginTop: 18 }}>
        <div className="admin-card-header">
          <h2>Lista</h2>
          <span>{loading ? "..." : `${filtered.length} resultados`}</span>
        </div>

        <input
          type="text"
          placeholder="Buscar campaña..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", marginBottom: 14, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />

        <table className="admin-products-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Fechas</th>
              <th>Prioridad</th>
              <th>Activa</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5}>No hay campañas</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.title}</strong>
                    {c.subtitle && <div style={{ fontSize: 12, opacity: 0.8 }}>{c.subtitle}</div>}
                  </td>
                  <td>
                    {c.start_date || "—"} → {c.end_date || "—"}
                  </td>
                  <td>{safeInt(c.priority, 1)}</td>
                  <td>
                    <span className={"badge " + (c.active ? "green" : "gray")}>
                      {c.active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button className="btn-secondary" onClick={() => startEdit(c)}>Editar</button>
                    <button className="btn-secondary" onClick={() => toggleActive(c.id)}>
                      {c.active ? "Desactivar" : "Activar"}
                    </button>
                    <button className="btn-danger" onClick={() => deleteCampaign(c.id)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <p style={{ marginTop: 12, fontSize: 13, opacity: 0.85 }}>
          ✅ Recomendación PRO: usa <strong>prioridad</strong> para decidir qué campaña se muestra sin borrar las demás.
        </p>
      </section>
    </div>
  );
}