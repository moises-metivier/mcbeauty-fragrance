// src/pages/Product.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { loadPublicProductBySlug } from "../services/productService";
import { trackPageView } from "../services/analyticsService";
import { supabase } from "../lib/supabaseClient";
import SEO from "../components/SEO";
import "../product.css";

function moneyRD(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `RD$${n.toFixed(2)}` : "RD$0.00";
}

function clampQty(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(10, Math.trunc(n)));
}

/** ================================
 * Helpers para texto dinámico (NO rompe clases)
 * ================================ */
function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function isAromaProduct({ typeName, aromaName }) {
  // Si tiene aromaName, lo tratamos como producto de fragancia/aroma
  if (aromaName) return true;

  const t = norm(typeName);

  // Tipos que normalmente son de fragancia/aroma
  const aromaTypes = [
    "perfume",
    "splash",
    "body mist",
    "mist",
    "body spray",
    "spray",
    "body cream",
    "cream",
    "crema",
    "body lotion",
    "lotion",
    "body wash",
    "jabón",
    "jabon",
    "cosmetico",
    "cosmético",
    "tratamiento_capilar",
  ];

  return aromaTypes.some((k) => t.includes(k));
}

function getAudienceLabel(audience) {
  const a = norm(audience);
  if (a === "mujer") return "mujeres";
  if (a === "hombre") return "hombres";
  if (a === "hogar") return "hogar";
  if (a === "unisex") return "todo público";
  if (a === "nino" || a === "niño" || a === "ninos" || a === "niños") return "niños";
  return "todo público";
}

function getTypeHint(typeName) {
  const t = norm(typeName);

  if (t.includes("mist") || t.includes("splash")) return "(body mist o splash)";
  if (t.includes("cream") || t.includes("crema")) return "(crema corporal)";
  if (t.includes("lotion")) return "(loción corporal)";
  if (t.includes("perfume")) return "(perfume)";
  if (t.includes("body wash") || t.includes("jabon") || t.includes("jabón")) return "(cuidado corporal)";
  if (t.includes("ropa")) return "(ropa)";
  if (t.includes("tenis") || t.includes("zapatos")) return "(calzado)";
  if (t.includes("reloj")) return "(reloj)";
  if (t.includes("accesorio")) return "(accesorio)";
  return "";
}

function buildSeoDescription({ name, typeName, brandName, aromaName, audience }) {
  const isAroma = isAromaProduct({ typeName, aromaName });
  const aud = getAudienceLabel(audience);

  if (isAroma) {
    return `Compra ${name}${typeName ? ` (${typeName})` : ""} de ${brandName || "marca original"} en República Dominicana. Aroma ${
      aromaName || "exclusivo"
    }, ideal para ${aud}. Producto 100% original, pago contra entrega y entrega rápida.`;
  }

  // Para ropa/accesorios/otros: sin “aroma”
  return `Compra ${name}${typeName ? ` (${typeName})` : ""} en República Dominicana. Ideal para ${aud}. Producto original, pago contra entrega y entrega rápida.`;
}

function buildAboutParagraph({ name, brandName, typeName, aromaName, audience }) {
  const isAroma = isAromaProduct({ typeName, aromaName });
  const aud = getAudienceLabel(audience);
  const hint = getTypeHint(typeName);
  const brandText = brandName || "una marca reconocida";
  const typeText = typeName || "producto";

  if (isAroma) {
    return (
      <>
        {name} de {brandText} es un {typeText} {hint ? `${hint} ` : ""}
        diseñado para {aud}. Su aroma {aromaName || "especial"} lo hace ideal para el uso
        diario y ocasiones especiales en República Dominicana.
      </>
    );
  }

  // Para NO-aroma (ropa, accesorios, etc.)
  return (
    <>
      {name} de {brandText} es un {typeText} {hint ? `${hint} ` : ""}
      diseñado para {aud}. Ideal para uso diario y para complementar tu estilo en República Dominicana.
    </>
  );
}



function buildWhyBuyList({ typeName, aromaName }) {
  const isAroma = isAromaProduct({ typeName, aromaName });

  // Mantenemos 4 bullets (igual que tú) pero adaptados
  if (isAroma) {
    return [
      "✔ Producto 100% original garantizado",
      "✔ Entregas rápidas en toda República Dominicana",
      "✔ Pago seguro por transferencia bancaria antes del envío",
      "✔ Atención directa y rápida por WhatsApp",
      "✔ Entrega segura y confiable",
    ];
  }

  return [
    "✔ Producto original y verificado",
    "✔ Entregas rápidas en toda República Dominicana",
    "✔ Pago seguro por transferencia bancaria antes del envío",
    "✔ Atención directa y rápida por WhatsApp",
    "✔ Entrega segura y confiable",
  ];
}

