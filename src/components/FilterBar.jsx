// src/componenst/FilterBar.jsx
import React from "react";

const filters = [
  { id: "todos", label: "Todos" },
  { id: "dulce", label: "Dulces" },
  { id: "amaderado", label: "Amaderados" },
  { id: "floral", label: "Florales" },
  { id: "frutal", label: "Frutales" },
  { id: "fresco", label: "Frescos" },
  { id: "otros", label: "Otros" },
  { id: "combos", label: "Combos" },
];

function FilterBar({ activeFilter, onChange }) {
  return (
    <div
      style={{
        marginTop: "10px",
        marginBottom: "15px",
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
      }}
    >
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          style={{
            padding: "6px 12px",
            borderRadius: "20px",
            border: "1px solid #ccc",
            background: activeFilter === f.id ? "#c0392b" : "#fff",
            color: activeFilter === f.id ? "#fff" : "#333",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

export default FilterBar;
