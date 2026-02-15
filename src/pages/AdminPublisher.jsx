// src/pages/AdminPublisher.jsx
import { useEffect, useMemo, useState } from "react";
import "../Admin.css";
import "./AdminPublisher.css";
import {
  uploadMediaFiles,
  createPublisherPost,
  loadPublisherPosts,
  deletePublisherPost,
} from "../services/publisherService";

const PLATFORMS = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "whatsapp", label: "WhatsApp" },
];

export default function AdminPublisher() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [posts, setPosts] = useState([]);

  const [postType, setPostType] = useState("image"); // image | carousel | video
  const [caption, setCaption] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    facebook: true,
    instagram: true,
    tiktok: false,
    whatsapp: false,
  });

  const [scheduledAt, setScheduledAt] = useState(""); // datetime-local string
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [filter, setFilter] = useState("all"); // all | pending | published | failed

  async function refresh() {
    setLoading(true);
    try {
      const rows = await loadPublisherPosts({ limit: 60, status: filter === "all" ? null : filter });
      setPosts(rows);
    } catch (e) {
      console.error(e);
      alert("Error cargando publicaciones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [filter]);

  const activePlatformList = useMemo(() => {
    return Object.entries(selectedPlatforms)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }, [selectedPlatforms]);

  function resetForm() {
    setCaption("");
    setScheduledAt("");
    setFiles([]);
    setPostType("image");
    setSelectedPlatforms({ facebook: true, instagram: true, tiktok: false, whatsapp: false });
  }

  function acceptFilesForType(list) {
    const arr = Array.from(list || []);
    if (!arr.length) return;

    if (postType === "video") {
      const v = arr.find((f) => (f.type || "").startsWith("video/"));
      if (!v) {
        alert("Para VIDEO, sube un archivo de video (mp4 recomendado).");
        return;
      }
      setFiles([v]);
      return;
    }

    if (postType === "image") {
      const img = arr.find((f) => (f.type || "").startsWith("image/"));
      if (!img) {
        alert("Para IMAGEN, sube un archivo de imagen.");
        return;
      }
      setFiles([img]);
      return;
    }

    // carousel
    const media = arr.filter((f) => (f.type || "").startsWith("image/") || (f.type || "").startsWith("video/"));
    if (media.length < 2) {
      alert("Para CARRUSEL sube mínimo 2 archivos (imágenes o videos).");
      return;
    }
    if (media.length > 10) {
      alert("Carrusel: máximo 10 archivos.");
      return;
    }
    setFiles(media);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!activePlatformList.length) return alert("Selecciona al menos una plataforma.");
    if (!files.length) return alert("Sube el archivo (o archivos) del post.");
    if (postType === "video") {
      const f = files[0];
      if (!(f.type || "").startsWith("video/")) return alert("El tipo VIDEO requiere un archivo de video.");
    }
    if (postType === "image") {
      const f = files[0];
      if (!(f.type || "").startsWith("image/")) return alert("El tipo IMAGEN requiere un archivo de imagen.");
    }
    if (postType === "carousel" && files.length < 2) return alert("Carrusel requiere mínimo 2 archivos.");

    // scheduledAt: si vacío => FIFO
    const scheduled_at = scheduledAt ? new Date(scheduledAt).toISOString() : null;
    const auto_queue = !scheduled_at; // FIFO si no hay fecha

    try {
      setSaving(true);

      // 1) subir medios (una vez)
      const mediaRows = await uploadMediaFiles(files);

      // 2) crear 1 post por plataforma seleccionada
      for (const platform of activePlatformList) {
        await createPublisherPost({
          platform,
          post_type: postType,
          caption: caption || "",
          scheduled_at,
          auto_queue,
          mediaRows,
        });
      }

      resetForm();
      await refresh();
      alert("✅ Publicación(s) guardada(s) y lista(s) para publicar automáticamente.");
    } catch (e2) {
      console.error(e2);
      alert(e2?.message || "Error guardando publicación.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!confirm("¿Eliminar esta publicación?")) return;
    try {
      await deletePublisherPost(p.id);
      await refresh();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar.");
    }
  }

  return (
    <div className="admin-main publisher-page">
      <header className="publisher-header">
        <div>
          <h1>📆 Publicador Automático</h1>
          <p className="publisher-sub">
            Sube el contenido ya listo (video con música incluida), escribe el caption y el sistema publica solo.
          </p>
        </div>

        <div className="publisher-filter">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="published">Publicados</option>
            <option value="failed">Fallidos</option>
          </select>
        </div>
      </header>

      {/* FORM */}
      <section className="admin-card publisher-card">
        <div className="publisher-card-head">
          <h2>Nueva publicación</h2>
          <span className="muted">Modo: {scheduledAt ? "📅 Programada" : "🤖 FIFO automática"}</span>
        </div>

        <form onSubmit={handleSubmit} className="publisher-form">
          <div className="publisher-grid">
            <div className="publisher-field">
              <label>Tipo</label>
              <div className="publisher-type-row">
                <button
                  type="button"
                  className={`chip ${postType === "image" ? "active" : ""}`}
                  onClick={() => { setPostType("image"); setFiles([]); }}
                >
                  Imagen
                </button>
                <button
                  type="button"
                  className={`chip ${postType === "carousel" ? "active" : ""}`}
                  onClick={() => { setPostType("carousel"); setFiles([]); }}
                >
                  Carrusel
                </button>
                <button
                  type="button"
                  className={`chip ${postType === "video" ? "active" : ""}`}
                  onClick={() => { setPostType("video"); setFiles([]); }}
                >
                  Video
                </button>
              </div>
              <p className="hint">
                TikTok recomendado: <strong>video vertical 9:16</strong> y con música ya dentro.
              </p>
            </div>

            <div className="publisher-field">
              <label>Programar fecha y hora (opcional)</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <p className="hint">
                Si lo dejas vacío, entra a cola FIFO y se publica en horarios automáticos.
              </p>
            </div>

            <div className="publisher-field publisher-platforms">
              <label>Plataformas</label>
              <div className="platform-grid">
                {PLATFORMS.map((p) => (
                  <label key={p.id} className="platform-item">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedPlatforms[p.id])}
                      onChange={(e) =>
                        setSelectedPlatforms((prev) => ({ ...prev, [p.id]: e.target.checked }))
                      }
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="publisher-field publisher-caption">
              <label>Caption (texto abajo + hashtags)</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Escribe el texto completo aquí..."
                rows={7}
              />
            </div>

            <div className="publisher-field publisher-upload">
              <label>Archivo(s)</label>

              <div
                className={`upload-zone ${dragOver ? "drag-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  acceptFilesForType(e.dataTransfer.files);
                }}
              >
                <div className="upload-zone-inner">
                  <div className="upload-title">📤 Arrastra aquí o selecciona</div>
                  <div className="upload-actions">
                    <label className="btn-secondary">
                      Seleccionar
                      <input
                        type="file"
                        style={{ display: "none" }}
                        multiple={postType === "carousel"}
                        accept={postType === "video" ? "video/*" : "image/*,video/*"}
                        onChange={(e) => acceptFilesForType(e.target.files)}
                      />
                    </label>
                    <button type="button" className="btn-secondary" onClick={() => setFiles([])}>
                      Limpiar
                    </button>
                  </div>

                  {files.length > 0 && (
                    <div className="file-list">
                      {files.map((f, idx) => (
                        <div key={idx} className="file-pill">
                          <span className="file-name">{f.name}</span>
                          <span className="file-meta">{(f.type || "file").toLowerCase()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {files.length > 0 && (
                <div className="preview-row">
                  {files.slice(0, 3).map((f, idx) => {
                    const url = URL.createObjectURL(f);
                    const isVid = (f.type || "").startsWith("video/");
                    return (
                      <div key={idx} className="preview-card">
                        {isVid ? (
                          <video src={url} controls muted style={{ width: "100%", borderRadius: 10 }} />
                        ) : (
                          <img src={url} alt="preview" style={{ width: "100%", borderRadius: 10 }} />
                        )}
                      </div>
                    );
                  })}
                  {files.length > 3 && (
                    <div className="preview-more">+{files.length - 3} más</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="publisher-footer">
            <button className="btn-primary" disabled={saving}>
              {saving ? "Guardando..." : "✅ Guardar para publicación automática"}
            </button>
          </div>
        </form>
      </section>

      {/* LIST */}
      <section className="admin-card publisher-card">
        <div className="publisher-card-head">
          <h2>Historial</h2>
          <span className="muted">{loading ? "Cargando..." : `${posts.length} registros`}</span>
        </div>

        {loading ? (
          <p>Cargando...</p>
        ) : posts.length === 0 ? (
          <p>No hay publicaciones aún.</p>
        ) : (
          <div className="publisher-list">
            {posts.map((p) => (
              <div key={p.id} className={`publisher-item ${p.status}`}>
                <div className="publisher-item-top">
                  <div className="publisher-badges">
                    <span className="badge">{p.platform}</span>
                    <span className="badge gray">{p.post_type}</span>
                    <span className={`badge ${p.status === "published" ? "green" : p.status === "failed" ? "red" : "yellow"}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="publisher-actions">
                    <button className="btn-danger" onClick={() => handleDelete(p)}>
                      🗑
                    </button>
                  </div>
                </div>

                <div className="publisher-caption-view">
                  {p.caption ? p.caption : <span className="muted">Sin caption</span>}
                </div>

                <div className="publisher-meta">
                  <span>🕒 {p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : "FIFO"}</span>
                  <span>📎 {p.media?.length || 0} media</span>
                </div>

                {p.media?.length ? (
                  <div className="publisher-media-row">
                    {p.media.slice(0, 4).map((m) => (
                      <a key={m.id} href={m.file_url} target="_blank" rel="noreferrer" className="media-thumb">
                        {m.media_type === "video" ? (
                          <div className="thumb-video">🎥</div>
                        ) : (
                          <img src={m.file_url} alt="" />
                        )}
                      </a>
                    ))}
                  </div>
                ) : null}

                {p.status === "failed" && p.error_log ? (
                  <div className="publisher-error">
                    <strong>Error:</strong> {p.error_log}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}