export default function Product() {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState([]);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  useEffect(() => {
    setMediaIndex(0);
  }, [slug]);

  const SWIPE_THRESHOLD = 50; // píxeles mínimos para considerar swipe

  function nextMedia() {
    setMediaIndex((prev) => (prev + 1) % mediaList.length);
  }

  function prevMedia() {
    setMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  }


  function handleTouchStart(e) {
    setTouchEndX(null);
    setTouchStartX(e.touches[0].clientX);
  }

  function handleTouchMove(e) {
    setTouchEndX(e.touches[0].clientX);
  }

  function handleTouchEnd() {
    if (touchStartX === null || touchEndX === null) return;

    const distance = touchStartX - touchEndX;

    if (distance > SWIPE_THRESHOLD) {
      // swipe izquierda → siguiente
      nextMedia();
    }

    if (distance < -SWIPE_THRESHOLD) {
      // swipe derecha → anterior
      prevMedia();
    }
  }

  useEffect(() => {
    let alive = true;

    async function loadProduct() {
      setLoading(true);
      try {
        const found = await loadPublicProductBySlug(slug);
        if (!alive) return;

        if (!found) {
          setProduct(null);
          return;
        }

        setProduct(found);

        // cargar media extra (fotos / videos)
        const { data: mediaRows } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", found.id)
          .order("position");

        setMedia(mediaRows || []);

        trackPageView(`/product/${found.slug}`, "product", found.id);
      } catch (e) {
        console.error("Error cargando producto:", e);
        if (alive) setProduct(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadProduct();
    return () => (alive = false);
  }, [slug]);

  if (loading) return <p>Cargando producto...</p>;
  if (!product) return <p>Producto no encontrado</p>;

  const {
    id,
    name,
    brandName,
    typeName,
    aromaName,
    description,
    notes,
    price,
    stock,
    image_url,
    audience,
  } = product;

  const mediaList = [
    ...(image_url
      ? [{ media_type: "image", image_url }]
      : []),
    ...media.filter(m => m.image_url !== image_url)
  ];

  

  const seoDescription = buildSeoDescription({
    name,
    typeName,
    brandName,
    aromaName,
    audience,
  });

  const whyBuyBullets = buildWhyBuyList({ typeName, aromaName });

  return (
    <>
      {/* ================= SEO ================= */}
      <SEO
        title={`${name}${typeName ? ` | ${typeName}` : ""}${
          brandName ? ` | ${brandName}` : ""
        } en República Dominicana | MC Beauty & Fragrance`}
        description={seoDescription}
        image={image_url || "https://mcbeautyfragrance.com/banner.webp"}
        canonical={`https://mcbeautyfragrance.com/product/${slug}`}
      />

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: name,
          image: image_url ? [image_url] : ["https://mcbeautyfragrance.com/banner.webp"],
          description: description || notes || name,
          sku: id,
          brand: {
            "@type": "Brand",
            name: brandName || "MC Beauty & Fragrance",
          },
          category: typeName || "Producto",
          offers: {
            "@type": "Offer",
            url: `https://mcbeautyfragrance.com/product/${slug}`,
            priceCurrency: "DOP",
            price: price,
            availability:
              stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
          },
        })}
      </script>

      {/* ================= PRODUCT ================= */}
      <div className="product-page">
        <div className="product-detail-card">
          <div className="product-detail-imageWrap">
            <div
              className="product-gallery"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >

              {mediaList.length > 1 && (
                <button className="gallery-arrow left" onClick={prevMedia}>
                  ‹
                </button>
              )}

              {mediaList.length > 0 && (() => {
                const m = mediaList[mediaIndex % mediaList.length];

                if (m.media_type === "video") {
                  return (
                    <video
                      src={m.image_url}
                      className="product-detail-image"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  );
                }

                return (
                  <img
                    src={m.image_url}
                    alt={name}
                    className="product-detail-image"
                  />
                );
              })()}

              {mediaList.length > 1 && (
                <button className="gallery-arrow right" onClick={nextMedia}>
                  ›
                </button>
              )}

            </div>
          </div>

          <div className="product-detail-info">
            <h1 className="product-detail-title">{name}</h1>

            <div className="product-detail-meta">
              <span className="brand">{brandName || "—"}</span>
              <span className="dot">·</span>
              <span className="type">{typeName || "—"}</span>
            </div>

            {aromaName && (
              <div className="product-detail-aroma">Aroma: {aromaName}</div>
            )}

            {audience && (
              <div className="product-detail-audience">
                {(audience === "mujer" && "Mujer") ||
                  (audience === "hombre" && "Hombre") ||
                  (audience === "unisex" && "Unisex") ||
                  (audience === "hogar" && "Hogar") ||
                  ((audience === "nino" || audience === "ninos") && "Niños")}
              </div>
            )}

            {description && <p className="product-detail-desc">{description}</p>}

            {notes && (
              <div className="product-detail-notes">
                <div className="product-detail-notesTitle">Notas / Ingredientes</div>
                <div className="product-detail-notesText">{notes}</div>
              </div>
            )}

            <div className="product-detail-actions">
              <div className="product-detail-price">{moneyRD(price)}</div>

              {stock <= 0 ? (
                <div className="badge-out">Agotado</div>
              ) : (
                <div className="product-detail-buyRow">
                  <select
                    className="product-detail-qty"
                    value={qty}
                    onChange={(e) => setQty(clampQty(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>

                  <button
                    className="product-detail-addBtn"
                    onClick={() =>
                      addToCart(
                        {
                          id,
                          name,
                          brand: brandName,
                          type: typeName,
                          audience,
                          price,
                          image: image_url,
                        },
                        qty
                      )
                    }
                  >
                    🛒 Agregar al carrito
                  </button>

                  <Link to="/" className="product-detail-backBtn">
                    ← Volver al catálogo
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= SEO CONTENT ================= */}
        <section className="product-seo-content">
          <h2>Sobre {name}</h2>

          <p>
            {buildAboutParagraph({
              name,
              brandName,
              typeName,
              aromaName,
              audience,
            })}
          </p>

          <h3>¿Por qué comprar {name} en MC Beauty & Fragrance?</h3>

          <ul>
            {whyBuyBullets.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}