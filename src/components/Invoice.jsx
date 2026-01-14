import React from "react";

export default function Invoice({ order }) {
  if (!order) return null;

  return (
    <div style={{
      maxWidth: 420,
      margin: "0 auto",
      padding: 20,
      fontFamily: "monospace",
      border: "1px solid #ddd"
    }}>
      <h2 style={{ textAlign: "center" }}>MC Beauty & Fragrance</h2>

      <hr />

      <div>
        <div>Factura #: <strong>{order.order_number}</strong></div>
        <div>Fecha: {new Date(order.created_at).toLocaleDateString()}</div>
      </div>

      <hr />

      <div>
        <strong>Cliente:</strong> {order.customer_name}<br />
        <strong>Tel:</strong> {order.customer_phone}
      </div>

      <hr />

      {order.order_items.map((item, i) => (
        <div key={i}>
          {item.quantity} x {item.products.name}
          <span style={{ float: "right" }}>
            RD${item.subtotal.toFixed(2)}
          </span>
        </div>
      ))}

      <hr />

      <div>
        <strong>Total:</strong>
        <span style={{ float: "right" }}>
          RD${order.total_amount.toFixed(2)}
        </span>
      </div>

      <hr />

      <div style={{ fontSize: 12 }}>
        Método de pago: <strong>{order.payment_methods.name}</strong>
      </div>

      <hr />

      <div style={{ fontSize: 12, textAlign: "center" }}>
        Gracias por su compra 💙
      </div>
    </div>
  );
}