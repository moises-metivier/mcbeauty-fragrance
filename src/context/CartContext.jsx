// src/context/CartContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { trackPageView } from "../services/pageViewService";

const CartContext = createContext(null);
const CART_KEY = "mc-cart-v1";

/* ============================= */
/* HELPERS */
/* ============================= */

function normalizeItem(raw) {
  return {
    id: String(raw?.id ?? Date.now()),
    name: String(raw?.name ?? "Producto"),
    type: String(raw?.type ?? ""), // 👈 CLAVE
    price: Number(raw?.price) || 0,
    qty: Math.max(1, Number(raw?.qty ?? 1)),
  };
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeItem);
  } catch {
    return [];
  }
}

/* ============================= */
/* PROVIDER */
/* ============================= */

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  /* Persistencia */
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  /* ============================= */
  /* ACCIONES */
  /* ============================= */

  function addToCart(product, qty = 1) {
    if (!product?.id) {
      console.warn(
        "addToCart called without product.id — analytics skipped",
        product
      );
    }

    const item = normalizeItem({ ...product, qty });

    setCart((prev) => {
      const found = prev.find(
        (p) =>
          String(p.id) === String(item.id) &&
          p.type === item.type
      );

      if (found) {
        return prev.map((p) =>
          String(p.id) === String(item.id) && p.type === item.type
            ? { ...p, qty: p.qty + item.qty }
            : p
        );
      }

      return [...prev, item];
    });

    // 🔒 SOLO analytics si el id es REAL
    if (product?.id) {
      trackPageView(
        "/event/add_to_cart",
        "product",
        product.id
      );
    }
  }

  function updateQty(id, qty) {
    const safeQty = Math.max(1, Number(qty) || 1);

    setCart((prev) =>
      prev.map((p) =>
        String(p.id) === String(id)
          ? { ...p, qty: safeQty }
          : p
      )
    );
  }

  function removeFromCart(id) {
    setCart((prev) =>
      prev.filter((p) => String(p.id) !== String(id))
    );
  }

  function clearCart() {
    setCart([]);
    localStorage.removeItem(CART_KEY);
  }

  /* ============================= */
  /* DERIVADOS */
  /* ============================= */

  const cartCount = useMemo(
    () => (cart || []).reduce((sum, i) => sum + i.qty, 0),
    [cart]
  );

  const total = useMemo(
    () =>
      (cart || []).reduce(
        (sum, i) => sum + i.price * i.qty,
        0
      ),
    [cart]
  );

  const value = {
    cart,
    cartCount,
    total,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/* ============================= */
/* HOOK */
/* ============================= */

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error(
      "useCart debe usarse dentro de <CartProvider>"
    );
  }
  return ctx;
}