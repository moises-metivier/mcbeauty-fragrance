// src/pages/Home.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "../Home.css";
import "../product.css";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { loadPublicProducts } from "../services/productService";
import { trackSearch } from "../services/searchAnalyticsService";
import { trackPageView } from "../services/analyticsService";
//import { loadBrands, loadProductTypes } from "../services/filterService";
import { adaptProductForCard } from "../utils/productViewAdapter";
import { subscribeToPresence } from "../services/presenceService";
import Footer from "../components/Footer";
import SEO from "../components/SEO";



/* ============================= */
/* HELPERS */
/* ============================= */
function moneyRD(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `RD$${n.toFixed(2)}` : "RD$0.00";
}

function clampQty(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(10, Math.trunc(n)));
}

function formatType(type) {
  if (!type) return "";
  return type
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const TYPE_SYNONYMS = {
    crema: ["crema", "cream", "body cream", "bodycream", "lotion", "body lotion"],
    splash: ["splash", "mist", "body mist", "bodymist"],
    perfume: ["perfume", "parfum"],
  };

function normalizeTypeForSearch(typeName = "") {
  const t = String(typeName).toLowerCase().trim().replace(/\s+/g, " ");

  for (const [key, list] of Object.entries(TYPE_SYNONYMS)) {
    if (
      list.some(
        (s) =>
          String(s).toLowerCase().trim().replace(/\s+/g, " ") === t
      )
    ) {
      return key; // "crema" | "splash" | "perfume"
    }
  }

  return t;
}

/* ============================= */
/* COMPONENT */
/* ============================= */
export default function Home() {
  const navigate = useNavigate();
  const { cart, addToCart, updateQty, removeFromCart } = useCart();

  const [products, setProducts] = useState([]);
  const [selectedQty, setSelectedQty] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);

  // 🔍 BUSCADOR + FILTRO POR MARCA 
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all"); // all | bath | victoria

  const catalogRef = useRef(null);
  const searchTimeout = useRef(null);

  const [brands, setBrands] = useState([]);
  const [types, setTypes] = useState([]);

  // 🧩 FILTRO POR TIPO (perfume, splash, crema, etc.)
  const [typeFilter, setTypeFilter] = useState(null);


  const viewProducts = useMemo(
    () => products.map(adaptProductForCard),
    [products]
  );

  
  useEffect(() => {
    const unsub = subscribeToPresence(setOnlineCount);
    return () => unsub();
  }, []);
  /* ============================= */
  /* HERO */
  /* ============================= */
  const hero = useMemo(
    () => ({
      title: "Compra fácil por WhatsApp",
      subtitle: "Atención personalizada · Pago contra entrega · Entregas rápidas",
      image: "/banner.png",
      cta: "Ver catálogo",
    }),
    []
  );

  /* ============================= */
  /* LOAD PRODUCTS (PRO: desde service único) */
  /* ============================= */
  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        setLoading(true);
        const data = await loadPublicProducts({
          activeOnly: true,
          limit: 300, 
          offset: 0,
        });

        if (!mounted) return;
        setProducts(data || []);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    boot();
    return () => (mounted = false);
  }, []);

  /* ============================= */
  /* QTY HANDLERS */
  /* ============================= */
  function getQty(id) {
    return selectedQty[id] || 1;
  }

  function changeQty(id, value) {
    const qty = clampQty(value);
    setSelectedQty((prev) => ({ ...prev, [id]: qty }));
  }

  /* ============================= */
  /* ADD TO CART */
  /* ============================= */
  function handleAdd(product) {
    addToCart(
      {
        id: product.id,
        name: product.name,
        brand: product.brandName || "—",
        type: product.typeName || "—",
        aroma: product.aromaName || "—",
        audience: product.audience,
        price: Number(product.price || 0),
        image: product.image_url,
      },
      getQty(product.id)
    );

    setToast(`🛒 ${product.name} agregado al carrito`);
    setTimeout(() => setToast(""), 1500);
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  /* ============================= */
  /* FILTRO + BUSCADOR */
  /* ============================= */
  const filteredProducts = useMemo(() => {
    const q = String(search || "").toLowerCase().trim();

    return (viewProducts || []).filter((p) => {
      const brand = String(p.brandName || "").toLowerCase();

      // ---- TIPO NORMALIZADO ----
      const rawType = String(p.typeName || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");

      const typeKey = normalizeTypeForSearch(rawType); // crema | splash | perfume

      // ---- PALABRAS CLAVE EXTRA PARA BÚSQUEDA ----
      const typeKeywords =
        (TYPE_SYNONYMS[typeKey] || []).join(" ");

      const name = String(p.name || "").toLowerCase();
      const notes = String(p.notes || "").toLowerCase();
      const desc = String(p.description || "").toLowerCase();
      const aroma = String(p.aromaName || "").toLowerCase();

      // 🔥 TEXTO FINAL PARA BUSCAR
      const text = `
        ${name}
        ${brand}
        ${typeKey}
        ${typeKeywords}
        ${aroma}
        ${notes}
        ${desc}
      `.toLowerCase();

      // ---- FILTROS ----
      const matchesSearch = !q || text.includes(q);

      const matchesBrand =
        brandFilter === "all" ||
        (brandFilter === "bath" && brand.includes("bath")) ||
        (brandFilter === "victoria" && brand.includes("victoria"));

      const matchesType =
        !typeFilter || typeKey === typeFilter.toLowerCase();

      return matchesSearch && matchesBrand && matchesType;
    });
  }, [viewProducts, search, brandFilter, typeFilter]);


  /* ============================= */
  /*  TRACK SEARCH  */
  /* ============================= */
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    const q = search.trim();
    searchTimeout.current = setTimeout(() => {
      trackSearch(q, filteredProducts.length);
    }, 700);

    return () => clearTimeout(searchTimeout.current);
  }, [search, filteredProducts.length]);

  useEffect(() => {
    trackPageView("/", null, null);
  }, []);



  /* ============================= */
  /* UI */
  /* ============================= */
  return (
    <>
      <SEO
        title="Perfumes y Cremas Originales en RD | MC Beauty & Fragrance"
        description="Compra perfumes y cremas 100% originales en República Dominicana. Pago contra entrega, atención por WhatsApp y entregas rápidas."
        canonical="https://mcbeautyfragrance.com/"
      />

      {/* ================= HERO ================= */}
      <section className="home-hero">
        <img src={hero.image} alt="MC Beauty & Fragrance" className="home-hero-img" />

        <div className="home-hero-cta">
          <h1>{hero.title}</h1>
          <p>{hero.subtitle}</p>

          <button
            className="home-hero-btn"
            onClick={() => catalogRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            🟢 {hero.cta}
          </button>
        </div>
      </section>

      {/* ================= SEARCH & FILTERS ================= */}
      <section className="home-products-section">
        <input
          type="text"
          placeholder="Buscar perfumes, aromas, marcas…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "999px",
            border: "1px solid #ddd",
            marginBottom: 12,
          }}
        />

        <div className="home-filters">
          <button
            className={`home-pill-filter ${brandFilter === "all" ? "active" : ""}`}
            onClick={() => setBrandFilter("all")}
          >
            Todas
          </button>

          <button
            className={`home-pill-filter ${brandFilter === "bath" ? "active" : ""}`}
            onClick={() => setBrandFilter("bath")}
          >
            Bath & Body Works
          </button>

          <button
            className={`home-pill-filter ${brandFilter === "victoria" ? "active" : ""}`}
            onClick={() => setBrandFilter("victoria")}
          >
            Victoria’s Secret
          </button>
        </div>
      </section>

      {/* ================= CATALOG ================= */}
      <section ref={catalogRef} className="home-products-section">
        <h2 className="home-section-title">Catálogo</h2>

        {loading && <p>Cargando productos...</p>}
        {!loading && filteredProducts.length === 0 && (
          <p>No hay productos que coincidan</p>
        )}

        {/* ================= FILTRO POR TIPO (DINÁMICO) ================= */}
        

        {/* ================= FILTRO POR MARCA (YA EXISTENTE) ================= */}
        

        {/* ================= GRID ================= */}
        <div className="home-products-grid">
          {filteredProducts.map((p) => {
            const brand = p.brandName || "—";
            const type = p.typeName || "—";

            return (
              <article
                key={p.id}
                className="home-product-card"
                onClick={() => navigate(`/product/${p.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="home-product-img-wrapper">
                  <img
                    src={p.image_url || "/placeholder.png"}
                    alt={p.name}
                    className="home-product-img"
                  />
                </div>

                {p.show_sold_count && (
                  <div className="badge-sold">
                    🔥 Vendidos {Number(p.sold_count || 0)}
                  </div>
                )}

                <h3 className="home-product-name">{p.name}</h3>

                {/* Marca + Tipo */}
                <div className="home-product-meta">
                  <span className="brand">{brand}</span>
                  <span className="dot">·</span>
                  <span className="type">{type}</span>
                </div>

                {p.audience && (
                  <div className="home-product-audience">
                    {p.audience === "mujer" && "Mujer"}
                    {p.audience === "hombre" && "Hombre"}
                    {p.audience === "unisex" && "Unisex"}
                    {p.audience === "nino" && "Niños"}
                  </div>
                )}

                
                {/* 
                {p.notes && <div className="home-product-notes">{p.notes}</div>}
                 */}

                <div className="home-product-price">{moneyRD(p.price)}</div>

                {Number(p.stock || 0) <= 0 ? (
                  <div className="badge-out">Agotado</div>
                ) : (
                  <>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={getQty(p.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => changeQty(p.id, e.target.value)}
                    />

                    <button
                      className="btn-add"
                      onClick={(e) => {
                        e.stopPropagation();   // 👈 CLAVE
                        handleAdd(p);
                      }}
                    >
                      🛒 Añadir
                    </button>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* ================= CART SUMMARY ================= */}
      {cart.length > 0 && (
        <section className="home-cart-section">
          <h3>Tu pedido</h3>

         {cart.map((item) => (
            <div key={item.id} className="checkout-item">
              <div>
                <strong>{item.name}</strong>
                {item.type && (
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                    {formatType(item.type)}
                  </div>
                )}
              </div>

              <input
                type="number"
                min="1"
                value={item.qty}
                onChange={(e) => updateQty(item.id, e.target.value)}
              />

              <span>{moneyRD(item.price * item.qty)}</span>

              <button onClick={() => removeFromCart(item.id)}>✕</button>
            </div>
          ))}

          <strong className="cart-total">Total: {moneyRD(total)}</strong>

          <button className="btn-whatsapp-checkout" onClick={() => navigate("/checkout")}>
            🟢 Confirmar pedido por WhatsApp
          </button>
        </section>
      )}

      {toast && <div className="toast">{toast}</div>}

      <section className="why-us">
        <h2>¿Por qué elegir MC Beauty & Fragrance?</h2>

        <div className="why-grid">
          <div className="why-item">🌸 <span>Expertos en fragancias</span></div>
          <div className="why-item">📦 <span>Entrega inmediata</span></div>
          <div className="why-item">🎁 <span>Ideal para regalos</span></div>
          <div className="why-item">🛍️ <span>Productos bien empacados</span></div>
        </div>
      </section>
      <Footer />
    </>
  );
}