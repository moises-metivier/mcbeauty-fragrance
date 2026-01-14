// src/pages/Checkout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabaseClient";
import {
  buildWhatsAppLink,
  formatInvoiceText,
  formatMoneyDOP,
  getOrCreateOrderNumber,
  clearOrderNumber,
} from "../utils/invoiceFormatter";
import { createOrder } from "../services/orderService";

const STORE_NAME = "MC Beauty & Fragrance";
const WHATSAPP_PHONE = "18297283652";

function isTransferMethod(m) {
  if (!m) return false;
  const name = String(m.name || "").toLowerCase();
  // Heurística PRO: si tiene cuenta/qr/banco o dice "transfer"
  return Boolean(
    m.account_number ||
      m.has_qr ||
      m.bank_name ||
      name.includes("transfer") ||
      name.includes("banco") ||
      name.includes("depósito") ||
      name.includes("deposito")
  );
}

export default function Checkout() {
  const { cart, total, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [sending, setSending] = useState(false);

  // Métodos de pago activos (desde Supabase)
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const [selectedPaymentId, setSelectedPaymentId] = useState(""); // string id
  const [confirmTransfer, setConfirmTransfer] = useState(false);

  const itemsForInvoice = useMemo(() => {
    return cart.map((item) => ({
      name: item.name,
      qty: Number(item.qty) || 1,
      price: Number(item.price) || 0,
    }));
  }, [cart]);

  const selectedMethod = useMemo(() => {
    if (!selectedPaymentId) return null;
    return paymentMethods.find((m) => String(m.id) === String(selectedPaymentId)) || null;
  }, [paymentMethods, selectedPaymentId]);

  const hasActiveMethods = paymentMethods.length > 0;
  const selectedIsTransfer = isTransferMethod(selectedMethod);

  // Cargar métodos activos
  useEffect(() => {
    let mounted = true;

    async function loadPaymentMethods() {
      try {
        setLoadingPayments(true);

        const { data, error } = await supabase
          .from("payment_methods")
          .select(
            `
            id,
            name,
            bank_name,
            account_holder,
            account_number,
            document_id,
            has_qr,
            qr_image_url,
            active,
            sort_order
          `
          )
          .eq("active", true)
          .order("sort_order", { ascending: true });

        if (error) throw error;

        if (!mounted) return;
        setPaymentMethods(data || []);

        // Si antes había uno seleccionado pero ya no existe, resetea
        if (selectedPaymentId) {
          const stillExists = (data || []).some(
            (m) => String(m.id) === String(selectedPaymentId)
          );
          if (!stillExists) {
            setSelectedPaymentId("");
            setConfirmTransfer(false);
          }
        }
      } catch (e) {
        console.error("Error cargando métodos activos:", e);
        if (!mounted) return;
        // Si falla, simplemente lo dejamos como que no hay métodos (no bloquea)
        setPaymentMethods([]);
      } finally {
        if (mounted) setLoadingPayments(false);
      }
    }

    loadPaymentMethods();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando cambia el método, resetea confirmación de transferencia
  useEffect(() => {
    setConfirmTransfer(false);
  }, [selectedPaymentId]);

  function buildPaymentText(method) {
    if (!method) return "";

    const lines = [];
    lines.push("");
    lines.push("--------------------------------");
    lines.push("MÉTODO DE PAGO:");
    lines.push(`${method.name || "—"}`);

    // Si es transferencia, agrega datos
    if (isTransferMethod(method)) {
      if (method.bank_name) lines.push(`Banco: ${method.bank_name}`);
      if (method.account_holder) lines.push(`Titular: ${method.account_holder}`);
      if (method.account_number) lines.push(`Cuenta: ${method.account_number}`);
      if (method.document_id) lines.push(`Documento: ${method.document_id}`);
      if (method.has_qr && method.qr_image_url) lines.push("QR: (ver en la web)");
      lines.push("");
      lines.push("✅ Confirmo que he realizado la transferencia.");
    }

    return lines.join("\n");
  }

 async function handleSendOrder() {
  // Validación nombre
  if (!customerName || customerName.trim().length < 2) {
    alert("Por favor escribe tu nombre para continuar.");
    return;
  }

  if (cart.length === 0) return;

  // Validación método SOLO si hay métodos activos
  if (hasActiveMethods) {
    if (!selectedMethod) {
      alert("Por favor selecciona un método de pago para continuar.");
      return;
    }

    if (selectedIsTransfer && !confirmTransfer) {
      alert("Confirma que realizaste la transferencia antes de enviar el pedido.");
      return;
    }
  }

  try {
    setSending(true);

    /* =========================
       1️⃣ CREAR ORDEN EN BD
    ========================= */
   

    // 1) Crear orden (con total)
    const order = await createOrder({
      customer_name: customerName.trim(),
      customer_phone: "",
      customer_email: "",
      payment_method_id: selectedMethod?.id || null,
      total: Number(total) || 0, // ✅ CLAVE
    });

    if (!order?.id) throw new Error("No se pudo obtener el ID de la orden.");

    // 2) Crear items con types seguros
    const orderItems = (cart || []).map((i) => ({
      order_id: order.id,
      product_id: i.id,
      qty: Number(i.qty) || 1,
      unit_price: Number(i.price) || 0,
      line_total: (Number(i.qty) || 1) * (Number(i.price) || 0),
    }));

    if (orderItems.length === 0) throw new Error("No hay items para guardar.");

    // 3) Insertar items y VALIDAR ERROR
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    /* =========================
       2️⃣ ARMAR MENSAJE
    ========================= */

    const orderNumber = order.order_number || order.id;

    const baseMessage = formatInvoiceText({
      storeName: STORE_NAME,
      customerName: customerName.trim(),
      orderNumber,
      items: itemsForInvoice,
      total,
    });

    const paymentBlock = hasActiveMethods
      ? buildPaymentText(selectedMethod)
      : "";

    const finalMessage = `${baseMessage}${paymentBlock}`;

    const url = buildWhatsAppLink({
      phone: WHATSAPP_PHONE,
      message: finalMessage,
    });

    /* =========================
       3️⃣ ABRIR WHATSAPP
    ========================= */
    window.open(url, "_blank", "noopener,noreferrer");

    /* =========================
       4️⃣ LIMPIEZA
    ========================= */
    clearCart();
    clearOrderNumber();
  } catch (err) {
    console.error("Error creando orden:", err);
    alert("ERROR REAL:\n" + (err.message || JSON.stringify(err)));
} finally {
    setSending(false);
  }
}

  if (cart.length === 0) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem" }}>
        <h2>Resumen del pedido</h2>
        <p>Tu carrito está vacío.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem" }}>
      <h2 style={{ marginBottom: 8 }}>🧾 Revisa tu pedido</h2>
      <p style={{ marginBottom: 18, color: "#555" }}>
        Confirma los detalles antes de enviarlo por WhatsApp
      </p>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 22,
          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
        }}
      >
        {/* NOMBRE */}
        <label style={{ display: "block", marginBottom: 18 }}>
          <strong>Tu nombre</strong>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ej: Moisés"
            style={{
              width: "100%",
              marginTop: 6,
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ccc",
              outline: "none",
            }}
          />
        </label>

        {/* PRODUCTOS (SIEMPRE) */}
        <div style={{ marginBottom: 16 }}>
        {cart.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
              fontSize: 14,
            }}
          >
            <span>
              {item.name}
              {item.type && (
                <span style={{ color: "#6b7280", fontSize: 12 }}>
                  {" "}({item.type})
                </span>
              )}
              {" "}× {item.qty}
            </span>

            <strong>{formatMoneyDOP(item.price * item.qty)}</strong>
          </div>
        ))}
      </div>

        <hr style={{ margin: "14px 0" }} />

        {/* TOTAL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          <span>Total</span>
          <span>{formatMoneyDOP(total)}</span>
        </div>

        {/* MÉTODOS DE PAGO:
            - Si NO hay métodos activos: NO mostrar este bloque.
            - Si hay métodos activos: mostrar radios y exigir selección.
        */}
        {!loadingPayments && hasActiveMethods && (
          <>
            <hr style={{ margin: "16px 0" }} />

            <div style={{ marginTop: 6 }}>
              <h3 style={{ margin: 0, marginBottom: 10, fontSize: 15 }}>
                💳 Método de pago
              </h3>

              <div style={{ display: "grid", gap: 10 }}>
                {paymentMethods.map((m) => (
                  <label
                    key={m.id}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      padding: 12,
                      borderRadius: 12,
                      border:
                        String(selectedPaymentId) === String(m.id)
                          ? "1px solid #25D366"
                          : "1px solid #e5e7eb",
                      background:
                        String(selectedPaymentId) === String(m.id)
                          ? "rgba(37, 211, 102, 0.06)"
                          : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={m.id}
                      checked={String(selectedPaymentId) === String(m.id)}
                      onChange={() => setSelectedPaymentId(String(m.id))}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong style={{ fontSize: 14 }}>{m.name}</strong>
                      {m.bank_name ? (
                        <span style={{ fontSize: 12, opacity: 0.8 }}>
                          {m.bank_name}
                        </span>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>

              {/* TARJETA DESTACADA PARA TRANSFERENCIA */}
              {selectedMethod && selectedIsTransfer && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid rgba(37, 211, 102, 0.35)",
                    background: "rgba(37, 211, 102, 0.07)",
                    boxShadow: "0 12px 30px rgba(37, 211, 102, 0.12)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Glow/Pulse suave */}
                  <div
                    style={{
                      position: "absolute",
                      inset: -40,
                      background:
                        "radial-gradient(circle at 30% 20%, rgba(37,211,102,0.18), transparent 55%)",
                      animation: "checkoutGlow 1.6s ease-in-out infinite",
                      pointerEvents: "none",
                    }}
                  />

                  <div style={{ position: "relative" }}>
                    <strong style={{ display: "block", marginBottom: 10 }}>
                      💳 Datos para transferencia
                    </strong>

                    <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                      {selectedMethod.bank_name && (
                        <div>
                          <strong>Banco:</strong> {selectedMethod.bank_name}
                        </div>
                      )}
                      {selectedMethod.account_holder && (
                        <div>
                          <strong>Titular:</strong> {selectedMethod.account_holder}
                        </div>
                      )}
                      {selectedMethod.account_number && (
                        <div
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            background: "#fff",
                            border: "1px dashed rgba(37, 211, 102, 0.45)",
                            boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
                          }}
                        >
                          <div style={{ fontSize: 12, opacity: 0.8 }}>Cuenta</div>
                          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.6 }}>
                            {selectedMethod.account_number}
                          </div>
                        </div>
                      )}
                      {selectedMethod.document_id && (
                        <div>
                          <strong>Documento:</strong> {selectedMethod.document_id}
                        </div>
                      )}
                    </div>

                    {selectedMethod.has_qr && selectedMethod.qr_image_url && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
                          QR (opcional):
                        </div>
                        <img
                          src={selectedMethod.qr_image_url}
                          alt="QR de pago"
                          style={{
                            width: 220,
                            maxWidth: "100%",
                            borderRadius: 12,
                            border: "1px solid rgba(0,0,0,0.08)",
                            boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
                          }}
                        />
                      </div>
                    )}

                    <p style={{ marginTop: 12, fontSize: 12, opacity: 0.9 }}>
                      ⚠️ Realiza la transferencia antes de confirmar y enviar el pedido.
                    </p>

                    <label
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        marginTop: 10,
                        padding: 10,
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.75)",
                        border: "1px solid rgba(37, 211, 102, 0.22)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={confirmTransfer}
                        onChange={(e) => setConfirmTransfer(e.target.checked)}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        Confirmo que he realizado la transferencia
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* BOTÓN FINAL */}
        <button
          onClick={handleSendOrder}
          disabled={sending}
          style={{
            marginTop: 20,
            width: "100%",
            padding: "15px 20px",
            background: "#25D366",
            color: "#fff",
            border: "none",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
            opacity: sending ? 0.7 : 1,
          }}
        >
          🟢 Confirmar y enviar por WhatsApp
        </button>

        {/* Animación inline (no depende de CSS externo) */}
        <style>{`
          @keyframes checkoutGlow {
            0% { transform: scale(1); opacity: 0.75; }
            50% { transform: scale(1.06); opacity: 1; }
            100% { transform: scale(1); opacity: 0.75; }
          }
        `}</style>
      </div>
    </div>
  );
}