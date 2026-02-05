// src/pages/Product.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { loadPublicProductBySlug } from "../services/productService";
import { trackPageView } from "../services/analyticsService";
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

export default function Product() {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

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

        trackPageView(
          `/product/${found.slug}`,
          "product",
          found.id
        );
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

  return (
    <>
      {/* ================= SEO ================= */}
      <SEO
        title={`${name}${typeName ? ` | ${typeName}` : ""} ${brandName ? `| ${brandName}` : ""} en República Dominicana | MC Beauty & Fragrance`}
        description={`Compra ${name}${typeName ? ` (${typeName})` : ""} de ${brandName || "marca original"} en República Dominicana. Aroma ${aromaName || "exclusivo"}, ideal para ${audience || "uso diario"}. Producto 100% original, pago contra entrega y envío rápido.`}
        image={image_url || "https://mcbeautyfragrance.com/banner.png"}
        canonical={`https://mcbeautyfragrance.com/product/${slug}`}
      />
      <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": name,
        "image": image_url
          ? [image_url]
          : ["https://mcbeautyfragrance.com/banner.png"],
        "description": description || notes || name,
        "sku": id,
        "brand": {
          "@type": "Brand",
          "name": brandName || "MC Beauty & Fragrance"
        },
        "category": typeName || "Producto",
        "offers": {
          "@type": "Offer",
          "url": `https://mcbeautyfragrance.com/product/${slug}`,
          "priceCurrency": "DOP",
          "price": price,
          "availability":
            stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          "itemCondition": "https://schema.org/NewCondition"
        }
      })}
      </script>

      {/* ================= PRODUCT ================= */}
      <div className="product-page">
        <div className="product-detail-card">

          <div className="product-detail-imageWrap">
            <img
              src={image_url || "/placeholder.png"}
              alt={name}
              className="product-detail-image"
            />
          </div>

          <div className="product-detail-info">
            <h1 className="product-detail-title">{name}</h1>

            <div className="product-detail-meta">
              <span className="brand">{brandName || "—"}</span>
              <span className="dot">·</span>
              <span className="type">{typeName || "—"}</span>
            </div>

            {aromaName && (
              <div className="product-detail-aroma">
                Aroma: {aromaName}
              </div>
            )}

            {audience && (
              <div className="product-detail-audience">
                {audience === "mujer" && "Mujer"}
                {audience === "hombre" && "Hombre"}
                {audience === "unisex" && "Unisex"}
                {audience === "nino" && "Niños"}
              </div>
            )}

            {description && (
              <p className="product-detail-desc">{description}</p>
            )}

            {notes && (
              <div className="product-detail-notes">
                <div className="product-detail-notesTitle">
                  Notas / Ingredientes
                </div>
                <div className="product-detail-notesText">{notes}</div>
              </div>
            )}

            <div className="product-detail-actions">
              <div className="product-detail-price">
                {moneyRD(price)}
              </div>

              {stock <= 0 ? (
                <div className="badge-out">Agotado</div>
              ) : (
                <div className="product-detail-buyRow">
                  <select
                    className="product-detail-qty"
                    value={qty}
                    onChange={(e) => setQty(clampQty(e.target.value))}
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                      <option key={n} value={n}>{n}</option>
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
            {name} de {brandName || "una marca reconocida"} es un{" "}
            {typeName || "producto"}{" "}
            {typeName?.toLowerCase().includes("mist") ||
            typeName?.toLowerCase().includes("splash")
              ? "(body mist o splash)"
              : typeName?.toLowerCase().includes("cream") ||
                typeName?.toLowerCase().includes("crema")
              ? "(crema corporal) "
              : ""}
            diseñado para{" "}
            {audience === "mujer"
              ? "mujeres"
              : audience === "hombre"
              ? "hombres"
              : "todo público"}.
            Su aroma {aromaName || "especial"} lo hace ideal para el uso diario
            y ocasiones especiales en República Dominicana.
          </p>

          <h3>¿Por qué comprar {name} en MC Beauty & Fragrance?</h3>

          <ul>
            <li>✔ Producto 100% original garantizado</li>
            <li>✔ Pago contra entrega en República Dominicana</li>
            <li>✔ Atención directa y rápida por WhatsApp</li>
            <li>✔ Entrega segura y confiable</li>
          </ul>
        </section>
      </div>
    </>
  );
}