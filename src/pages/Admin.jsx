// src/pages/Admin.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../admin.css";
import { useNavigate } from "react-router-dom";
import { subscribeToPresence } from "../services/presenceService";
import { supabase } from "../lib/supabaseClient";
import {
  loadProducts,
  createProduct,
  updateProduct,
  deleteProductById,
} from "../services/productService";

import {
  trackPageView,
  getTotalVisits,
  getTodayVisits,
} from "../services/analyticsService";

/* -------------------- HELPERS -------------------- */
function normalizeAudience(value) {
  const v = String(value || "").toLowerCase().trim();
  if (v === "niño" || v === "nino" || v === "niños" || v === "ninos") return "nino";
  if (v === "mujer" || v === "women") return "mujer";
  if (v === "hombre" || v === "men") return "hombre";
  if (v === "unisex") return "unisex";
  if (v === "otros" || v === "otro") return "otros";
  return v || "mujer";
}

function moneyRD(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "RD$0.00";
  return `RD$${n.toFixed(2)}`;
}

function safeInt(v, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

/* -------------------- COMPONENT -------------------- */
export default function Admin() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [editingProductId, setEditingProductId] = useState(null);

  // ✅ Form alineado a DB profesional
  const [form, setForm] = useState({
    name: "",
    brand: "Bath & Body Works",
    category: "frutal",     // aroma
    type: "crema",          // tipo (columna type)
    audience: "mujer",      // mujer/hombre/unisex/nino/otros
    price: "",
    stock: 1,               // int (0 = agotado)
    active: true,           // bool
    image_url: "",
    sold_count: 0,          // int
    show_sold_count: false, // bool
  });

  // filtros
  const [filterCategory, setFilterCategory] = useState("todas");
  const [filterAudience, setFilterAudience] = useState("todos");
  const [filterStock, setFilterStock] = useState("todos"); // disponibles/agotados/todos
  const [filterActive, setFilterActive] = useState("todos"); // activos/inactivos/todos

  const [imageFileName, setImageFileName] = useState("");

  // presencia (online users)
  const [onlineUsers, setOnlineUsers] = useState(0);

  // visitas
  const [totalVisits, setTotalVisits] = useState(0);
  const [todayVisits, setTodayVisits] = useState(0);

  /* -------------------- PRESENCIA -------------------- */
  useEffect(() => {
    const unsubscribe = subscribeToPresence((count) => setOnlineUsers(count));
    return () => unsubscribe?.();
  }, []);

  /* -------------------- VISITAS -------------------- */
  useEffect(() => {
    (async () => {
      try {
        await trackPageView("/admin");
      } catch {}
      try {
        const [t, d] = await Promise.all([getTotalVisits(), getTodayVisits()]);
        setTotalVisits(t);
        setTodayVisits(d);
      } catch {}
    })();
  }, []);

  /* -------------------- CARGAR PRODUCTOS -------------------- */
  async function refreshProducts() {
    setLoadingProducts(true);
    try {
      const data = await loadProducts();

      // Normaliza por si algo viene null
      const normalized = (Array.isArray(data) ? data : []).map((p) => ({
        id: p.id,
        name: p.name ?? "",
        brand: p.brand ?? "Bath & Body Works",
        category: p.category ?? "frutal",
        type: p.type ?? "otros",
        audience: normalizeAudience(p.audience ?? "mujer"),
        price: Number(p.price ?? 0),
        stock: safeInt(p.stock ?? 0),
        active: Boolean(p.active),
        image_url: p.image_url ?? "",
        created_at: p.created_at ?? null,

        sold_count: safeInt(p.sold_count ?? 0),
        show_sold_count: Boolean(p.show_sold_count),
      }));

      setProducts(normalized);
    } catch (e) {
      console.error("Error cargando productos:", e);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    refreshProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------- REALTIME (productos) -------------------- */
  useEffect(() => {
    const channel = supabase
      .channel("products-realtime-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          // refresco simple
          refreshProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------- KPIs -------------------- */
  const stats = useMemo(() => {
    const total = products.length;
    const disponibles = products.filter((p) => p.stock > 0).length;
    const agotados = products.filter((p) => p.stock <= 0).length;
    const activos = products.filter((p) => p.active).length;
    const inactivos = total - activos;
    const categoriasUnicas = new Set(products.map((p) => p.category)).size;

    return { total, disponibles, agotados, activos, inactivos, categoriasUnicas };
  }, [products]);

  /* -------------------- FILTRO LISTA -------------------- */
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filterCategory !== "todas" && p.category !== filterCategory) return false;

      if (filterAudience !== "todos" && p.audience !== filterAudience) return false;

      if (filterStock !== "todos") {
        if (filterStock === "disponible" && p.stock <= 0) return false;
        if (filterStock === "agotado" && p.stock > 0) return false;
      }

      if (filterActive !== "todos") {
        if (filterActive === "activos" && !p.active) return false;
        if (filterActive === "inactivos" && p.active) return false;
      }

      return true;
    });
  }, [products, filterCategory, filterAudience, filterStock, filterActive]);

  /* -------------------- FORM -------------------- */
  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function startEdit(product) {
    setEditingProductId(product.id);

    setForm({
      name: product.name,
      brand: product.brand,
      category: product.category,
      type: product.type,
      audience: product.audience,
      price: String(product.price ?? ""),
      stock: safeInt(product.stock ?? 0),
      active: Boolean(product.active),
      image_url: product.image_url || "",
      sold_count: safeInt(product.sold_count ?? 0),
      show_sold_count: Boolean(product.show_sold_count),
    });

    setImageFileName("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingProductId(null);
    setForm({
      name: "",
      brand: "Bath & Body Works",
      category: "frutal",
      type: "crema",
      audience: "mujer",
      price: "",
      stock: 1,
      active: true,
      image_url: "",
      sold_count: 0,
      show_sold_count: false,
    });
    setImageFileName("");
  }

  /* -------------------- SUBIR IMAGEN LOCAL -------------------- */
  function handleImageFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({ ...prev, image_url: reader.result }));
        setImageFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  }

  /* -------------------- CRUD -------------------- */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!String(form.name || "").trim()) return alert("Ponle un nombre al producto");
    if (!form.price || isNaN(Number(form.price))) return alert("Precio inválido");

    const payload = {
      name: String(form.name).trim(),
      brand: String(form.brand || "").trim(),
      category: String(form.category || "frutal").trim(),
      type: String(form.type || "otros").trim(),
      audience: normalizeAudience(form.audience),
      price: Number(form.price),
      stock: safeInt(form.stock, 0),
      active: Boolean(form.active),
      image_url: (form.image_url || "").trim() || null,
      sold_count: safeInt(form.sold_count, 0),
      show_sold_count: Boolean(form.show_sold_count),
    };

    try {
      if (editingProductId) {
        await updateProduct(editingProductId, payload);
      } else {
        await createProduct(payload);
      }

      await refreshProducts();
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert("Error guardando producto (revisa permisos/RLS y columnas)");
    }
  }

  async function toggleActive(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;

    try {
      await updateProduct(id, { active: !p.active });
      await refreshProducts();
    } catch (err) {
      console.error(err);
      alert("Error cambiando activo");
    }
  }

  async function toggleStockQuick(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;

    // si está agotado, lo ponemos 1. si está >0, lo ponemos 0
    const nextStock = p.stock > 0 ? 0 : 1;

    try {
      await updateProduct(id, { stock: nextStock });
      await refreshProducts();
    } catch (err) {
      console.error(err);
      alert("Error cambiando stock");
    }
  }

  async function toggleShowSold(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;

    try {
      await updateProduct(id, { show_sold_count: !p.show_sold_count });
      await refreshProducts();
    } catch (err) {
      console.error(err);
      alert("Error cambiando mostrar vendidos");
    }
  }

  async function deleteProduct(id) {
    const prod = products.find((p) => p.id === id);
    const nombre = prod?.name || "este producto";
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;

    try {
      await deleteProductById(id);
      await refreshProducts();
    } catch (err) {
      console.error(err);
      alert("Error eliminando producto");
    }
  }

  /* -------------------- UI -------------------- */
  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-logo-circle">MC</div>
          <div className="admin-logo-text">
            <span>MC Beauty</span>
            <span>Fragrance & Glow</span>
          </div>
        </div>

        <div className="admin-sidebar-nav">
          <div className="admin-nav-section-title">Panel</div>

          <button className="admin-nav-link primary">
            <span>📊 Dashboard</span>
          </button>

          <button className="admin-nav-link secondary">
            <span>🧴 Productos</span>
          </button>

          <button
            className="admin-nav-link secondary"
            onClick={() => window.location.href = "/admin/orders"}
