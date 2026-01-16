// src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../Admin.css";
import { supabase } from "../lib/supabaseClient";
import { uploadProductImage } from "../services/storageService";
import { suggestProductWithAI } from "../services/aiService";
import {
  loadProducts,
  createProduct,
  updateProduct,
  deleteProductById,
} from "../services/productService";
import { getBrands, createBrand } from "../services/brandService";
import { getProductTypes, createProductType } from "../services/productTypeService";
import { getRecentSearches } from "../services/searchAnalyticsService";
import { getTopSearches, getMissingSearches } from "../services/analyticsService";
import { SEARCH_ALIASES } from "../services/searchAnalyticsService";
import { classifySearch } from "../services/searchAnalyticsService";
import {
  getTotalVisits,
  getTodayVisits,
  getYesterdayVisits,
  getThisWeekVisits,
  getThisMonthVisits,
  getTopPages,
  getTopViewedProducts,
  getUniqueVisitorsToday,
  getUniqueVisitorsThisWeek,
  getUniqueVisitorsThisMonth,
} from "../services/analyticsService";
import { getProductMetrics } from "../services/analyticsService";
import { getRealPeopleByProduct } from "../services/productAnalyticsService";
import { getAromas } from "../services/aromaService";

/* -------------------- HELPERS -------------------- */
function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")                 // separa letras y tildes
    .replace(/[\u0300-\u036f]/g, ""); // elimina tildes
}


function normalizeAudience(value) {
  const v = String(value || "").toLowerCase().trim();
  if (v === "niño" || v === "nino" || v === "niños" || v === "ninos") return "nino";
  if (v === "mujer" || v === "women") return "mujer";
  if (v === "hombre" || v === "men") return "hombre";
  if (v === "unisex") return "unisex";
  if (v === "otros" || v === "otro") return "otros";
  return v || "mujer";
}

