// src/pages/Category.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";
import "../home.css";
import "../product.css";
import { loadPublicProducts } from "../services/productService";
import { trackPageView } from "../services/pageViewService";
import { adaptProductForCard } from "../utils/productViewAdapter";
import { useParams, useNavigate } from "react-router-dom";

function moneyRD(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `RD$${n.toFixed(2)}` : "RD$0.00";
}

function clampQty(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(10, Math.trunc(n)));
}


export default function Category() {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [selectedQty, setSelectedQty] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const navigate = useNavigate();

  const viewProducts = useMemo(
    () => products.map(adaptProductForCard),
    [products]
  );

  const filteredByCategory = useMemo(() => {
    if (!slug) return viewProducts;

    const s = slug.toLowerCase();

    const TYPE_SYNONYMS = {
      crema: ["crema", "cream", "body cream", "bodycream", "lotion", "body lotion"],
      splash: ["splash", "mist", "body mist", "bodymist"],
      perfume: ["perfume", "parfum"],
    };

    function normalizeTypeForFilter(typeName = "") {
      const t = String(typeName).toLowerCase().trim().replace(/\s+/g, " ");

      for (const [key, list] of Object.entries(TYPE_SYNONYMS)) {
        if (
          list.some(
            (s) =>
              String(s).toLowerCase().trim().replace(/\s+/g, " ") === t
          )
        ) {
          return key; // crema | splash | perfume
        }
      }

      return null;
}

    // ---- público ----
    const audienceSlugs = ["mujer", "hombre", "unisex", "nino", "ninos", "niño", "niños"];

    if (audienceSlugs.includes(s)) {
      const aud = s === "ninos" || s === "niños" || s === "niño" ? "nino" : s;
      return viewProducts.filter(p => p.audience === aud);
    }

    // ---- tipo ----
    if (["perfume", "splash", "crema", "set", "sets"].includes(s)) {
      const typeKey = s === "sets" ? "set" : s;

      return viewProducts.filter(p => {
        const normalized = normalizeTypeForFilter(p.typeName);
        return normalized === typeKey;
      });
    }

    return viewProducts;
  }, [viewProducts, slug]);

  const title = useMemo(() => {
    if (!slug) return "Categoría";
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  }, [slug]);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      setLoading(true);

      const s = String(slug || "").toLowerCase().trim();

      const audienceSlugs = new Set([
        "mujer",
        "hombre",
        "unisex",
        "ninos",
        "nino",
        "niños",
        "niño",
      ]);

      let audience = null;
      let typeKey = null;

      if (audienceSlugs.has(s)) {
        audience =
          s === "ninos" || s === "niños" || s === "niño" ? "nino" : s;
      }

      const TYPE_SLUG_MAP = {
        perfume: "perfume",
        splash: "splash",
        crema: "crema",
        sets: "set",     // 🔥 clave
        set: "set",
      };

      if (TYPE_SLUG_MAP[s]) {
        typeKey = TYPE_SLUG_MAP[s];
      }

      try {
        const data = await loadPublicProducts({
          activeOnly: true,
          audience,
        
          limit: 300,
          offset: 0,
        });

        if (!mounted) return;
        setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    boot();
    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    trackPageView(
      `/category/${slug}`,
      "category",
      slug
    );
  }, [slug]);

  

  function getQty(id) {
    return selectedQty[id] || 1;
  }

  function handleQtyChange(id, value) {
    const qty = clampQty(value);
    setSelectedQty((prev) => ({ ...prev, [id]: qty }));
  }

  function handleAdd(product) {
    addToCart(
      {
        id: product.id,
        name: product.name,
        brand: product.brandName || "—",
        price: Number(product.price || 0),
        image: product.image_url,
        type: product.typeName || "—",
        audience: product.audience,
      },
      getQty(product.id)
    );

    setToast("Producto agregado al carrito 🛒");
    setTimeout(() => setToast(""), 1500);
  }

  return (
    <section className="home-products-section">
      <h2 className="home-section-title">{title}</h2>

      {loading && <p>Cargando productos...</p>}
      {!loading && filteredByCategory.length === 0 && <p>No hay productos en esta categoría</p>}

      <div className="home-products-grid">
        {filteredByCategory.map((p) => (
          <article
            key={p.id}
            className="home-product-card"
            onClick={() => navigate(`/product/${p.id}`)}
            style={{ cursor: "pointer" }}
          >
            {/* Imagen */}
            <div className="home-product-img-wrapper">
              <img
                src={p.image_url || "/placeholder.png"}
                alt={p.name}
                className="home-product-img"
              />
            </div>

            {/* Vendidos */}
            {p.show_sold_count && <div className="badge-sold">Vendidos {p.sold_count}</div>}

            {/* Nombre */}
            <h3 className="home-product-name">{p.name}</h3>

            {/* ✅ Marca · Tipo */}
            <div className="home-product-meta">
              <span className="brand">{p.brandName || "—"}</span>
              <span className="dot">·</span>
              <span className="type">{p.typeName || "—"}</span>
            </div>

            {p.audience && (
              <div className="home-product-audience">
                {p.audience === "mujer" && "Mujer"}
                {p.audience === "hombre" && "Hombre"}
                {p.audience === "unisex" && "Unisex"}
                {p.audience === "nino" && "Niños"}
              </div>
            )}

            {/* ✅ Notas / descripción */}
            {p.description && <div className="home-desc" title={p.description}>{p.description}</div>}
            {p.notes && <div className="home-product-notes">{p.notes}</div>}

            {/* Precio */}
            <div className="home-product-price">{moneyRD(p.price)}</div>

            {/* Stock */}
            {Number(p.stock || 0) <= 0 ? (
              <div className="badge-out">Agotado</div>
            ) : (
              <>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={getQty(p.id)}
                  onChange={(e) => handleQtyChange(p.id, e.target.value)}
                />
                <button className="btn-add" onClick={() => handleAdd(p)}>
                  🛒 Añadir
                </button>
              </>
            )}
          </article>
        ))}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </section>
  );
}