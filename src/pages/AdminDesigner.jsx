// src/pages/AdminDesigner.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "../Admin.css";

/**
 * Mini-Canva PRO (fase 1)
 * - Eliges imagen (de marketing_images)
 * - Eliges plantilla
 * - Genera un diseño (Canvas)
 * - Descargas PNG
 *
 * Nota: esta fase NO edita la foto original, crea un "arte" encima (overlay + texto).
 */

// Plantillas base (luego agregamos más + tamaños para story, post, banner, etc.)
const TEMPLATES = [
  {
    id: "ig_post_soft",
    name: "Instagram Post — Elegante (1:1)",
    size: { w: 1080, h: 1080 },
    overlay: { type: "gradient", opacity: 0.55 },
    titleStyle: { size: 64, weight: 800 },
    subtitleStyle: { size: 34, weight: 600 },
    badge: { show: true, text: "MC Beauty", size: 28 },
    safe: { pad: 90 },
  },
  {
    id: "ig_story_bold",
    name: "Instagram Story — Vertical (9:16)",
    size: { w: 1080, h: 1920 },
    overlay: { type: "dark", opacity: 0.45 },
    titleStyle: { size: 74, weight: 900 },
    subtitleStyle: { size: 38, weight: 600 },
    badge: { show: true, text: "Fragrance & Glow", size: 30 },
    safe: { pad: 110 },
  },
  {
    id: "wh_status_clean",
    name: "WhatsApp Status — Limpio (9:16)",
    size: { w: 1080, h: 1920 },
    overlay: { type: "gradient", opacity: 0.42 },
    titleStyle: { size: 70, weight: 900 },
    subtitleStyle: { size: 36, weight: 600 },
    badge: { show: false, text: "", size: 0 },
    safe: { pad: 120 },
  },
  {
    id: "banner_wide",
    name: "Banner Web — Horizontal (16:9)",
    size: { w: 1920, h: 1080 },
    overlay: { type: "dark", opacity: 0.35 },
    titleStyle: { size: 86, weight: 900 },
    subtitleStyle: { size: 44, weight: 700 },
    badge: { show: true, text: "MC Beauty", size: 30 },
    safe: { pad: 120 },
  },
];

function clampText(str = "", max = 90) {
  const s = String(str || "").trim();
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // importante para exportar sin “taint” si la URL lo permite
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen. Verifica que sea pública."));
    img.src = url;
  });
}

function containDraw(ctx, img, cw, ch) {
  const iw = img.width;
  const ih = img.height;

  const scale = Math.min(cw / iw, ch / ih);
  const nw = iw * scale;
  const nh = ih * scale;

  const x = (cw - nw) / 2;
  const y = (ch - nh) / 2;

  ctx.drawImage(img, x, y, nw, nh);
}