function formatLabel(value) {
  if (!value) return "—";
  return String(value)
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatAudienceLabel(value) {
  const v = String(value || "").toLowerCase().trim();

  if (v === "nino") return "Niños";
  if (v === "mujer") return "Mujer";
  if (v === "hombre") return "Hombre";
  if (v === "unisex") return "Unisex";
  if (v === "otros") return "Otros";

  return formatLabel(v);
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

function safeStrId(v) {
  // UUID-safe: siempre string o null
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function consolidateSearchesByAlias(searches, SEARCH_ALIASES) {
  const result = {};

  searches.forEach(({ query, count }) => {
    let canonical = query;

    for (const [key, variants] of Object.entries(SEARCH_ALIASES)) {
      if (variants.includes(query)) {
        canonical = key;
        break;
      }
    }

    if (!result[canonical]) {
      result[canonical] = {
        total: 0,
        variants: {},
      };
    }

    result[canonical].total += count;
    result[canonical].variants[query] =
      (result[canonical].variants[query] || 0) + count;
  });

  return result;
}

function renderSearchTypeBadge(query) {
  const type = classifySearch(query);

  const map = {
    generic: { label: "GENÉRICA", color: "#fde68a" }, // amarillo
    mixed: { label: "MIXTA", color: "#fdba74" },     // naranja
    unique: { label: "ÚNICA", color: "#86efac" },    // verde
  };

  if (!map[type]) return null;

  return (
    <span
      style={{
        marginLeft: 8,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: map[type].color,
      }}
    >
      {map[type].label}
    </span>
  );
}

/* -------------------- COMPONENT -------------------- */
export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [editingProductId, setEditingProductId] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [topSearches, setTopSearches] = useState([]);
  const [missingSearches, setMissingSearches] = useState([]);
  const [draftProduct, setDraftProduct] = useState(null);

  // 🤖 IA
  const [aiLoading, setAiLoading] = useState(false);

  // ✅ Brands (UUID)
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [newBrandName, setNewBrandName] = useState("");

  // ✅ Product Types (UUID)
  const [productTypes, setProductTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [newTypeName, setNewTypeName] = useState("");

  // ✅ Aromas (UUID)
  const [aromas, setAromas] = useState([]);
  const [loadingAromas, setLoadingAromas] = useState(true);
  const [newAromaName, setNewAromaName] = useState("");

  // ✅ Form (migrado a UUIDs, con compat de texto temporal)
  const [form, setForm] = useState({
    name: "",
    description: "",
    notes: "",

    brand_id: "",
    aroma_id: "",
    type_id: "",

    audience: "",
    price: "",
    stock: 1,
    active: true,
    image_url: "",
    sold_count: 0,
    show_sold_count: false,
  });

  const [kpis, setKpis] = useState({
    total: 0,
    today: 0,
    yesterday: 0,
    week: 0,
    month: 0,
    uniqueToday: 0,
    uniqueWeek: 0,
    uniqueMonth: 0,
  });

  const [topPages, setTopPages] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

    useEffect(() => {
      async function loadAnalytics() {
        try {
          const [
            total,
            today,
            yesterday,
            week,
            month,
            uniqueToday,
            uniqueWeek,
            uniqueMonth,
            pages,
            products,
          ] = await Promise.all([
            getTotalVisits(),
            getTodayVisits(),
            getYesterdayVisits(),
            getThisWeekVisits(),
            getThisMonthVisits(),
            getUniqueVisitorsToday(),
            getUniqueVisitorsThisWeek(),
            getUniqueVisitorsThisMonth(),
            getTopPages({ limit: 8 }),
            getTopViewedProducts({ limit: 8 }),
          ]);

          setKpis({ total, today, yesterday, week, month, uniqueToday, uniqueWeek, uniqueMonth });
          setTopPages(pages);
          setTopProducts(products);
        } catch (e) {
          console.error("Error cargando analytics:", e.message);
        }
      }

      loadAnalytics();
    }, []);

  const [productMetrics, setProductMetrics] = useState([]);
  const [realPeopleMap, setRealPeopleMap] = useState({});

  const metricsMap = useMemo(() => {
    const map = {};
    productMetrics.forEach((m) => {
      map[m.product_id] = m.views;
    });
    return map;
  }, [productMetrics]);

  useEffect(() => {
    async function loadMetrics() {
      try {
        // métricas normales
        const data = await getProductMetrics();
        setProductMetrics(data);

        // personas reales por producto
        const people = await getRealPeopleByProduct();
        setRealPeopleMap(people);

      } catch (e) {
        console.error("Error cargando métricas:", e);
      }
    }

    loadMetrics();
  }, []);
  

 

  // filtros
  const [filterAroma, setFilterAroma] = useState("todas");
  const [filterAudience, setFilterAudience] = useState("todos");
  const [filterStock, setFilterStock] = useState("todos");
  const [filterActive, setFilterActive] = useState("todos");

  const [imageFileName, setImageFileName] = useState("");

  // -------------------- draft desde otras pantallas --------------------
  useEffect(() => {
    const draft = localStorage.getItem("draftProductName");

    if (draft) {
      setForm((prev) => ({
        ...prev,
        name: draft,
      }));

      localStorage.removeItem("draftProductName");
    }
  }, []);

  useEffect(() => {
    if (draftProduct?.name) {
      setForm((prev) => ({
        ...prev,
        name: draftProduct.name,
      }));
    }
  }, [draftProduct]);

  /* -------------------- CARGAR BRANDS -------------------- */
  async function refreshBrands() {
    setLoadingBrands(true);
    try {
      const data = await getBrands();
      setBrands(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error cargando brands:", e);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  }

  /* -------------------- CARGAR TYPES -------------------- */
  async function refreshTypes() {
    setLoadingTypes(true);
    try {
      const data = await getProductTypes();
      setProductTypes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error cargando product types:", e);
      setProductTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  }

  /* -------------------- CARGAR AROMAS -------------------- */
  async function refreshAromas() {
    console.log("🟡 refreshAromas ejecutándose...");
    setLoadingAromas(true);

    try {
      const data = await getAromas();
      console.log("🟢 Aromas recibidos:", data);

      setAromas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("🔴 Error cargando aromas:", e);
      setAromas([]);
    } finally {
      setLoadingAromas(false);
    }
  }

  useEffect(() => {
    refreshBrands();
    refreshTypes();
    refreshAromas();
  }, []);

  /* -------------------- MAPS (uuid -> name) -------------------- */
  const brandMap = useMemo(() => {
    const m = new Map();
    (brands || []).forEach((b) => m.set(String(b.id), String(b.name)));
    return m;
  }, [brands]);

  const typeMap = useMemo(() => {
    const m = new Map();
    (productTypes || []).forEach((t) => m.set(String(t.id), String(t.name)));
    return m;
  }, [productTypes]);

  const consolidatedTopSearches = useMemo(() => {
    return consolidateSearchesByAlias(topSearches, SEARCH_ALIASES);
  }, [topSearches]);

  

  function getBrandLabel(p) {
    const id = safeStrId(p?.brand_id);
    if (id && brandMap.has(id)) return brandMap.get(id);
    return p?.brand || "—";
  }

  function getTypeLabel(p) {
    const id = safeStrId(p?.type_id);
    if (id && typeMap.has(id)) return typeMap.get(id);
    return p?.type || "—";
  }

  function getAromaLabel(p) {
    if (p?.aroma) return formatLabel(p.aroma);
    return "—";
  }



  /* -------------------- CARGAR PRODUCTOS -------------------- */
  async function refreshProducts() {
    setLoadingProducts(true);
    try {
      const data = await loadProducts();

      const normalized = (Array.isArray(data) ? data : []).map((p) => ({
        id: p.id,
        name: p.name ?? "",

        // ✅ CAMPOS DE TEXTO (CLAVE)
        description: p.description ?? "",
        notes: p.notes ?? "",

        // Relaciones reales
        brand_id: p.brand_id ?? null,
        type_id: p.type_id ?? null,
        aroma_id: p.aroma_id ?? null,

        // Visual joins
        brand: p.brands?.name ?? p.brand ?? "",
        type: p.product_types?.name ?? p.type ?? "",
        aroma: p.aromas?.name ?? "",

        audience: normalizeAudience(p.audience || "mujer"),

        price: Number(p.price ?? 0),
        stock: safeInt(p.stock ?? 0),
        active: Boolean(p.active),
        image_url: p.image_url ?? "",

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
  }, []);



  /* -------------------- REALTIME (productos) -------------------- */
  useEffect(() => {
    const channel = supabase
      .channel("products-realtime-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () =>
        refreshProducts()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  /* ------------ BUSQUEDAS RECIENTES, LO MAS BUSCADO Y LO MAS VISTO------------ */
  useEffect(() => {
    (async () => {
      const data = await getRecentSearches({ limit: 20 });
      setRecentSearches(data);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const data = await getTopSearches({ limit: 10 });
      setTopSearches(data);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const data = await getMissingSearches({ limit: 10 });
      setMissingSearches(data);
      })();
  }, []);

  /* -------------------- KPIs -------------------- */
  const stats = useMemo(() => {
    const total = products.length;

    const disponibles = products.filter((p) => p.stock > 0).length;
    const agotados = products.filter((p) => p.stock <= 0).length;

    const activos = products.filter((p) => p.active).length;
    const inactivos = total - activos;

    // ✅ Aromas únicos (por ID real)
    const aromasUnicos = new Set(
      products
        .map((p) => p.aroma_id)
        .filter(Boolean) // quita null / undefined
    ).size;

    return { total, disponibles, agotados, activos, inactivos, aromasUnicos };
  }, [products]);

  

  

  /* -------------------- FILTRO LISTA -------------------- */
  const filteredProducts = useMemo(() => {
    const fAud =
      filterAudience === "todos"
        ? "todos"
        : normalizeAudience(filterAudience);

    return products.filter((p) => {
      const aromaId = p.aroma_id;
      const audience = normalizeAudience(p.audience);
      const stock = Number(p.stock || 0);
      const active = Boolean(p.active);

      // 🔥 AROMA por ID real
      if (filterAroma !== "todas" && aromaId !== filterAroma) return false;

      // PÚBLICO
      if (fAud !== "todos" && audience !== fAud) return false;

      // STOCK
      if (filterStock === "disponible" && stock <= 0) return false;
      if (filterStock === "agotado" && stock > 0) return false;

      // ACTIVO
      if (filterActive === "activos" && !active) return false;
      if (filterActive === "inactivos" && active) return false;

      return true;
    });
  }, [products, filterAroma, filterAudience, filterStock, filterActive]);

  /* -------------------- FORM -------------------- */
  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resolveBrandIdFromText(brandText) {
    const txt = String(brandText || "").toLowerCase().trim();
    if (!txt) return "";
    const found = (brands || []).find(
      (b) => String(b.name).toLowerCase().trim() === txt
    );
    return found ? String(found.id) : "";
  }

  function resolveTypeIdFromText(typeText) {
    const txt = String(typeText || "").toLowerCase().trim();
    if (!txt) return "";
    const found = (productTypes || []).find(
      (t) => String(t.name).toLowerCase().trim() === txt
    );
    return found ? String(found.id) : "";
  }

  function resolveAromaIdFromText(aromaText) {
    const txt = String(aromaText || "").toLowerCase().trim();
    if (!txt) return "";
    const found = (aromas || []).find(
      (a) => String(a.name).toLowerCase().trim() === txt
    );
    return found ? String(found.id) : "";
  }

  function startEdit(product) {
    setEditingProductId(product.id);

    // Intenta resolver IDs si el producto vino con texto (compat)
    const resolvedBrandId =
      product.brand_id != null ? String(product.brand_id) : resolveBrandIdFromText(product.brand);

    const resolvedTypeId =
      product.type_id != null ? String(product.type_id) : resolveTypeIdFromText(product.type);

    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      notes: product.notes ?? "",

      brand_id: product.brand_id || "",
      aroma_id: product.aroma_id || "",
      type_id: product.type_id || "",

      audience: normalizeAudience(product.audience ?? "mujer"),
      price: String(product.price ?? ""),
      stock: safeInt(product.stock ?? 0),
      active: Boolean(product.active),

      image_url: product.image_url || "",

      sold_count: safeInt(product.sold_count ?? 0),
      show_sold_count: Boolean(product.show_sold_count),
    });

    setNewBrandName("");
    setNewTypeName("");
    setImageFileName("");
    setTimeout(() => {
      document
        .getElementById("add-product-form")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 0);
      }

  function cancelEdit() {
    setEditingProductId(null);
    setForm({
      name: "",
      description: "",
      notes: "",
      brand_id: "",
      aroma_id: "",
      type_id: "",
      audience: "",
      price: "",
      stock: 1,
      active: true,
      image_url: "",
      sold_count: 0,
      show_sold_count: false,
    });
    setNewBrandName("");
    setNewTypeName("");
    setImageFileName("");
  }

 /* -------------------- IA SUGGEST -------------------- */
  async function handleAISuggest() {
    if (!form.image_url) {
      alert("Primero sube una imagen");
      return;
    }

    setAiLoading(true);

    try {
      const aiData = await suggestProductWithAI({
        imageUrl: form.image_url,
        nameHint: form.name,
      });

      // ---------------------------
      // NORMALIZAR TEXTO IA
      // ---------------------------
      const aiBrandText = String(aiData?.brand || "").trim();
      const aiTypeText = String(aiData?.type || "").trim();
      const aiAromaText = String(aiData?.aroma || aiData?.category || "").trim();
      const aiAudience = normalizeAudience(aiData?.audience || "");

      // ---------------------------
      // RESOLVER IDS DESDE TEXTO
      // ---------------------------
      const resolvedBrandId = aiBrandText
        ? resolveBrandIdFromText(aiBrandText)
        : "";

      const resolvedTypeId = aiTypeText
        ? resolveTypeIdFromText(aiTypeText)
        : "";

      const resolvedAromaId = aiAromaText
        ? resolveAromaIdFromText(aiAromaText)
        : "";

      // ---------------------------
      // ACTUALIZAR FORM
      // ---------------------------
      setForm((prev) => ({
        ...prev,

        // básicos
        name: String(aiData?.name || "").trim() || prev.name,
        description:
          String(aiData?.description || "").trim() || prev.description,
        notes: String(aiData?.notes || "").trim() || prev.notes,

        // IDs reales
        brand_id: resolvedBrandId || prev.brand_id,
        type_id: resolvedTypeId || prev.type_id,
        aroma_id: resolvedAromaId || prev.aroma_id,

        // otros campos
        audience: aiAudience || prev.audience,
      }));

      // ---------------------------
      // PREPARAR "AGREGAR NUEVO"
      // ---------------------------
      if (aiBrandText && !resolvedBrandId) setNewBrandName(aiBrandText);
      if (aiTypeText && !resolvedTypeId) setNewTypeName(aiTypeText);
      if (aiAromaText && !resolvedAromaId) setNewAromaName(aiAromaText);
    } catch (e) {
      console.error(e);
      alert("No se pudo generar con IA");
    } finally {
      setAiLoading(false);
    }
  }

  /* -------------------- SUBIR IMAGEN EN SUPBASE -------------------- */
  async function handleImageFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageFileName(`Subiendo: ${file.name}...`);

      const { publicUrl } = await uploadProductImage(file, { folder: "products" });

      // Guardamos URL pública en el form
      setForm((prev) => ({ ...prev, image_url: publicUrl }));

      setImageFileName(`✅ Subida: ${file.name}`);
    } catch (err) {
      console.error(err);
      setImageFileName("");
      alert("No se pudo subir la imagen. Revisa Storage/policies/login.");
    }
  }

  /* -------------------- CREAR NUEVA MARCA -------------------- */
  async function handleCreateBrand() {
    const name = String(newBrandName || "").trim();
    if (!name) return;

    try {
      const created = await createBrand(name);
      await refreshBrands();

      if (created?.id) {
        setForm((prev) => ({ ...prev, brand_id: String(created.id) }));
      } else {
        const found = (brands || []).find(
          (b) => String(b.name).toLowerCase().trim() === name.toLowerCase().trim()
        );
        if (found) setForm((prev) => ({ ...prev, brand_id: String(found.id) }));
      }

      setNewBrandName("");
    } catch (e) {
      console.error(e);
      alert("No se pudo crear la marca (revisa RLS/permisos).");
    }
  }

  /* -------------------- CREAR NUEVO TIPO -------------------- */
  async function handleCreateType() {
    const name = String(newTypeName || "").trim();
    if (!name) return;

    try {
      const created = await createProductType(name);
      await refreshTypes();

      if (created?.id) {
        setForm((prev) => ({ ...prev, type_id: String(created.id) }));
      } else {
        const found = (productTypes || []).find(
          (t) => String(t.name).toLowerCase().trim() === name.toLowerCase().trim()
        );
        if (found) setForm((prev) => ({ ...prev, type_id: String(found.id) }));
      }

      setNewTypeName("");
    } catch (e) {
      console.error(e);
      alert("No se pudo crear el tipo (revisa RLS/permisos).");
    }
  }

  /* -------------------- CRUD -------------------- */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!String(form.name || "").trim()) return alert("Ponle un nombre al producto");
    if (!form.price || isNaN(Number(form.price))) return alert("Precio inválido");

    // ✅ Validación IDs
    if (!form.brand_id) return alert("Selecciona una Marca (o crea una nueva).");
    if (!form.type_id) return alert("Selecciona un Tipo (o crea uno nuevo).");

    const payload = {
      name: String(form.name).trim(),
      description: String(form.description || "").trim() || null,
      notes: String(form.notes || "").trim() || null,

      // 🔐 Relaciones reales
      brand_id: form.brand_id || null,
      type_id: form.type_id || null,
      aroma_id: form.aroma_id || null,

      // 🎯 Atributos
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
    <>
      {/* Encabezado */}
      <header className="admin-main-header">
        <div className="admin-main-title-block">
          <h1>Panel de control</h1>
          <p>Administrar catálogo, stock, activo y “vendidos”. Publicaciones IA pendiente.</p>
        </div>
      </header>

      {/* ================= PERSONAS REALES ================= */}
      <div className="dash-section">
        <h3>👥 Personas reales</h3>

        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-title">Personas hoy</span>
            <span className="kpi-value">{kpis.uniqueToday ?? 0}</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-title">Esta semana</span>
            <span className="kpi-value">{kpis.uniqueWeek ?? 0}</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-title">Este mes</span>
            <span className="kpi-value">{kpis.uniqueMonth ?? 0}</span>
          </div>
        </div>
      </div>

      {/* ================= TRÁFICO ================= */}
      <div className="dash-section">
        <h3>📊 Tráfico</h3>
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-title">Visitas totales</span>
            <span className="kpi-value">{kpis.total}</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-title">Hoy</span>
            <span className="kpi-value">{kpis.today}</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-title">Ayer</span>
            <span className="kpi-value">{kpis.yesterday}</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-title">Esta semana</span>
            <span className="kpi-value">{kpis.week}</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-title">Este mes</span>
            <span className="kpi-value">{kpis.month}</span>
          </div>
        </div>
      </div>


      <div className="dash-section">
        <h3>🔥 Productos más vistos</h3>

        <table className="dash-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Marca</th>
              <th className="num">Vistas</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((row) => (
              <tr key={row.product_id}>
                <td>{row.product?.name || "—"}</td>
                <td>{row.product?.product_types?.name || "—"}</td>
                <td>{row.product?.brands?.name || "—"}</td>
                <td className="num">{row.views}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MÉTRICAS POR PRODUCTO ================= */}
      <div className="dash-section">
        <h3>📊 Rendimiento por producto</h3>

        <table className="dash-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Marca</th>
              <th className="num">Vistas</th>
              <th className="num">Personas reales</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const views = metricsMap[p.id] || 0;
              const realPeople = realPeopleMap[p.id] || 0;

              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{getTypeLabel(p)}</td>
                  <td>{getBrandLabel(p)}</td>
                  <td className="num">{views}</td>
                  <td className="num">{realPeople}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* -------------------- BUSQUEDAS RECIENTES -------------------- */}
      <section className="admin-card">
        <h3>🔍 Búsquedas recientes</h3>

        {recentSearches.length === 0 ? (
          <p>No hay búsquedas registradas</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Búsqueda</th>
                <th>Resultados</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recentSearches.map((s, i) => (
                <tr key={i}>
                  <td>
                  {s.query}
                  {renderSearchTypeBadge(s.query)}
                </td>
                  <td>{s.results_count}</td>
                  <td>{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* -------------------- TOP BUSQUEDAS -------------------- */}
      <section className="admin-card">
        <h3>🔥 Top búsquedas</h3>

        {Object.keys(consolidatedTopSearches).length === 0 ? (
          <p>No hay datos aún</p>
        ) : (
          <div>
            {Object.entries(consolidatedTopSearches).map(
              ([canonical, data]) => (
                <div key={canonical} style={{ marginBottom: 12 }}>
                  <strong>
                    {canonical} 
                    {renderSearchTypeBadge(canonical)}
                    {" "}
                    ({data.total})
                  </strong>

                  <ul style={{ marginLeft: 16 }}>
                    {Object.entries(data.variants).map(
                      ([variant, count]) => (
                        <li key={variant}>
                          {variant} ({count})
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* -------------------- BUSQUEDAS SIN RESULTADOS -------------------- */}
      <section className="admin-card">
        <h3>⚠️ Búsquedas sin resultados</h3>

        {missingSearches.length === 0 ? (
          <p>No hay búsquedas sin resultados</p>
        ) : (
          <div>
            {missingSearches.map((item) => {
              const isHot = item.total >= 2;

              return (
                <div
                  key={item.canonical}
                  style={{
                    marginBottom: 16,
                    padding: isHot ? "8px 10px" : 0,
                    backgroundColor: isHot ? "#fff3cd" : "transparent",
                    borderRadius: isHot ? 6 : 0,
                    fontWeight: isHot ? 600 : "normal",
                  }}
                >
                  <strong>
                    {item.canonical} 
                    {renderSearchTypeBadge(item.canonical)}
                    {" "}
                    ({item.total})
                    {isHot && <span style={{ marginLeft: 6 }}>🔥</span>}
                    <button
                      style={{
                        marginLeft: 10,
                        padding: "4px 8px",
                        fontSize: 12,
                        cursor: "pointer"
                      }}
                      onClick={() => {
                        setDraftProduct({
                          name: item.canonical,
                          source: "missing_search"
                        });

                        // baja al formulario
                        document
                          .getElementById("add-product-form")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      ➕ Agregar
                    </button>
                  </strong>

                  <ul style={{ marginLeft: 18, marginTop: 6 }}>
                    {Object.entries(item.variants).map(([variant, c]) => (
                      <li key={variant}>
                        {variant} ({c})
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

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
          <div className="stat-value">{stats.aromasUnicos}</div>
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
            {/* 🔄 RESET GLOBAL */}
            <button
              className={
                "admin-pill-filter " +
                (filterAroma === "todas" &&
                filterAudience === "todos" &&
                filterStock === "todos" &&
                filterActive === "todos"
                  ? "active"
                  : "")
              }
              onClick={() => {
                setFilterAroma("todas");
                setFilterAudience("todos");
                setFilterStock("todos");
                setFilterActive("todos");
              }}
            >
              🔄 Ver todos
            </button>

            {/* ================= AROMA ================= */}
            <button
              className={"admin-pill-filter " + (filterAroma === "todas" ? "active" : "")}
              onClick={() => {
                setFilterAroma("todas");
                setFilterAudience("todos");
                setFilterStock("todos");
                setFilterActive("todos");
              }}
            >
              Aroma: Todas
            </button>

            {["frutal", "floral", "amaderado", "dulce", "citrico", "otros"].map((cat) => (
              <button
                key={cat}
                className={"admin-pill-filter " + (filterAroma === cat ? "active" : "")}
                onClick={() => {
                  setFilterAroma(cat);
                  setFilterAudience("todos");
                  setFilterStock("todos");
                  setFilterActive("todos");
                }}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}

            {/* ================= PÚBLICO ================= */}
            <button
              className={"admin-pill-filter " + (filterAudience === "todos" ? "active" : "")}
              onClick={() => {
                setFilterAudience("todos");
                setFilterAroma("todas");
                setFilterStock("todos");
                setFilterActive("todos");
              }}
            >
              Público: Todos
            </button>

            {["mujer", "hombre", "unisex", "nino", "otros"].map((aud) => (
              <button
                key={aud}
                className={"admin-pill-filter " + (filterAudience === aud ? "active" : "")}
                onClick={() => {
                  setFilterAudience(aud);
                  setFilterAroma("todas");
                  setFilterStock("todos");
                  setFilterActive("todos");
                }}
              >
                {aud === "nino" ? "Niños" : aud.charAt(0).toUpperCase() + aud.slice(1)}
              </button>
            ))}

            {/* ================= STOCK ================= */}
            <button
              className={"admin-pill-filter " + (filterStock === "todos" ? "active" : "")}
              onClick={() => {
                setFilterStock("todos");
                setFilterAroma("todas");
                setFilterAudience("todos");
                setFilterActive("todos");
              }}
            >
              Stock: Todos
            </button>

            {[
              { id: "disponible", label: "Disponibles" },
              { id: "agotado", label: "Agotados" },
            ].map((s) => (
              <button
                key={s.id}
                className={"admin-pill-filter " + (filterStock === s.id ? "active" : "")}
                onClick={() => {
                  setFilterStock(s.id);
                  setFilterAroma("todas");
                  setFilterAudience("todos");
                  setFilterActive("todos");
                }}
              >
                {s.label}
              </button>
            ))}

            {/* ================= ACTIVO ================= */}
            <button
              className={"admin-pill-filter " + (filterActive === "todos" ? "active" : "")}
              onClick={() => {
                setFilterActive("todos");
                setFilterAroma("todas");
                setFilterAudience("todos");
                setFilterStock("todos");
              }}
            >
              Activo: Todos
            </button>

            {[
              { id: "activos", label: "Activos" },
              { id: "inactivos", label: "Inactivos" },
            ].map((a) => (
              <button
                key={a.id}
                className={"admin-pill-filter " + (filterActive === a.id ? "active" : "")}
                onClick={() => {
                  setFilterActive(a.id);
                  setFilterAroma("todas");
                  setFilterAudience("todos");
                  setFilterStock("todos");
                }}
              >
                {a.label}
              </button>
            ))}
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
                <tr>
                  <td colSpan={9}>Cargando productos...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9}>No hay productos.</td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        {getBrandLabel(p)}
                      </div>
                    </td>

                    <td>{getAromaLabel(p)}</td>
                    <td>{getTypeLabel(p)}</td>
                    <td>{formatAudienceLabel(p.audience)}</td>

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
                        <span>
                          <strong>{p.sold_count}</strong>
                        </span>
                        <button className="btn-outline" onClick={() => toggleShowSold(p.id)}>
                          {p.show_sold_count ? "Ocultar en web" : "Mostrar en web"}
                        </button>
                      </div>
                    </td>

                   <td className="actions-cell">
                    {/* Acciones normales */}
                    <div className="actions-row">
                      <button
                        className="btn-outline"
                        onClick={() => toggleStockQuick(p.id)}
                      >
                        Stock
                      </button>

                      <button
                        className="btn-edit"
                        onClick={() => startEdit(p)}
                      >
                        Editar
                      </button>

                      <button
                        className="btn-soft"
                        onClick={() => toggleActive(p.id)}
                      >
                        {p.active ? "Desactivar" : "Activar"}
                      </button>
                    </div>

                    {/* Acción peligrosa */}
                    <div className="actions-row danger-row">
                      <button
                        className="btn-danger"
                        onClick={() => deleteProduct(p.id)}
                      >
                        Eliminar
                      </button>
                    </div>
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

          <form id="add-product-form" className="admin-product-form" onSubmit={handleSubmit}>
            <button
              type="button"
              className="btn-soft"
              onClick={handleAISuggest}
              disabled={aiLoading}
              style={{ marginBottom: 16 }}
            >
              {aiLoading ? "🤖 Analizando..." : "🤖 Sugerir con IA"}
            </button>

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

            <div className="admin-form-group">
              <label>Descripción del producto (opcional)</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe el producto (opcional)"
              />
            </div>

            {/* Notas / Composición */}
            <div className="admin-form-group">
              <label>Notas / Composición (opcional)</label>
              <textarea
                name="notes"
                value={form.notes || ""}
                onChange={handleChange}
                rows={3}
                placeholder="Ej: manteca de karité, vainilla, aloe vera..."
              />
            </div>

            {/* ✅ Marca por ID + agregar nueva */}
            <div className="admin-form-group">
              <label>Marca</label>
              <select name="brand_id" value={form.brand_id} onChange={handleChange}>
                <option value="">
                  {loadingBrands ? "Cargando marcas..." : "Selecciona una marca"}
                </option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Agregar nueva marca..."
                />
                <button type="button" className="btn-soft" onClick={handleCreateBrand}>
                  + Agregar
                </button>
              </div>
            </div>

            {/* Aroma */}
            <div className="admin-form-group">
              <label>Aroma</label>
              <select name="aroma_id" value={form.aroma_id} onChange={handleChange}>
                <option value="">
                  {loadingAromas ? "Cargando aromas..." : "Selecciona un aroma"}
                </option>
                {aromas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Tipo por ID + agregar nuevo */}
            <div className="admin-form-group">
              <label>Tipo</label>
              <select name="type_id" value={form.type_id} onChange={handleChange}>
                <option value="">
                  {loadingTypes ? "Cargando tipos..." : "Selecciona un tipo"}
                </option>
                {productTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Agregar nuevo tipo..."
                />
                <button type="button" className="btn-soft" onClick={handleCreateType}>
                  + Agregar
                </button>
              </div>
            </div>

            {/* Público */}
            <div className="admin-form-group">
              <label>Público</label>
              <select name="audience" value={form.audience} onChange={handleChange}>
                <option value="">Seleccione el público</option>
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
              <input type="number" name="price" min="0" value={form.price} onChange={handleChange} />
            </div>

            {/* Stock */}
            <div className="admin-form-group">
              <label>Stock (0 = agotado)</label>
              <input type="number" name="stock" min="0" value={form.stock} onChange={handleChange} />
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
              <label>Imagen desde tu PC </label>
              <input
                type="file"
                id="image-file-input"
                accept="image/*"
                onChange={handleImageFileChange}
                style={{ display: "none" }}
              />

              <label
                htmlFor="image-file-input"
                className="btn-outline"
                style={{ display: "inline-block" }}
              >
                📁 Seleccionar imagen
              </label>

              {imageFileName && (
                <small style={{ display: "block", marginTop: 6 }}>
                  {imageFileName}
                </small>
              )}
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
                  className="btn-outline"
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
              Aquí vamos a generar posts completos (texto + hashtags + CTA + idea de imagen). En el próximo paso
              instalo el generador.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

