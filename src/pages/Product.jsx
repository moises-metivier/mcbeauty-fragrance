// src/pages/Product.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
//import { loadPublicProducts } from "../services/productService";
import { loadPublicProductById } from "../services/productService";
import { trackPageView } from "../services/analyticsService";// ✅ NUEVO
import "../product.css";
import SEO from "../components/SEO";


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
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  async function loadProduct() {
    setLoading(true);

    try {
      const found = await 
      loadPublicProductById(id);
      setProduct(found);

      // 📊 Registrar vista (personas reales se calculan desde page_views)
      if (found?.id) {
        trackPageView(
          `/product/${found.id}`,
          "product",
          found.id
        );
      }
    } catch (e) {
      console.error("Error cargando producto:", e);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }

  loadProduct();
}, [id]);

  if (loading) return <p>Cargando producto...</p>;
  if (!product) return <p>Producto no encontrado</p>;

  const {
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
      <SEO
        title={`${name} ${brandName ? `| ${brandName}` : ""} en RD | MC Beauty & Fragrance`}
        description={`Compra ${name}${brandName ? ` de ${brandName}` : ""} en República Dominicana. Producto original, pago contra entrega y atención directa por WhatsApp.`}
        image={image_url || "https://mcbeautyfragrance.com/banner.png"}
        canonical={`https://mcbeautyfragrance.com/product/${id}`}
      />

    <div className="product-page">
      <div className="product-detail-card">

        {/* Imagen */}
        <div className="product-detail-imageWrap">
          <img
            src={image_url || "/placeholder.png"}
            alt={name}
            className="product-detail-image"
          />
        </div>

        {/* Info */}
        <div className="product-detail-info">
          <h1 className="product-detail-title">{name}</h1>

          {/* Marca + Tipo */}
          <div className="product-detail-meta">
            <span className="brand">{brandName || "—"}</span>
            <span className="dot">·</span>
            <span className="type">{typeName || "—"}</span>
          </div>

          {/* Aroma */}
          {aromaName && (
            <div className="product-detail-aroma">
              Aroma: {aromaName}
            </div>
          )}

          {/* Público */}
          {audience && (
            <div className="product-detail-audience">
              {audience === "mujer" && "Mujer"}
              {audience === "hombre" && "Hombre"}
              {audience === "unisex" && "Unisex"}
              {audience === "nino" && "Niños"}
            </div>
          )}

          {/* Descripción */}
          {description && (
            <p className="product-detail-desc">{description}</p>
          )}

          {/* Notes */}
          {notes && (
            <div className="product-detail-notes">
              <div className="product-detail-notesTitle">
                Notas / Ingredientes
              </div>
              <div className="product-detail-notesText">
                {notes}
              </div>
            </div>
          )}

          {/* Precio + acciones */}
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
                        id: product.id,
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

                {/* LINK DE VOLVER */}
                <Link to="/" className="product-detail-backBtn">
                  ← Volver al catálogo
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);
}