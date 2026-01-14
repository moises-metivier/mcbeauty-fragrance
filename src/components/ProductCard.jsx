// src/components/ProductCard.jsx
import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  if (!product?.active) return null;

  return (
    <Link
      to={`/product/${product.id}`}
      className="product-card-link"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="product-card">
        <img
          src={product.image_url || "/placeholder.png"}
          alt={product.name}
          className="product-image"
        />

        <h3>{product.name}</h3>

        <p className="category">
          {product.brand} · {product.type}
        </p>

        {product.stock === 0 ? (
          <p className="sold-out">AGOTADO</p>
        ) : (
          <p className="price">RD$ {product.price}</p>
        )}

        <span className="view-detail-btn">
          Ver detalle
        </span>
      </div>
    </Link>
  );
}