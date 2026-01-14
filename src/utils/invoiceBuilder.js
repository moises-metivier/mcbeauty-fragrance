// src/utils/invoiceBuilder.js

export function buildWhatsAppInvoice({
  mode,
  customerName,
  orderNumber,
  cart,
  total,
  settings,
  payment,
}) {
  const lines = [];

  /* ================= HEADER ================= */
  lines.push("🧴 MC Beauty & Fragrance");
  lines.push("━━━━━━━━━━━━━━━━━━━━");
  lines.push(`👤 Cliente: ${customerName}`);
  lines.push(`🧾 Pedido: #${orderNumber}`);
  lines.push("");

  /* ================= PRODUCTOS ================= */
  lines.push("🛍️ Productos:");
  cart.forEach((item) => {
    const subtotal = Number(item.price) * Number(item.qty);
    lines.push(
      `• ${item.name} x${item.qty} — RD$${subtotal.toFixed(2)}`
    );
  });

  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━━");
  lines.push(`💰 Total: RD$${total.toFixed(2)}`);
  lines.push("━━━━━━━━━━━━━━━━━━━━");
  lines.push("");

  /* ================= PAGO (SI APLICA) ================= */
  if (mode === "transfer" && payment) {
    lines.push("🏦 Datos para transferencia:");
    lines.push(payment.name);

    if (payment.account_holder) {
      lines.push(`Titular: ${payment.account_holder}`);
    }
    if (payment.account_number) {
      lines.push(`Cuenta: ${payment.account_number}`);
    }
    if (payment.document_id) {
      lines.push(`Documento: ${payment.document_id}`);
    }

    lines.push("");
  }

  /* ================= NOTAS ================= */
  lines.push("📦 Delivery:");
  lines.push(
    settings?.delivery_note ||
      "El costo del delivery se paga al mensajero al recibir."
  );

  lines.push("");
  lines.push("💬 Quiero coordinar mi pedido.");
  lines.push("🙏 Gracias por tu compra.");

  return lines.join("\n");
}