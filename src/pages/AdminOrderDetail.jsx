// src/pages/AdminOrderDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../Admin.css";

const WHATSAPP_PHONE = "18297283652"; // tu número

function moneyRD(v) {
  const n = Number(v || 0);
  return `RD$${n.toFixed(2)}`;
}

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString("es-DO");
  } catch {
    return String(value || "");
  }
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  async function loadOrder() {
    try {
      setLoading(true);

      // 1) Orden + método de pago (join)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          customer_name,
          total,
          status,
          created_at,
          payment_method_id,
          payment_methods (
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
          )
        `
        )
        .eq("id", id)
        .maybeSingle();

      if (orderError) throw orderError;

      // 2) Items (NO romper si falla)
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(`
            id,
            order_id,
            product_id,
            qty,
            unit_price,
            line_total,
            products (
              name,
              product_types ( name )
            )
          `)
          .eq("order_id", id)
          .order("id", { ascending: true });

        if (itemsError) {
            console.warn("No se pudieron cargar los items:", itemsError);
            setItems([]); // 👈 MUY IMPORTANTE: no lanzar error
        } else {
            setItems(itemsData || []);
        }

        // la orden SIEMPRE se setea
        setOrder(orderData);
    } catch (err) {
      console.error("Error cargando orden:", err);
      alert("No se pudo cargar la orden");
      navigate("/admin/orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const computedTotal = useMemo(() => {
    const sum = items.reduce(
      (acc, it) => acc + Number(it.line_total || 0),
      0
    );
    return sum;
  }, [items]);

  async function updateStatus(newStatus) {
    if (!order) return;

    try {
      setUpdating(true);

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (error) throw error;

      setOrder((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error("Error actualizando estado:", err);
      alert("No se pudo actualizar el estado");
    } finally {
      setUpdating(false);
    }
  }

  function buildInvoiceText() {
    const pm = order?.payment_methods;
    const date = new Date(order?.created_at || Date.now()).toLocaleDateString("es-DO");
    const orderNo = order?.order_number || order?.id;

    const lines = [];
    lines.push("MC Beauty & Fragrance");
    lines.push(`Fecha: ${date}`);
    lines.push(`Factura: #${orderNo}`);
    lines.push("--------------------------------");
    lines.push(`Cliente: ${order?.customer_name || ""}`);
    lines.push("--------------------------------");
    lines.push("PRODUCTOS:");
    items.forEach((p) => {
      const sub = Number(p.line_total || 0);
      lines.push(
        `• ${p.products?.name || `ID ${p.product_id}`} x${p.qty} — ${moneyRD(sub)}`
      );
    });
    

    lines.push("--------------------------------");
    lines.push(`TOTAL: ${moneyRD(order?.total ?? computedTotal)}`);
    lines.push("--------------------------------");
    lines.push("MÉTODO DE PAGO:");
    lines.push(`${pm?.name || "—"}`);

    // Nota pro: el delivery se paga al mensajero
    lines.push("");
    lines.push("📌 Nota: El delivery tiene un costo adicional y se paga al mensajero al recibir.");

    // Datos de cuenta si aplica
    if (pm?.account_holder || pm?.account_number) {
      lines.push("");
      if (pm?.account_holder) lines.push(`Titular: ${pm.account_holder}`);
      if (pm?.account_number) lines.push(`Cuenta: ${pm.account_number}`);
      if (pm?.document_id) lines.push(`Documento: ${pm.document_id}`);
    }

    lines.push("--------------------------------");
    lines.push("Gracias por su compra 💙");

    return encodeURIComponent(lines.join("\n"));
  }

  function resendWhatsApp() {
    if (!order) return;
    const msg = buildInvoiceText();
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${msg}`, "_blank");
  }

  if (loading) {
    return <div className="admin-main">Cargando orden...</div>;
  }

  if (!order) {
    return <div className="admin-main">Orden no encontrada</div>;
  }

  const pm = order.payment_methods;

  return (
    <div className="admin-main">
      <header className="admin-main-header">
        <div className="admin-main-title-block">
          <h1>📦 Orden #{order.order_number || order.id}</h1>
          <p>Detalle completo del pedido</p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn-secondary" onClick={() => navigate("/admin/orders")}>
            ⬅ Volver a órdenes
          </button>
          <button className="btn-secondary" onClick={loadOrder} disabled={loading}>
            🔄 Recargar
          </button>
          <button className="btn-secondary" onClick={resendWhatsApp}>
            🟢 Re-enviar factura (WhatsApp)
          </button>
        </div>
      </header>

      {/* Estado */}
      <section className="admin-card" style={{ marginTop: 18 }}>
        <h2>📌 Estado de la orden</h2>

        <p style={{ marginTop: 8 }}>
          Estado actual:{" "}
          <span className={`status-pill status-${order.status}`}>
            {order.status}
          </span>
        </p>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn-secondary"
            disabled={updating || order.status === "paid"}
            onClick={() => updateStatus("paid")}
          >
            💰 Marcar como pagada
          </button>

          <button
            className="btn-secondary"
            disabled={updating || order.status === "delivered"}
            onClick={() => updateStatus("delivered")}
          >
            📦 Marcar como entregada
          </button>

          <button
            className="btn-danger"
            disabled={updating || order.status === "cancelled"}
            onClick={() => updateStatus("cancelled")}
          >
            ❌ Cancelar orden
          </button>
        </div>

        <p style={{ marginTop: 12, fontSize: 13, opacity: 0.85 }}>
          ✅ Recomendación: <strong>pending</strong> = pendiente. <strong>paid</strong> = pagada.{" "}
          <strong>delivered</strong> = entregada. <strong>cancelled</strong> = cancelada.
        </p>
      </section>

      {/* Info general */}
      <section className="admin-card" style={{ marginTop: 18 }}>
        <h2>👤 Información del cliente</h2>

        <div className="admin-order-info" style={{ marginTop: 10 }}>
          <div><strong>Cliente:</strong> {order.customer_name}</div>
          <div><strong>Fecha:</strong> {formatDateTime(order.created_at)}</div>
          <div><strong>Total (orden):</strong> {moneyRD(order.total)}</div>
          <div><strong>Total (items):</strong> {moneyRD(computedTotal)}</div>
        </div>
      </section>

      {/* Pago */}
      <section className="admin-card" style={{ marginTop: 18 }}>
        <h2>💳 Método de pago</h2>

        <div className="admin-order-info" style={{ marginTop: 10 }}>
          <div><strong>Método:</strong> {pm?.name || "—"}</div>
          {pm?.bank_name && !pm?.name?.toLowerCase().includes(pm.bank_name.toLowerCase()) && (
            <div>
                <strong>Banco:</strong> {pm.bank_name}
            </div>
            )}

          {pm?.account_holder && (
            <div><strong>Titular:</strong> {pm.account_holder}</div>
          )}
          {pm?.account_number && (
            <div><strong>Cuenta:</strong> {pm.account_number}</div>
          )}
          {pm?.document_id && (
            <div><strong>Documento:</strong> {pm.document_id}</div>
          )}
        </div>

        {pm?.has_qr && pm?.qr_image_url && (
          <div style={{ marginTop: 14 }}>
            <strong>QR:</strong>
            <div style={{ marginTop: 10 }}>
              <img
                src={pm.qr_image_url}
                alt="QR de pago"
                style={{ width: 220, maxWidth: "100%", borderRadius: 12, border: "1px solid #e5e7eb" }}
              />
            </div>
            <p style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
              Si el cliente paga por transferencia, marca la orden como <strong>paid</strong>.
              Cuando se entregue, marca como <strong>delivered</strong>.
            </p>
          </div>
        )}
      </section>

      {/* Productos */}
      <section className="admin-card" style={{ marginTop: 18 }}>
        <h2>🧾 Productos</h2>

        {items.length === 0 ? (
          <p>No hay productos en esta orden.</p>
        ) : (
          <table className="admin-products-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {items.map((it) => {
                const sub = Number(it.line_total || 0);
                return (
                  <tr key={it.id}>
                    <td>
                      {it.products?.name || `ID ${it.product_id}`}{" "}
                      {it.products?.product_types?.name && (
                        <span style={{ opacity: 0.7 }}>
                          ({it.products.product_types.name})
                        </span>
                      )}
                    </td>
                    <td>{it.qty}</td>
                    <td>{moneyRD(it.unit_price)}</td>
                    <td><strong>{moneyRD(sub)}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}