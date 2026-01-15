import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { cartCount } = useCart();

  const [openMenu, setOpenMenu] = useState(null);

  const open = (menu) => setOpenMenu(menu);
  const close = () => setOpenMenu(null);

  return (
    <header className="navbar" onClick={close}>
      {/* LOGO */}
      <div
        className="navbar-left"
        onClick={(e) => {
          e.stopPropagation();
          navigate("/");
        }}
        role="button"
      >
        <img src="/logo.png" alt="MC Beauty & Fragrance" className="navbar-logo" />
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
          <button className="dropdown-trigger">
            Categorías ▾
          </button>

          {openMenu === "categorias" && (
            <div className="dropdown-menu">
              <NavLink to="/category/perfume" onClick={close}>Perfumes</NavLink>
              <NavLink to="/category/splash" onClick={close}>Splash</NavLink>
              <NavLink to="/category/crema" onClick={close}>Cremas</NavLink>
              <NavLink to="/category/sets" onClick={close}>Sets</NavLink>
            </div>
          )}
        </div>

        {/* PÚBLICO */}
        <div
          className="navbar-dropdown"
          onMouseEnter={() => open("publico")}
          onMouseLeave={close}
        >
          <button className="dropdown-trigger">
            Público ▾
          </button>

          {openMenu === "publico" && (
            <div className="dropdown-menu">
              <NavLink to="/category/mujer" onClick={close}>Mujer</NavLink>
              <NavLink to="/category/hombre" onClick={close}>Hombre</NavLink>
              <NavLink to="/category/unisex" onClick={close}>Unisex</NavLink>
              <NavLink to="/category/ninos" onClick={close}>Niños</NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* CARRITO */}
      <div className="navbar-right">
        <button className="cart-btn" onClick={() => navigate("/cart")}>
          🛒
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}