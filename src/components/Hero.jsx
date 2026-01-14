import React from "react";

function Hero() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "40px 20px",
        background: "linear-gradient(to right, #ffe9f0, #fff)",
        borderRadius: "12px",
        marginTop: "20px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
      }}
    >
      {/* Texto */}
      <div style={{ maxWidth: "50%" }}>
        <h1 style={{ fontSize: "2.2rem", marginBottom: "10px" }}>
          Bienvenido a MC Beauty & Fragrance
        </h1>

        <p style={{ fontSize: "1rem", color: "#444", marginBottom: "20px" }}>
          Fragancias, cremas, splash y belleza premium en un solo lugar.
        </p>

        <a
          href="#catalogo"
          style={{
            background: "#c0392b",
            padding: "12px 20px",
            color: "white",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "1rem",
          }}
        >
          Ver Catálogo
        </a>
      </div>

      {/* Imagen */}
      <img
        src="https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=500&q=60"
        alt="Fragancias"
        style={{
          width: "45%",
          borderRadius: "14px",
          boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
        }}
      />
    </div>
  );
}

export default Hero;
