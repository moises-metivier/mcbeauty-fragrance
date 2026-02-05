// src/utils/productViewAdapter.js
export function adaptProductForCard(p) {
  return {
    id: p.id,
    slug: p.slug, // ✅ CLAVE ABSOLUTA (ESTO ARREGLA TODO)

    name: p.name,
    price: p.price,
    image_url: p.image_url,
    stock: p.stock,

    sold_count: p.sold_count,
    show_sold_count: p.show_sold_count,

    // mostramos exactamente lo que viene normalizado del service
    brandName: p.brandName || p.brands?.name || "",
    typeName: p.typeName || p.product_types?.name || "",
    aromaName: p.aromaName || p.aromas?.name || "",

    description: p.description,
    notes: p.notes,
    audience: p.audience,
  };
}