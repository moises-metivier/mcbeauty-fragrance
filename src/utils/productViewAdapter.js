// src/utils/productViewAdapter.js
export function adaptProductForCard(p) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    image_url: p.image_url,
    stock: p.stock,
    sold_count: p.sold_count,
    show_sold_count: p.show_sold_count,

    // 👉 mostramos EXACTAMENTE lo que viene de la BD
    brandName: p.brandName || p.brands?.name || "",
    typeName: p.typeName || p.product_types?.name || "",

    description: p.description,
    notes: p.notes,
    audience: p.audience,
  };
}