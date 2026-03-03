import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

function CartIcon({ size = 22, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6.5 6.5H21l-1.6 8.2a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.6L5.2 3.8H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 20.2a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0ZM18.5 20.2a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { cartCount } = useCart();

  const [openMenu, setOpenMenu] = useState(null);

  const open = (menu) => setOpenMenu(menu);
  const close = () => setOpenMenu(null);

  return (
    <header className="navbar" onClick={close}>
      {/* CONTENEDOR CENTRADO */}
      <div className="navbar-inner">
        {/* LOGO */}
        <div
          className="navbar-left"
          onClick={(e) => {
            e.stopPropagation();
            navigate("/");
          }}
          role="button"
        >
          <img
            src="/logo.png"
            alt="MC Beauty & Fragrance"
            className="navbar-logo"
          />
          <span className="navbar-brand">MC Beauty & Fragrance</span>
        </div>

        {/* LINKS */}
        <nav className="navbar-center" onClick={(e) => e.stopPropagation()}>
          <NavLink to="/" onClick={close}>
            Inicio
          </NavLink>

          {/* CATEGORÍAS */}
          <div
            className="navbar-dropdown"
            onMouseEnter={() => open("categorias")}
            onMouseLeave={close}
          >
            <button className="dropdown-trigger">Categorías ▾</button>

            {openMenu === "categorias" && (
              <div className="dropdown-menu">
                <NavLink to="/category/perfume" onClick={close}>
                  Perfumes
                </NavLink>
                <NavLink to="/category/splash" onClick={close}>
                  Splash
                </NavLink>
                <NavLink to="/category/crema" onClick={close}>
                  Cremas
                </NavLink>
                <NavLink to="/category/sets" onClick={close}>
                  Sets
                </NavLink>
              </div>
            )}
          </div>

          {/* PÚBLICO */}
          <div
            className="navbar-dropdown"
            onMouseEnter={() => open("publico")}
            onMouseLeave={close}
          >
            <button className="dropdown-trigger">Público ▾</button>

            {openMenu === "publico" && (
              <div className="dropdown-menu">
                <NavLink to="/category/mujer" onClick={close}>
                  Mujer
                </NavLink>
                <NavLink to="/category/hombre" onClick={close}>
                  Hombre
                </NavLink>
                <NavLink to="/category/unisex" onClick={close}>
                  Unisex
                </NavLink>
                <NavLink to="/category/ninos" onClick={close}>
                  Niños
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* CARRITO */}
        <div className="navbar-right">
          <button
            className="cart-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/cart");
            }}
            aria-label="Carrito"
          >
            <CartIcon className="cart-icon" size={22} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}