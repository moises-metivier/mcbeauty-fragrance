// src/pages/Cart.jsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../home.css";

function moneyRD(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `RD$${n.toFixed(2)}` : "RD$0.00";
}

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateQty, removeFromCart } = useCart();

  const total = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.qty),
      0
    );
  }, [cart]);

  return (
    <section className="home-cart-section">
      <h2 className="home-section-title">🛒 Tu carrito</h2>

      {cart.length === 0 ? (
        <p className="home-cart-empty">
          Tu carrito está vacío
        </p>
      ) : (
        <div className="home-cart-card">
          <ul className="home-cart-list">
            {cart.map((item) => (
              <li key={item.id} className="home-cart-item">
                <div>
                  <div className="home-cart-name">
                    {item.name}
                    {item.type && (
                      <span className="cart-item-type">
                        {" "}-   {item.type}
                      </span>
                    )}
                  </div>
                  {item.brand && (
                    <div className="home-cart-brand">
                      {item.brand}
                    </div>
                  )}
                </div>

                <div className="home-cart-controls">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={item.qty}
                    onChange={(e) =>
                      updateQty(item.id, e.target.value)
                    }
                  />

                  <span className="home-cart-price">
                    {moneyRD(item.price * item.qty)}
                  </span>

                  <button
                    className="home-cart-remove"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="home-cart-footer">
            <strong className="cart-total">
              Total: {moneyRD(total)}
            </strong>

            <button
              className="btn-whatsapp-checkout"
              onClick={() => navigate("/checkout")}
            >
              🟢 Continuar a confirmar pedido
            </button>
          </div>
        </div>
      )}
    </section>
  );
}