function applyOverlay(ctx, tpl, w, h) {
  const { overlay } = tpl;
  if (!overlay) return;

  if (overlay.type === "dark") {
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${overlay.opacity ?? 0.45})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return;
  }

  if (overlay.type === "gradient") {
    ctx.save();
    // Gradiente vertical (arriba suave → abajo más oscuro)
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(0,0,0,${(overlay.opacity ?? 0.5) * 0.35})`);
    g.addColorStop(0.55, `rgba(0,0,0,${(overlay.opacity ?? 0.5) * 0.55})`);
    g.addColorStop(1, `rgba(0,0,0,${overlay.opacity ?? 0.5})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

function drawTextBlock(ctx, tpl, w, h, { title, subtitle, cta }) {
  const pad = tpl.safe?.pad ?? 90;

  // Bloque inferior
  const blockW = w - pad * 2;
  const baseY = h - pad;

  // Title
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(255,255,255,0.98)";

  ctx.font = `${tpl.titleStyle.weight} ${tpl.titleStyle.size}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  const titleLine = clampText(title, 60);
  ctx.fillText(titleLine, pad, baseY);

  // Subtitle
  if (subtitle) {
    ctx.font = `${tpl.subtitleStyle.weight} ${tpl.subtitleStyle.size}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    const subLine = clampText(subtitle, 90);
    ctx.fillText(subLine, pad, baseY - (tpl.titleStyle.size + 16));
  }

  // CTA (mini chip)
  if (cta) {
    const ctaText = clampText(cta, 40).toUpperCase();
    ctx.font = `800 26px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    const metrics = ctx.measureText(ctaText);
    const chipW = metrics.width + 42;
    const chipH = 46;
    const chipX = pad;
    const chipY = baseY - (tpl.titleStyle.size + tpl.subtitleStyle.size + 44);

    // chip bg
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    drawRoundedRect(ctx, chipX, chipY - chipH, chipW, chipH, 14);
    ctx.fill();
    ctx.restore();

    // chip text
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.textBaseline = "middle";
    ctx.fillText(ctaText, chipX + 21, chipY - chipH / 2);
  }

  ctx.restore();

}

export default function AdminDesigner() {
  const canvasRef = useRef(null);

  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [imagesError, setImagesError] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);

  // Texto (puedes pegar lo generado por IA aquí)
  const [title, setTitle] = useState("NUEVA COLECCIÓN");
  const [subtitle, setSubtitle] = useState("Splash + Cremas • Elegantes y originales");
  const [cta, setCta] = useState("Pídelo por WhatsApp");

  const [templateType, setTemplateType] = useState("oferta"); // oferta | lanzamiento | regalo | temporada
  const [format, setFormat] = useState(TEMPLATES[0].id);               // ig_post_soft | ig_story_bold | wh_status_clean | banner_wide
  const [objective, setObjective] = useState("vender");       // vender | informar | fidelizar
  const [headline, setHeadline] = useState("OFERTA DE HOY");
  const [supportText, setSupportText] = useState("Envíos rápidos • Originales • Pago fácil");

  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);

  const tpl = useMemo(
    () => TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0],
    [templateId]
  );

  async function saveDesign() {
    try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // 1️⃣ Convertir canvas a blob
        const blob = await new Promise((res) =>
        canvas.toBlob(res, "image/png")
        );

        const fileName = `design-${Date.now()}.png`;
        const filePath = `designs/${fileName}`;

        // 2️⃣ Subir a storage
        const { error: uploadError } = await supabase.storage
        .from("designs")
        .upload(filePath, blob);

        if (uploadError) throw uploadError;

        // 3️⃣ Obtener URL pública
        const { data } = supabase.storage
        .from("designs")
        .getPublicUrl(filePath);

        const publicUrl = data.publicUrl;

        // 4️⃣ Guardar en BD
        const { error } = await supabase
        .from("marketing_designs")
        .insert({
            image_id: selectedImage?.id || null,
            template_id: tpl.id,
            title,
            subtitle,
            cta,

            template_type: templateType,
            format: tpl.id, // o format si quieres controlarlo aparte
            objective,
            headline,
            support_text: supportText,

            final_image_url: publicUrl,
        });

        if (error) throw error;

        alert("✅ Diseño guardado correctamente");
    } catch (e) {
        console.error(e);
        alert("❌ Error guardando diseño");
    }
    }

  async function loadMarketingImages() {
    try {
      setLoadingImages(true);
      setImagesError(null);

      // Solo imágenes activas (y si quieres: use_for_ai true)
      const { data, error } = await supabase
        .from("marketing_images")
        .select("id, display_name, title, tag, image_url, kind, active, use_for_ai, product_type")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImages(data || []);
      setSelectedImage((prev) => prev || (data?.[0] ?? null));
    } catch (e) {
      console.error(e);
      setImagesError(e.message || "Error cargando imágenes");
      setImages([]);
    } finally {
      setLoadingImages(false);
    }
  }

  // Render principal
  async function renderDesign() {
    try {
        setRendering(true);
        setRenderError(null);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const W = tpl.size.w;
        const H = tpl.size.h;

        canvas.width = W;
        canvas.height = H;

        // Fondo
        ctx.clearRect(0, 0, W, H);

        // Imagen principal
        if (selectedImage?.image_url) {
        const img = await loadImage(selectedImage.image_url);
        containDraw(ctx, img, W, H);
        } else {
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, W, H);
        }

        // Overlay
        applyOverlay(ctx, tpl, W, H);

        // Texto principal
        drawTextBlock(ctx, tpl, W, H, { title, subtitle, cta });

        /* ======================================================
        1) LOGO — arriba a la izquierda
        ====================================================== */
        try {
        const logo = await loadImage("/logo.png");

        const logoSize = 110; // tamaño del logo
        const pad = tpl.safe?.pad ?? 90;

        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.drawImage(logo, pad, pad, logoSize, logoSize);
        ctx.restore();
        } catch {
        // si falla el logo no rompemos el diseño
        }


      /* ======================================================
        2) LINK — estilo badge elegante (abajo derecha)
        ====================================================== */
        const website = "www.mcbeautyfragrance.com";
        const pad = tpl.safe?.pad ?? 90;

        ctx.save();

        // =====================
        // 1) TEXTO
        // =====================
        ctx.font = "800 30px system-ui, -apple-system, Segoe UI, Roboto, Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";

        const metrics = ctx.measureText(website);

        // =====================
        // 2) TAMAÑO DEL BADGE
        // =====================
        const badgePaddingX = 28;
        const badgePaddingY = 16;

        let badgeW = metrics.width + badgePaddingX * 2;
        const badgeH = 52;

        // 🔒 límite para que nunca se salga del canvas
        const maxBadgeW = W - pad * 2;
        badgeW = Math.min(badgeW, maxBadgeW);

        // =====================
        // 3) POSICIÓN
        // =====================
        // lo subimos un poco para que NO tape el producto
        const bx = W - pad - badgeW;
        const by = H - pad - badgeH - 24;

        // =====================
        // 4) FONDO DEL BADGE
        // =====================
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        drawRoundedRect(ctx, bx, by, badgeW, badgeH, 18);
        ctx.fill();

        // =====================
        // 5) TEXTO DEL LINK
        // =====================
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(255,255,255,0.95)";

        // si el texto es más largo que el badge, lo cortamos visualmente
        let displayText = website;
        while (ctx.measureText(displayText).width > badgeW - badgePaddingX * 2) {
        displayText = displayText.slice(0, -1);
        if (displayText.length < 6) break;
        }
        if (displayText !== website) displayText += "…";

        ctx.fillText(displayText, bx + badgePaddingX, by + badgeH / 2);

        ctx.restore();  


    } catch (e) {
        console.error(e);
        setRenderError(e.message || "No se pudo renderizar el diseño");
    } finally {
        setRendering(false);
    }
    }

  function downloadPNG() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `mc-design-${tpl.id}-${Date.now()}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }


  useEffect(() => {
    loadMarketingImages();
  }, []);

  // Render automático cuando cambian cosas importantes
  useEffect(() => {
    renderDesign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage?.id, templateId]);

  return (
    <div className="admin-main">
      <header className="admin-main-header">
        <div className="admin-main-title-block">
          <h1>🎨 Mini-Canva — Diseñador</h1>
          <p>
            Elige una imagen + plantilla y genera artes listos para redes (PNG).
          </p>
        </div>
      </header>

      <section className="admin-card" style={{ marginTop: 16 }}>
        <div className="admin-card-header">
          <h2>1) Imagen</h2>
          <span>{loadingImages ? "Cargando..." : `${images.length} activas`}</span>
        </div>

        {imagesError && (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#fee2e2", color: "#991b1b" }}>
            ❌ {imagesError}
          </div>
        )}

        {loadingImages ? (
          <p>Cargando imágenes…</p>
        ) : images.length === 0 ? (
          <p>No hay imágenes activas. Ve a “Recursos de Marketing” y sube algunas.</p>
        ) : (
          <div className="grid">
            {images.map((img) => (
              <div
                key={img.id}
                className={`card selectable ${selectedImage?.id === img.id ? "active" : ""}`}
                onClick={() => setSelectedImage(img)}
              >
                <div className="gallery-img-box">
                  <img src={img.image_url} alt={img.display_name || img.title || ""} />
                </div>
                <strong>{img.display_name || img.title}</strong>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {img.kind ? `Tipo: ${img.kind}` : ""} {img.product_type ? `• ${img.product_type}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-card" style={{ marginTop: 16 }}>
        <div className="admin-card-header">
          <h2>2) Plantilla</h2>
          <span>{tpl.size.w}×{tpl.size.h}</span>
        </div>

        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
        >
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn-secondary" onClick={renderDesign} disabled={rendering}>
            {rendering ? "Renderizando…" : "🔄 Actualizar vista"}
          </button>

          <button className="btn-primary" onClick={downloadPNG} disabled={rendering}>
            ⬇️ Descargar PNG
          </button>

          <button className="btn-secondary" onClick={saveDesign}>
            💾 Guardar diseño
         </button>
        </div>

        {renderError && (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#fee2e2", color: "#991b1b" }}>
            ❌ {renderError}
          </div>
        )}
      </section>

      <section className="admin-card" style={{ marginTop: 16 }}>
        <div className="admin-card-header">
          <h2>3) Texto (encima del diseño)</h2>
          <span>puedes pegar lo generado por IA</span>
        </div>

        <div className="admin-product-form">
          <div className="admin-form-group">
            <label>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: OFERTA ESPECIAL" />
          </div>

          <div className="admin-form-group">
            <label>Subtítulo</label>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Ej: Splash + Crema • RD$995" />
          </div>

          <div className="admin-form-group">
            <label>CTA (llamado a la acción)</label>
            <input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Ej: Escríbenos por WhatsApp" />
          </div>

          <div className="admin-form-group">
            <label>Tipo de plantilla</label>
            <select value={templateType} onChange={(e) => setTemplateType(e.target.value)}>
                <option value="oferta">Oferta</option>
                <option value="lanzamiento">Lanzamiento</option>
                <option value="regalo">Regalo</option>
                <option value="temporada">Temporada</option>
            </select>
           </div>

           <div className="admin-form-group">
            <label>Objetivo</label>
            <select value={objective} onChange={(e) => setObjective(e.target.value)}>
                <option value="vender">Vender</option>
                <option value="informar">Informar</option>
                <option value="fidelizar">Fidelizar</option>
            </select>
           </div>

           <div className="admin-form-group">
            <label>Headline (gancho)</label>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} />
           </div>

          <div className="admin-form-group">
            <label>Support text (prueba/beneficio corto)</label>
            <input value={supportText} onChange={(e) => setSupportText(e.target.value)} />
          </div>

          <button className="btn-secondary" onClick={renderDesign} disabled={rendering}>
            {rendering ? "Aplicando…" : "✨ Aplicar texto al diseño"}
          </button>
        </div>
      </section>

      <section className="admin-card" style={{ marginTop: 16 }}>
        <div className="admin-card-header">
          <h2>Vista previa</h2>
          <span>{selectedImage?.display_name || selectedImage?.title || "Sin imagen"}</span>
        </div>

        <div className="designer-preview-wrap">
          <canvas ref={canvasRef} className="designer-canvas" />
        </div>

        <p style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
          ✅ “mini-Canva”: imagen + overlay + textos + plantilla → descargable en PNG.
        </p>
      </section>
    </div>
  );
}