>
            <span>📦 Órdenes</span>
          </button>

          <button
            className="admin-nav-link secondary"
            onClick={() => navigate("/admin/payment-methods")}
          >
            <span>💳 Métodos de pago</span>
          </button>

          <button className="admin-nav-link secondary">
            <span>🤖 Publicaciones IA</span>
          </button>

          <button className="admin-nav-link secondary">
            <span>⚙️ Configuración</span>
          </button>
        </div>

        <div className="admin-sidebar-footer">
          <div>Sesión: <strong>Administrador</strong></div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
            👥 Online: <strong>{onlineUsers}</strong>
          </div>
          <div style={{ marginTop: 4, fontSize: 12, opacity: 0.9 }}>
            👀 Visitas: <strong>{totalVisits}</strong> (hoy: <strong>{todayVisits}</strong>)
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="admin-main">
        {/* Encabezado */}
        <header className="admin-main-header">
          <div className="admin-main-title-block">
            <h1>Panel de control</h1>
            <p>Administra tu catálogo, stock, activo y “vendidos”. Publicaciones IA viene después.</p>
          </div>
        </header>

        {/* STATS */}
        <section className="admin-stats-grid">
          <div className="stat-card">
            <div className="stat-label">Productos total</div>
            <div className="stat-value">{stats.total}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Disponibles</div>
            <div className="stat-value">{stats.disponibles}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Agotados</div>
            <div className="stat-value">{stats.agotados}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Activos</div>
            <div className="stat-value">{stats.activos}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Inactivos</div>
            <div className="stat-value">{stats.inactivos}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Aromas</div>
            <div className="stat-value">{stats.categoriasUnicas}</div>
          </div>
        </section>

        {/* CONTENIDO */}
        <section className="admin-content-grid">
          {/* LISTA IZQUIERDA */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Productos</h2>
              <span>{loadingProducts ? "Cargando..." : `${filteredProducts.length} resultados`}</span>
            </div>

            {/* FILTROS */}
            <div className="admin-products-filters">
              {/* AROMA */}
              <button
                className={"admin-pill-filter " + (filterCategory === "todas" ? "active" : "")}
                onClick={() => setFilterCategory("todas")}
              >
                Aroma: Todas
              </button>
              <button
                className={"admin-pill-filter " + (filterCategory === "frutal" ? "active" : "")}
                onClick={() => setFilterCategory("frutal")}
              >
                Frutal
              </button>
              <button
                className={"admin-pill-filter " + (filterCategory === "floral" ? "active" : "")}
                onClick={() => setFilterCategory("floral")}
              >
                Floral
              </button>
              <button
                className={"admin-pill-filter " + (filterCategory === "amaderado" ? "active" : "")}
                onClick={() => setFilterCategory("amaderado")}
              >
                Amaderado
              </button>

              {/* PÚBLICO */}
              <button
                className={"admin-pill-filter " + (filterAudience === "todos" ? "active" : "")}
                onClick={() => setFilterAudience("todos")}
              >
                Público: Todos
              </button>
              <button
                className={"admin-pill-filter " + (filterAudience === "mujer" ? "active" : "")}
                onClick={() => setFilterAudience("mujer")}
              >
                Mujer
              </button>
              <button
                className={"admin-pill-filter " + (filterAudience === "hombre" ? "active" : "")}
                onClick={() => setFilterAudience("hombre")}
              >
                Hombre
              </button>
              <button
                className={"admin-pill-filter " + (filterAudience === "unisex" ? "active" : "")}
                onClick={() => setFilterAudience("unisex")}
              >
                Unisex
              </button>
              <button
                className={"admin-pill-filter " + (filterAudience === "nino" ? "active" : "")}
                onClick={() => setFilterAudience("nino")}
              >
                Niños
              </button>
              <button
                className={"admin-pill-filter " + (filterAudience === "otros" ? "active" : "")}
                onClick={() => setFilterAudience("otros")}
              >
                Otros
              </button>

              {/* STOCK */}
              <button
                className={"admin-pill-filter " + (filterStock === "todos" ? "active" : "")}
                onClick={() => setFilterStock("todos")}
              >
                Stock: Todos
              </button>
              <button
                className={"admin-pill-filter " + (filterStock === "disponible" ? "active" : "")}
                onClick={() => setFilterStock("disponible")}
              >
                Disponibles
              </button>
              <button
                className={"admin-pill-filter " + (filterStock === "agotado" ? "active" : "")}
                onClick={() => setFilterStock("agotado")}
              >
                Agotados
              </button>

              {/* ACTIVO */}
              <button
                className={"admin-pill-filter " + (filterActive === "todos" ? "active" : "")}
                onClick={() => setFilterActive("todos")}
              >
                Activo: Todos
              </button>
              <button
                className={"admin-pill-filter " + (filterActive === "activos" ? "active" : "")}
                onClick={() => setFilterActive("activos")}
              >
                Activos
              </button>
              <button
                className={"admin-pill-filter " + (filterActive === "inactivos" ? "active" : "")}
                onClick={() => setFilterActive("inactivos")}
              >
                Inactivos
              </button>
            </div>

            {/* TABLA */}
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Aroma</th>
                  <th>Tipo</th>
                  <th>Público</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Activo</th>
                  <th>Vendidos</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loadingProducts ? (
                  <tr><td colSpan={9}>Cargando productos...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={9}>No hay productos.</td></tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                          {p.brand}
                        </div>
                      </td>

                      <td>{p.category}</td>
                      <td>{p.type}</td>
                      <td>{p.audience}</td>

                      <td>{moneyRD(p.price)}</td>

                      <td>
                        <span className={"badge " + (p.stock > 0 ? "green" : "red")}>
                          {p.stock > 0 ? `Disponible (${p.stock})` : "Agotado (0)"}
                        </span>
                      </td>

                      <td>
                        <span className={"badge " + (p.active ? "green" : "gray")}>
                          {p.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <span><strong>{p.sold_count}</strong></span>
                          <button onClick={() => toggleShowSold(p.id)}>
                            {p.show_sold_count ? "Ocultar en web" : "Mostrar en web"}
                          </button>
                        </div>
                      </td>

                      <td>
                        <button onClick={() => toggleStockQuick(p.id)}>Stock</button>
                        <button onClick={() => startEdit(p)}>Editar</button>
                        <button onClick={() => toggleActive(p.id)}>
                          {p.active ? "Desactivar" : "Activar"}
                        </button>
                        <button onClick={() => deleteProduct(p.id)} style={{ color: "red" }}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* FORMULARIO DERECHA */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>{editingProductId ? "Editar producto" : "Nuevo producto"}</h2>
            </div>

            <form className="admin-product-form" onSubmit={handleSubmit}>
              {/* Nombre */}
              <div className="admin-form-group">
                <label>Nombre del producto</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej. Into the Night"
                />
              </div>

              {/* Marca */}
              <div className="admin-form-group">
                <label>Marca</label>
                <select name="brand" value={form.brand} onChange={handleChange}>
                  <option>Bath & Body Works</option>
                  <option>Victoria's Secret</option>
                  <option>Otra marca</option>
                </select>
              </div>

              {/* AROMA */}
              <div className="admin-form-group">
                <label>Aroma</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="frutal">Frutal</option>
                  <option value="floral">Floral</option>
                  <option value="amaderado">Amaderado</option>
                  <option value="citrico">Cítrico</option>
                  <option value="dulce">Dulce / Gourmand</option>
                  <option value="otros">Otros</option>
                </select>
              </div>

              {/* TIPO */}
              <div className="admin-form-group">
                <label>Tipo</label>
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="crema">Crema</option>
                  <option value="splash">Splash</option>
                  <option value="set">Set</option>
                  <option value="perfume">Perfume</option>
                  <option value="otros">Otros</option>
                </select>
              </div>

              {/* PÚBLICO */}
              <div className="admin-form-group">
                <label>Público</label>
                <select name="audience" value={form.audience} onChange={handleChange}>
                  <option value="mujer">Mujer</option>
                  <option value="hombre">Hombre</option>
                  <option value="unisex">Unisex</option>
                  <option value="nino">Niños</option>
                  <option value="otros">Otros</option>
                </select>
              </div>

              {/* Precio */}
              <div className="admin-form-group">
                <label>Precio RD$</label>
                <input
                  type="number"
                  name="price"
                  min="0"
                  value={form.price}
                  onChange={handleChange}
                />
              </div>

              {/* Stock */}
              <div className="admin-form-group">
                <label>Stock (0 = agotado)</label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  value={form.stock}
                  onChange={handleChange}
                />
              </div>

              {/* Activo */}
              <div className="admin-form-group">
                <label>Activo en la web</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    name="active"
                    checked={Boolean(form.active)}
                    onChange={handleChange}
                  />
                  <span>{form.active ? "Sí" : "No"}</span>
                </div>
              </div>

              {/* Vendidos */}
              <div className="admin-form-group">
                <label>Vendidos (contador)</label>
                <input
                  type="number"
                  name="sold_count"
                  min="0"
                  value={form.sold_count}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label>Mostrar “Vendidos X”</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    name="show_sold_count"
                    checked={Boolean(form.show_sold_count)}
                    onChange={handleChange}
                  />
                  <span>{form.show_sold_count ? "Sí" : "No"}</span>
                </div>
              </div>

              {/* Imagen archivo */}
              <div className="admin-form-group">
                <label>Imagen desde tu PC</label>
                <input type="file" accept="image/*" onChange={handleImageFileChange} />
                {imageFileName && <small>{imageFileName}</small>}
              </div>

              {/* URL / Base64 */}
              <div className="admin-form-group">
                <label>o URL/Base64 de la imagen</label>
                <input
                  type="text"
                  name="image_url"
                  value={form.image_url}
                  onChange={handleChange}
                  placeholder="https://... o data:image/..."
                />
              </div>

              {/* Botones */}
              <div className="admin-form-footer">
                <button className="btn-primary" type="submit">
                  {editingProductId ? "💾 Guardar cambios" : "+ Agregar producto"}
                </button>

                {editingProductId && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={cancelEdit}
                    style={{ marginLeft: 10 }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            {/* BLOQUE IA (placeholder) */}
            <div className="admin-ia-block">
              <h3 className="admin-ia-title">🤖 Publicaciones IA</h3>
              <p className="admin-ia-desc">
                Aquí vamos a generar posts completos (texto + hashtags + CTA + idea de imagen).
                En el próximo paso instalo el generador.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}