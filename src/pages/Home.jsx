// src/pages/Home.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "../Home.css";
import "../product.css";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { loadPublicProducts } from "../services/productService";
import { trackSearch } from "../services/searchAnalyticsService";
import { trackPageView } from "../services/analyticsService";
//import { loadBrands, loadProductTypes } from "../services/filterService";
import { adaptProductForCard } from "../utils/productViewAdapter";
import { subscribeToPresence } from "../services/presenceService";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { loadHomeSections } from "../services/homeSectionService";



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

// =============================
// HOME SECTIONS → PRODUCT FILTER
// =============================
function getProductsForSection(section, products) {
  if (!section || !products) return [];

  // SOLO promociones/editoriales
  return products.filter(
    (p) => p.home_tag === section.filter_value
  );
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

  // AGREGAR BOTONES DINAMICOS EN EL HOME
  const [homeSections, setHomeSections] = useState([]);
  const [homeTagFilter, setHomeTagFilter] = useState(null);


  const viewProducts = useMemo(() => {
    return (products || []).map((p) => ({
      ...adaptProductForCard(p),
      home_tag: p.home_tag ?? null, // ✅ conservar
    }));
  }, [products]);

  
  useEffect(() => {
    const id = setTimeout(() => {
      const unsub = subscribeToPresence(setOnlineCount);
      return () => unsub();
    }, 1500);

    return () => clearTimeout(id);
  }, []);


  // =============================
  // HOME SECTIONS VISIBLES
  // =============================
  const visibleButtons = useMemo(() => {
    return (homeSections || [])
      .filter(s => s.active && s.show_button)
      .sort((a, b) => (a.button_order ?? 0) - (b.button_order ?? 0));
  }, [homeSections]);

  const visibleSections = useMemo(() => {
    return (homeSections || [])
      .filter(s => s.active && s.show_section)
      .sort((a, b) => (a.section_order ?? 0) - (b.section_order ?? 0));
  }, [homeSections]);
  /* ============================= */
  /* HERO */
  /* ============================= */
  const hero = useMemo(
    () => ({
      title: "Compra fácil por WhatsApp",
      subtitle: "Atención personalizada · Pago contra entrega · Entregas rápidas",
      image: "/banner.webp",
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
  /* CARGAR SECCIONES DESDE SUPABASE  */
  /* ============================= */
  useEffect(() => {
    let mounted = true;

    async function loadSections() {
      try {
        const data = await loadHomeSections();
        if (!mounted) return;
        setHomeSections(data || []);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setHomeSections([]);
      }
    }

    loadSections();
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
  /* FILTRO + BUSCADOR (FINAL) */
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
      const typeKeywords = (TYPE_SYNONYMS[typeKey] || []).join(" ");

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

      /* ================= FILTROS ================= */

      // 🔍 Buscador
      const matchesSearch = !q || text.includes(q);

      // 🧴 Tipo (crema / splash / perfume)
      const matchesType =
        !typeFilter || typeKey === typeFilter.toLowerCase();

      // 🧩 HOME TAG (botones de abajo)
      const matchesHomeTag =
        !homeTagFilter || p.home_tag === homeTagFilter;

      // 🏷️ Marca (botones de arriba)
      // 👉 SOLO se aplica si NO hay homeTag activo
      const matchesBrand =
        homeTagFilter
          ? true
          : brandFilter === "all" ||
            (brandFilter === "bath" && brand.includes("bath")) ||
            (brandFilter === "victoria" && brand.includes("victoria"));

      return (
        matchesSearch &&
        matchesType &&
        matchesHomeTag &&
        matchesBrand
      );
    });
  }, [
    viewProducts,
    search,
    brandFilter,
    typeFilter,
    homeTagFilter,
  ]);

  /* ============================= */
  /*  TRACK SEARCH  */
  /* ============================= */
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    const q = search.trim();
    if (!q) return; // 👈 evita trackear búsquedas vacías

    searchTimeout.current = setTimeout(() => {
      trackSearch(q, filteredProducts.length);
    }, 700);

    return () => clearTimeout(searchTimeout.current);
  }, [search, filteredProducts.length]);

  useEffect(() => {
    let fired = false;

    const run = () => {
      if (fired) return;
      fired = true;
      trackPageView("/", null, null);
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(run, { timeout: 2000 });
    } else {
      setTimeout(run, 1500);
    }
  }, []);

  /* ============================= */
  /* UI */
  /* ============================= */
  return (
    <>
      <SEO
        title="Perfumes, Splash y Cremas Originales en República Dominicana | MC Beauty & Fragrance"
        description="Compra perfumes, splash (body mist) y cremas corporales (body cream) 100% originales en República Dominicana. Pago contra entrega, atención directa por WhatsApp y entregas rápidas en Santo Domingo y todo el país."
        canonical="https://mcbeautyfragrance.com/"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "MC Beauty & Fragrance",
            "url": "https://mcbeautyfragrance.com/",
            "logo": "https://mcbeautyfragrance.com/logo.png",
            "description":
              "Tienda online de perfumes, body mist (splash) y cremas corporales 100% originales en República Dominicana. Pago contra entrega y atención directa por WhatsApp.",
            "sameAs": [
              "https://www.instagram.com/mcbeautyfragrance",
              "https://www.facebook.com/share/1KHhnAs4g1/",
              "https://www.tiktok.com/@mcbeautyfragrance",
              "https://wa.me/18297283652"
            ],
            "areaServed": {
              "@type": "Country",
              "name": "República Dominicana"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+1-829-728-3652",
              "contactType": "customer service",
              "availableLanguage": ["Spanish"]
            }
          })
        }}
      />

      {/* ================= HERO ================= */}
      <section className="home-hero">
        <img
          src={hero.image}
          alt="MC Beauty & Fragrance"
          className="home-hero-img"
          loading="eager"
          fetchpriority="high"
          width="1200"
          height="800"
        />

        <div className="home-hero-cta">
          <h1>{hero.title}</h1>
          <p>{hero.subtitle}</p>

          <button
            className="home-hero-btn"
            aria-label="Ver catálogo de productos"
            onClick={() => catalogRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            🟢 {hero.cta}
          </button>
        </div>
      </section>

      {/* ================= SEARCH & FILTERS ================= */}
      <section className="home-filters-section">
        <label htmlFor="search-input" className="sr-only">
          Buscar productos
        </label>

        <input
          id="search-input"
          type="text"
          placeholder="Buscar perfumes, aromas, marcas…"
          aria-label="Buscar productos en el catálogo"
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

        {/* BOTONES SOLO SI EXISTEN */}
        {visibleButtons.length > 0 && (
          <div className="home-filters">
            <button
              className={`home-pill-filter ${!homeTagFilter ? "active" : ""}`}
              onClick={() => {
                setHomeTagFilter(null);
                setBrandFilter("all");
                setTypeFilter(null);
              }}
            >
              Todos
            </button>

            {visibleButtons.map((section) => (
              <button
                key={section.id}
                className={`home-pill-filter ${
                  homeTagFilter === section.filter_value ? "active" : ""
                }`}
                onClick={() => {
                  setHomeTagFilter(section.filter_value);
                  setBrandFilter("all");
                  setTypeFilter(null);
                }}
              >
                {section.title}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ================= SECCIONES DINÁMICAS (EDITORIAL HOME) ================= */}
      {visibleSections
        .filter(section => {
          const products = getProductsForSection(section, viewProducts);
          return products.length > 0;
        })
        .map(section => {
          const sectionProducts = getProductsForSection(section, viewProducts);

          return (
            <section key={section.id} className="home-dynamic-section">
            <h2 className="home-section-title">{section.title}</h2>

            <div className="home-products-grid">
              {sectionProducts.slice(0, 6).map((p) => (
                <article
                  key={p.id}
                  className="home-product-card"
                  onClick={() => navigate(`/product/${p.slug}`)}
                >
                  <div className="home-product-img-wrapper">
                    <img
                      src={p.image_url || "/placeholder.png"}
                      alt={p.name}
                      className="home-product-img"
                      loading="lazy"
                      decoding="async"
                      width="300"
                      height="375"
                    />
                  </div>

                  <h3 className="home-product-name">{p.name}</h3>

                  <div className="home-product-meta">
                    <span className="brand">{p.brandName}</span>
                    <span className="dot">·</span>
                    <span className="type">{p.typeName}</span>
                  </div>

                  <div className="home-product-price">
                    {moneyRD(p.price)}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {/* ================= CATALOG ================= */}
      <section ref={catalogRef} className="home-products-section">
        <h2 className="home-section-title">Catálogo</h2>

        {loading && <p>Cargando productos...</p>}
        {!loading && filteredProducts.length === 0 && (
          <p>No hay productos que coincidan</p>
        )}
        

        {/* ================= GRID ================= */}
        <div className="home-products-grid">
          {filteredProducts.map((p) => {
            const brand = p.brandName || "—";
            const type = p.typeName || "—";

            return (
              <article
                key={p.id}
                className="home-product-card"
                onClick={() => navigate(`/product/${p.slug}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="home-product-img-wrapper">
                  <img
                    src={p.image_url || "/placeholder.png"}
                    alt={p.name}
                    className="home-product-img"
                    loading="lazy"
                    decoding="async"
                    width="300"
                    height="375"
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
                      inputMode="numeric"
                      value={getQty(p.id)}
                      aria-label="Cantidad del producto"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => changeQty(p.id, e.target.value)}
                    />

                    <button
                      className="btn-add"
                      aria-label={`Añadir ${p.name} al carrito`}
                      onClick={(e) => {
                        e.stopPropagation();
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
                aria-label={`Cantidad de ${item.name}`}
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
      {/* ================= SEO CONTENT (HOME) ================= */}
      <section className="home-seo-wrapper">
        <div className="home-seo-content">
          <h2>Perfumes, splash y cremas corporales originales en República Dominicana</h2>

          <p>
            En <strong>MC Beauty & Fragrance</strong> ofrecemos una selección de perfumes,
            splash (body mist) y cremas corporales (body cream) 100% originales en
            República Dominicana. Trabajamos con marcas reconocidas como Bath & Body Works
            y Victoria’s Secret, ideales para uso diario y ocasiones especiales.
          </p>

          <p>
            Realiza tu compra de forma fácil y segura con pago contra entrega y atención
            directa por WhatsApp. Entregamos en Santo Domingo y otras zonas del país.
          </p>

          <h3>¿Por qué comprar perfumes y cremas en MC Beauty & Fragrance?</h3>

          <ul>
            <li>✔ Productos 100% originales garantizados</li>
            <li>✔ Pago contra entrega en República Dominicana</li>
            <li>✔ Atención rápida y personalizada por WhatsApp</li>
            <li>✔ Entrega segura, rápida y confiable</li>
          </ul>
        </div>
      </section>
      
      {/* ================= INTERNAL LINKS (SEO) ================= */}
      <section className="home-links-wrapper">
        <div className="home-internal-links">
          <h3>Explora nuestros productos más buscados</h3>

          <ul>
            <li>
              <Link to="/" title="Perfumes originales en República Dominicana">
                Perfumes originales en República Dominicana
              </Link>
            </li>
            <li>
              <Link to="/" title="Body mist (Splash) originales en RD">
                Body mist (splash) originales
              </Link>
            </li>
            <li>
              <Link to="/" title="Body cream y body lotion (Cremas corporales) originales">
                 Body cream (Cremas corporales)
              </Link>
            </li>
            <li>
              <Link to="/" title="Productos Bath & Body Works en República Dominicana">
                Bath & Body Works en República Dominicana
              </Link>
            </li>
            <li>
              <Link to="/" title="Victoria’s Secret perfumes y cremas">
                Victoria’s Secret perfumes y cremas
              </Link>
            </li>
          </ul>
        </div>    
      </section>

      <Footer />
    </>
  );
}