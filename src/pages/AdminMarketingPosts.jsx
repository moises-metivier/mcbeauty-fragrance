// src/pages/AdminMarketingPosts.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  getImagesForAI,
  generateMarketingContent,
} from "../services/marketingAIService";
import "../admin.css";

export default function AdminMarketingPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // ==============================
  // 📥 CARGAR PUBLICACIONES
  // ==============================
  async function loadPosts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("marketing_posts")
      .select(`
        *,
        marketing_images (
          id,
          display_name,
          image_url
        )
      `)
      .order("created_at", { ascending: false });

    if (!error) setPosts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  // ==============================
  // 🔁 CAMBIAR ESTADO
  // ==============================
  async function toggleStatus(id, current) {
    await supabase
      .from("marketing_posts")
      .update({
        status: current === "draft" ? "published" : "draft",
      })
      .eq("id", id);

    loadPosts();
  }

  // ==============================
  // 🤖 GENERAR PUBLICACIÓN CON IA
  // ==============================
  async function handleGeneratePost() {
    try {
      setAiLoading(true);
      setAiError(null);

      // 1️⃣ Obtener imágenes activas para IA
      const images = await getImagesForAI();

      if (!images || images.length === 0) {
        throw new Error("No hay imágenes activas para usar con IA.");
      }

      // 2️⃣ Elegir una imagen (por ahora la primera)
      const selectedImage = images[0];

      // 3️⃣ Generar contenido con IA
      await generateMarketingContent({
        mode: "growth",
        image: selectedImage,
      });

      // 4️⃣ Recargar publicaciones (porque se guardan automáticamente)
      await loadPosts();
    } catch (e) {
      console.error("Error generando publicación:", e);
      setAiError(e.message || "Error generando publicación");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="admin-main">
      <h1>📢 Publicaciones</h1>
      <p>Textos generados por IA listos para publicar.</p>

      {/* ================= BOTÓN IA ================= */}
      <div style={{ marginBottom: 16 }}>
        <button
          className="btn-primary"
          onClick={handleGeneratePost}
          disabled={aiLoading}
        >
          {aiLoading ? "Generando..." : "🤖 Generar publicación con IA"}
        </button>

        {aiError && (
          <div style={{ marginTop: 10, color: "#b91c1c" }}>
            ❌ {aiError}
          </div>
        )}
      </div>

      {/* ================= LISTA ================= */}
      {loading ? (
        <p>Cargando...</p>
      ) : posts.length === 0 ? (
        <p>No hay publicaciones aún.</p>
      ) : (
        <div className="grid">
          {posts.map((p) => (
            <div key={p.id} className="card">
              <strong>{p.platform.toUpperCase()}</strong>

              <p style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>
                {p.content}
              </p>

              {p.marketing_images && (
                <div style={{ marginTop: 10 }}>
                  <img
                    src={p.marketing_images.image_url}
                    alt=""
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      maxHeight: 220,
                      objectFit: "cover",
                    }}
                  />
                  <small>{p.marketing_images.display_name}</small>
                </div>
              )}

              <div style={{ marginTop: 10 }}>
                <span className="badge">
                  {p.status === "draft" ? "Borrador" : "Publicado"}
                </span>
              </div>

              <button
                className="btn-secondary"
                onClick={() => toggleStatus(p.id, p.status)}
                style={{ marginTop: 10 }}
              >
                {p.status === "draft"
                  ? "Marcar como publicado"
                  : "Volver a borrador"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}