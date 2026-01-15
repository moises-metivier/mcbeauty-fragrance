//src/pages/AdminMarketingImages.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "../Admin.css";

export default function AdminMarketingImages() {
  const [images, setImages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState({
    title: "",
    display_name: "",
    image_url: "",
    kind: "producto",        // producto | regalo | banner
    product_type: "",       // splash | crema | perfume | combo
    product_id: "",
    use_for_ai: true,
    active: true,
  });

  // ==============================
  // 🔄 CARGAR IMÁGENES
  // ==============================
  async function loadImages() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("marketing_images")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (e) {
      console.error(e);
      alert("Error cargando imágenes");
    } finally {
      setLoading(false);
    }
  }


    async function toggleActive(id, current) {
        const { error } = await supabase
            .from("marketing_images")
            .update({ active: !current })
            .eq("id", id);

        if (error) {
            console.error(error);
            alert("Error cambiando estado");
            return;
        }

        await loadImages();
   }


   
   async function deleteImage(img) {
        if (!confirm("¿Seguro que quieres borrar esta imagen?")) return;

        try {
            // 1️⃣ borrar archivo en storage
            const fileName = img.image_url.split("/").pop();
            await supabase.storage
            .from("marketing")
            .remove([`marketing/${fileName}`]);

            // 2️⃣ borrar registro en tabla
            await supabase
            .from("marketing_images")
            .delete()
            .eq("id", img.id);

            await loadImages();
        } catch (e) {
            console.error(e);
            alert("Error borrando imagen");
        }
    }

  // ==============================
  // 🔄 CARGAR PRODUCTOS
  // ==============================
  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("id, name")
      .order("name");
    setProducts(data || []);
  }

  useEffect(() => {
    loadImages();
    loadProducts();
  }, []);

  // ==============================
  // ✍️ MANEJO FORM
  // ==============================
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    }

    function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    }

    function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
    }

    function handleDragLeave() {
    setDragOver(false);
    }

    // ==============================
    // 💾 GUARDAR
    // ==============================
    async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title || !form.display_name || !selectedFile) {
        alert("Completa todos los campos y selecciona una imagen");
        return;
    }

    try {
        setLoading(true);

        // 1️⃣ Subir imagen a Supabase Storage
        const ext = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}.${ext}`;
        const filePath = `marketing/${fileName}`;

        const { error: uploadError } = await supabase.storage
        .from("marketing")
        .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        // 2️⃣ Obtener URL pública
        const { data: publicData } = supabase.storage
        .from("marketing")
        .getPublicUrl(filePath);

        const imageUrl = publicData.publicUrl;

        // 3️⃣ Guardar en tabla (AJUSTADO A TU TABLA REAL)
        const { error } = await supabase.from("marketing_images").insert({
        title: form.title,
        display_name: form.display_name || form.title,

        // 👉 aquí guardamos el "tipo de producto"
        tag: form.product_type || null,

        image_url: imageUrl,
        kind: form.kind || "producto",
        use_for_ai: Boolean(form.use_for_ai),
        active: Boolean(form.active),
        });

        if (error) throw error;

        // 4️⃣ Reset
        setForm({
        title: "",
        display_name: "",
        kind: "producto",
        product_type: "",   // se guarda en "tag"
        use_for_ai: true,
        active: true,
        });

        setSelectedFile(null);
        await loadImages();

    } catch (e) {
        console.error("ERROR COMPLETO:", e);
        alert(e?.message || "Error subiendo imagen");
    } finally {
        setLoading(false);
    }
    }

  // ==============================
  // 🔁 TOGGLE ACTIVO
  // ==============================
  async function toggleActive(id, current) {
    await supabase
      .from("marketing_images")
      .update({ active: !current })
      .eq("id", id);
    loadImages();
  }

  return (
    <div className="admin-main">
      <h1>🖼️ Imágenes para Marketing & IA</h1>

      {/* ================= FORM ================= */}
        <section className="admin-card">
        <h2>Nueva imagen</h2>

        <form onSubmit={handleSubmit} className="admin-product-form">
            <input
            name="title"
            placeholder="Título interno (ej: san_valentin_combo)"
            value={form.title}
            onChange={handleChange}
            />

            <input
            name="display_name"
            placeholder="Nombre visible para IA (ej: Combo romántico San Valentín)"
            value={form.display_name}
            onChange={handleChange}
            />

            {/* ================= SUBIDA DE IMAGEN ================= */}
            <label>Imagen</label>

            <div
            className={`upload-zone ${dragOver ? "drag-over" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            >
            <p>📤 Arrastra la imagen aquí o</p>

            <label className="btn-secondary">
                Seleccionar archivo
                <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
                />
            </label>

            {previewUrl && (
                <div style={{ marginTop: 12 }}>
                <p><strong>Vista previa:</strong></p>
                <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                    maxWidth: 200,
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    }}
                />
                </div>
            )}
            </div>

            {/* ================= TIPO ================= */}
            <label>Tipo de imagen</label>
            <select name="kind" value={form.kind} onChange={handleChange}>
            <option value="producto">Producto</option>
            <option value="regalo">Regalo</option>
            <option value="banner">Banner</option>
            </select>

            {/* ================= TIPO PRODUCTO (editable + sugerencias) ================= */}
            <label>Tipo de producto</label>
            <input
            name="product_type"
            list="product-type-suggestions"
            placeholder="Ej: splash, crema, ropa, vela..."
            value={form.product_type || ""}
            onChange={handleChange}
            />

            <datalist id="product-type-suggestions">
            <option value="Splash" />
            <option value="Crema" />
            <option value="Perfume" />
            <option value="Combo" />
            <option value="Ropa" />
            <option value="Velas" />
            <option value="Maquillaje" />
            <option value="Accesorios" />
            </datalist>

            {/* ================= PRODUCTO ================= */}
            <label>Producto relacionado (opcional)</label>
            <select
            name="product_id"
            value={form.product_id}
            onChange={handleChange}
            >
            <option value="">— Ninguno —</option>
            {products.map((p) => (
                <option key={p.id} value={p.id}>
                {p.name}
                </option>
            ))}
            </select>

            {/* ================= SWITCHES ================= */}
            <label>
            <input
                type="checkbox"
                name="use_for_ai"
                checked={form.use_for_ai}
                onChange={handleChange}
            />
            Usar en IA
            </label>

            <label>
            <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
            />
            Activa
            </label>

            <button className="btn-primary" disabled={loading}>
            Guardar imagen
            </button>
        </form>
        </section>

      {/* ================= GALERÍA ================= */}
      <section className="admin-card">
        <h2>Galería</h2>

        {loading ? (
          <p>Cargando...</p>
        ) : (
            <div className="grid">
                {images.map((img) => (
                    <div key={img.id} className="card">
                        <div className="gallery-img-box">
                            <img src={img.image_url} alt={img.title} />
                            </div>

                            <strong>{img.display_name || img.title}</strong>
                            <div>Tipo: {img.kind}</div>
                            {img.product_type && <div>Producto: {img.product_type}</div>}
                            {img.use_for_ai && <div>🤖 Usada por IA</div>}

                            <div className="actions">
                            <button
                                onClick={() => toggleActive(img.id, img.active)}
                                className="btn-secondary"
                            >
                                {img.active ? "Desactivar" : "Activar"}
                            </button>

                            <button
                                onClick={() => deleteImage(img)}
                                className="btn-danger"
                            >
                                🗑 Eliminar
                            </button>
                        </div>
                    </div>
                ))}
          </div>
        )}
      </section>
    </div>
  );
}