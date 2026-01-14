// src/utils/invoiceFormatter.js

/**
 * FORMATO OFICIAL Y ÚNICO DE FACTURA
 * MC Beauty & Fragrance
 */

const ORDER_KEY = "mc-order-number";

/* ========================= */
/* HELPERS */
/* ========================= */

export function formatMoneyDOP(value) {
  const n = Number(value) || 0;
  return `RD$${n.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getOrCreateOrderNumber() {
  let current = localStorage.getItem(ORDER_KEY);
  if (!current) {
    current = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem(ORDER_KEY, current);
  }
  return current;
}

export function clearOrderNumber() {
  localStorage.removeItem(ORDER_KEY);
}

export function buildWhatsAppLink({ phone, message }) {
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/* ========================= */
/* FACTURA */
/* ========================= */

export function formatInvoiceText({
  storeName = "MC Beauty & Fragrance",
  customerName = "Cliente",
  phone,
  orderNumber,
  dateObj = new Date(),
  items = [],
  total = 0,
}) {
  const date = dateObj.toLocaleDateString("es-DO");
  const time = dateObj.toLocaleTimeString("es-DO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const productsText = items
    .map((item) => {
      const qty = Number(item.qty) || 1;
      const price = Number(item.price) || 0;
      const line = qty * price;

      return `• ${item.name} x${qty} — ${formatMoneyDOP(line)}`;
    })
    .join("\n");

  return `
${storeName}
--------------------------
Cliente: ${customerName}
Pedido #${orderNumber}
Fecha: ${date}
Hora: ${time}

Productos:
${productsText}

--------------------------
Total: ${formatMoneyDOP(total)}

Delivery:
El costo de delivery se paga al mensajero.

Quiero coordinar mi pedido.💖
`.trim();
}