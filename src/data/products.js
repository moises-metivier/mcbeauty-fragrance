// src/data/products.js

const products = [
  {
    id: 1,
    name: "A Thousand Wishes - Crema",
    brand: "Bath & Body Works",
    type: "Crema",
    aroma: "dulce",
    price: 750,
    description: "Aroma dulce y especial, ideal para ocasiones especiales.",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=500&q=60",
    status: "in",   // in = disponible, out = agotado
    visible: true,
  },
  {
    id: 2,
    name: "Into The Night - Splash",
    brand: "Bath & Body Works",
    type: "Splash",
    aroma: "amaderado",
    price: 690,
    description: "Aroma amaderado, sofisticado y nocturno.",
    image:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=500&q=60",
    status: "out",
    visible: true,
  },
  {
    id: 3,
    name: "Pure Seduction - Splash",
    brand: "Victoria's Secret",
    type: "Splash",
    aroma: "dulce",
    price: 690,
    description: "Dulce, frutal y juvenil. Muy popular.",
    image:
      "https://images.unsplash.com/photo-1515548212633-6f40b3b2415e?auto=format&fit=crop&w=500&q=60",
    status: "in",
    visible: true,
  },
  {
    id: 4,
    name: "Gingham - Crema",
    brand: "Bath & Body Works",
    type: "Crema",
    aroma: "fresco",
    price: 720,
    description: "Aroma limpio y fresco, perfecto para el día a día.",
    image:
      "https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=500&q=60",
    status: "in",
    visible: true,
  },
  {
    id: 5,
    name: "Love Spell - Splash",
    brand: "Victoria's Secret",
    type: "Splash",
    aroma: "frutal",
    price: 690,
    description: "Frutal y encantador, clásico de Victoria's Secret.",
    image:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=500&q=60",
    status: "in",
    visible: true,
  },
];

export default products;
