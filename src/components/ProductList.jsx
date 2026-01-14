//src/components/ProductList.jsx
import ProductCard from "./ProductCard";

export default function ProductList({ products }) {
  return (
    <div className="product-grid">
      {products.length === 0 ? (
        <p>No hay productos disponibles.</p>
      ) : (
        products.map((p, i) => <ProductCard key={i} product={p} />)
      )}
    </div>
  );
}
