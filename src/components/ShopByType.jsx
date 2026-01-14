import React from "react";
import { useNavigate } from "react-router-dom";
import "./shopByType.css";

export default function ShopByType() {
  const navigate = useNavigate();

  const items = [
    { label: "Perfumes", value: "perfume", icon: "💎" },
    { label: "Splash", value: "splash", icon: "🌸" },
    { label: "Cremas", value: "crema", icon: "🧴" },
    { label: "Sets", value: "set", icon: "🎁" },
  ];

  return (
    <section className="shop-type-section">
      <h2 className="shop-type-title">Compra por tipo</h2>

      <div className="shop-type-grid">
        {items.map((item) => (
          <button
            key={item.value}
            className="shop-type-card"
            onClick={() => navigate(`/?type=${item.value}`)}
          >
            <span className="shop-type-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}