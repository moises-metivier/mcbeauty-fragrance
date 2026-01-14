// src/pages/AdminDesigns.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { processNextAIJob } from "../services/aiQueueProcessor";
import "../admin.css";

export default function AdminDesigns() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==============================
  // 📥 CARGAR DISEÑOS
  // ==============================
  async function loadDesigns() {
    setLoading(true);

    const { data, error } = await supabase
      .from("marketing_designs")
      .select(`
        *,
        marketing_images (
          id,
          display_name,
          image_url
        )
      `)
      .order("created_at", { ascending: false });

    if (!error) setDesigns(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadDesigns();
  }, []);

  // ==============================
  // ⬇️ DESCARGAR IMAGEN
  // ==============================
  function downloadImage(url, name = "design.png") {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.click();
  }

  // ==============================
  // 🗑 ELIMINAR DISEÑO
  // ==============================
  async function deleteDesign(design) {
    const ok = confirm("¿Seguro que quieres eliminar este diseño?");
    if (!ok) return;

    try {
      // 1️⃣ borrar registro
      const { error } = await supabase
        .from("marketing_designs")
        .delete()
        .eq("id", design.id);

      if (error) throw error;

      // 2️⃣ borrar archivo del storage (si existe)
      if (design.final_image_url) {
        const parts = design.final_image_url.split("/designs/");
        if (parts.length === 2) {
          const path = `designs/${parts[1]}`;
          await supabase.storage.from("designs").remove([path]);
        }
      }

      loadDesigns();
    } catch (e) {
      console.error(e);
      alert("❌ No se pudo eliminar el diseño");
    }
  }

    // ==============================
    // 🧠 CREAR PUBLICACIÓN CON IA
    // ==============================
    async function handleCreatePostFromDesign(design) {
        try {
            const payload = {
            design_id: design.id,
            title: design.title,
            subtitle: design.subtitle,
            cta: design.cta,
            image_url: design.final_image_url,

            template_type: design.template_type,
            format: design.format,
            objective: design.objective,
            headline: design.headline,
            support_text: design.support_text,
            };

            const { error } = await supabase
            .from("ai_posts_queue")
            .insert(payload);

            if (error) throw error;

            alert("🎉 Publicación enviada a IA correctamente");
        } catch (e) {
            console.error(e);
            alert("❌ Error creando publicación con IA");
        }
    }

  // ==============================
  // 🖼️ UI
  // ==============================
  return (
    <div className="admin-main">
      <h1>🎨 Diseños guardados</h1>
      <p>Todos los artes creados con el Mini-Canva.</p>

      <button
        className="btn-secondary"
        onClick={processNextAIJob}
        style={{ marginBottom: 16 }}
      >
        ⚙️ Procesar cola IA
      </button>

      {loading ? (
        <p>Cargando…</p>
      ) : designs.length === 0 ? (
        <p>No hay diseños aún.</p>
      ) : (
        <div className="grid">
          {designs.map((design) => (
            <div key={design.id} className="card">
              {/* Imagen */}
              {design.final_image_url && (
                <div className="gallery-img-box">
                  <img
                    src={design.final_image_url}
                    alt={design.title || "Diseño"}
                  />
                </div>
              )}

              {/* Texto */}
              <strong>{design.title || "Diseño sin título"}</strong>

              {design.subtitle && (
                <div style={{ fontSize: 13, opacity: 0.85 }}>
                  {design.subtitle}
                </div>
              )}

              {design.cta && (
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  CTA: <strong>{design.cta}</strong>
                </div>
              )}

              {/* Meta */}
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                {new Date(design.created_at).toLocaleString()}
              </div>

              {/* Botones */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn-secondary"
                  onClick={() =>
                    downloadImage(
                      design.final_image_url,
                      `design-${design.id}.png`
                    )
                  }
                >
                  ⬇️ Descargar
                </button>

                <button
                  className="btn-danger"
                  onClick={() => deleteDesign(design)}
                >
                  🗑 Eliminar
                </button>

                <button
                  className="btn-primary"
                  onClick={() => handleCreatePostFromDesign(design)}
                >
                  🧠 Crear publicación con IA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}