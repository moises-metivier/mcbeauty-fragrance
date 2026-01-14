// src/pages/AdminPaymentMethods.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "../admin.css";

function safeInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    bank_name: "",
    account_holder: "",
    account_number: "",
    document_id: "",
    has_qr: false,
    qr_image_url: "",
    active: true,
    sort_order: 1,
  });

  const [search, setSearch] = useState("");

  async function loadMethods() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setMethods(data || []);
    } catch (e) {
      console.error("Error cargando payment_methods:", e);
      setMethods([]);
      alert("No se pudieron cargar los métodos de pago");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMethods();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return methods;
    return methods.filter((m) => {
      return (
        (m.name || "").toLowerCase().includes(q) ||
        (m.bank_name || "").toLowerCase().includes(q) ||
        (m.account_holder || "").toLowerCase().includes(q) ||
        (m.account_number || "").toLowerCase().includes(q)
      );
    });
  }, [methods, search]);

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      bank_name: "",
      account_holder: "",
      account_number: "",
      document_id: "",
      has_qr: false,
      qr_image_url: "",
      active: true,
      sort_order: methods.length + 1,
    });
  }

  function startEdit(m) {
    setEditingId(m.id);
    setForm({
      name: m.name || "",
      bank_name: m.bank_name || "",
      account_holder: m.account_holder || "",
      account_number: m.account_number || "",
      document_id: m.document_id || "",
      has_qr: Boolean(m.has_qr),
      qr_image_url: m.qr_image_url || "",
      active: Boolean(m.active),
      sort_order: safeInt(m.sort_order, 1),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function toggleActive(id) {
    const current = methods.find((m) => m.id === id);
    if (!current) return;

    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ active: !current.active })
        .eq("id", id);

      if (error) throw error;
      await loadMethods();
    } catch (e) {
      console.error(e);
      alert("No se pudo cambiar Active");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      name: String(form.name || "").trim(),
      bank_name: String(form.bank_name || "").trim() || null,
      account_holder: String(form.account_holder || "").trim() || null,
      account_number: String(form.account_number || "").trim() || null,
      document_id: String(form.document_id || "").trim() || null,
      has_qr: Boolean(form.has_qr),
      qr_image_url: String(form.qr_image_url || "").trim() || null,
      active: Boolean(form.active),
      sort_order: safeInt(form.sort_order, 1),
    };

    if (!payload.name) {
      alert("Ponle un nombre al método (ej: Transferencia Banco BHD)");
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        const { error } = await supabase
          .from("payment_methods")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("payment_methods").insert(payload);
        if (error) throw error;
      }

      await loadMethods();
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Error guardando método de pago (revisa RLS/columnas)");
    } finally {
      setLoading(false);
    }
  }

  async function deleteMethod(id) {
    const m = methods.find((x) => x.id === id);
    const label = m?.name || "este método";
    if (!window.confirm(`¿Eliminar "${label}"?`)) return;

    try {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
      await loadMethods();
      if (editingId === id) resetForm();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar (puede estar ligado a órdenes). Mejor desactívalo.");
    }
  }

  return (
    <div className="admin-main">
      <header className="admin-main-header">
        <div className="admin-main-title-block">
          <h1>💳 Métodos de pago / Bancos</h1>
          <p>Aquí activas, editas u ocultas bancos sin tocar código.</p>
        </div>
      </header>

      <section className="admin-card" style={{ marginTop: 18 }}>
        <div className="admin-card-header">
          <h2>{editingId ? "Editar método" : "Agregar método"}</h2>
          <span>{loading ? "Procesando..." : `${methods.length} métodos`}</span>
        </div>

        <form className="admin-product-form" onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Nombre (lo que verá el cliente)</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej: Transferencia Banco BHD"
            />
          </div>

          <div className="admin-form-group">
            <label>Banco (solo admin)</label>
            <input
              name="bank_name"
              value={form.bank_name}
              onChange={handleChange}
              placeholder="Ej: Banco BHD"
            />
          </div>

          <div className="admin-form-group">
            <label>Titular</label>
            <input
              name="account_holder"
              value={form.account_holder}
              onChange={handleChange}
              placeholder="Ej: MOISES METIVIER"
            />
          </div>

          <div className="admin-form-group">
            <label>Número de cuenta</label>
            <input
              name="account_number"
              value={form.account_number}
              onChange={handleChange}
              placeholder="Ej: 23653960017"
            />
          </div>

          <div className="admin-form-group">
            <label>Documento</label>
            <input
              name="document_id"
              value={form.document_id}
              onChange={handleChange}
              placeholder="Ej: 40223506706"
            />
          </div>

          <div className="admin-form-group">
            <label>Orden (sort_order)</label>
            <input
              type="number"
              min="1"
              name="sort_order"
              value={form.sort_order}
              onChange={handleChange}
            />
          </div>

          <div className="admin-form-group">
            <label>Activo (visible al cliente)</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                name="active"
                checked={Boolean(form.active)}
                onChange={handleChange}
              />
              <span>{form.active ? "Sí" : "No"}</span>
            </div>
          </div>

          <div className="admin-form-group">
            <label>Tiene QR</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                name="has_qr"
                checked={Boolean(form.has_qr)}
                onChange={handleChange}
              />
              <span>{form.has_qr ? "Sí" : "No"}</span>
            </div>
          </div>

          {form.has_qr && (
            <div className="admin-form-group">
              <label>QR (URL o data:image/...)</label>
              <input
                name="qr_image_url"
                value={form.qr_image_url}
                onChange={handleChange}
                placeholder="https://... o data:image/png;base64,..."
              />
            </div>
          )}

          <div className="admin-form-footer">
            <button className="btn-primary" type="submit" disabled={loading}>
              {editingId ? "💾 Guardar cambios" : "+ Agregar método"}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={resetForm}
              style={{ marginLeft: 10 }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card" style={{ marginTop: 18 }}>
        <div className="admin-card-header">
          <h2>Lista</h2>
          <span>{loading ? "..." : `${filtered.length} resultados`}</span>
        </div>

        <input
          type="text"
          placeholder="Buscar por nombre, banco, titular o cuenta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: 14,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 14,
          }}
        />

        <table className="admin-products-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Banco</th>
              <th>Cuenta</th>
              <th>Activo</th>
              <th>Orden</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}>No hay métodos.</td></tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.name}</strong>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {m.has_qr ? "QR: Sí" : "QR: No"}
                    </div>
                  </td>
                  <td>{m.bank_name || "—"}</td>
                  <td>{m.account_number || "—"}</td>
                  <td>
                    <span className={"badge " + (m.active ? "green" : "gray")}>
                      {m.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>{safeInt(m.sort_order, 1)}</td>
                  <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn-secondary" onClick={() => startEdit(m)}>
                      Editar
                    </button>
                    <button className="btn-secondary" onClick={() => toggleActive(m.id)}>
                      {m.active ? "Ocultar" : "Mostrar"}
                    </button>
                    <button className="btn-danger" onClick={() => deleteMethod(m.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <p style={{ marginTop: 12, fontSize: 13, opacity: 0.85 }}>
          ✅ Recomendación de administración: Si un método de pago ya fue utilizado en órdenes, se recomienda{" "}
          <strong>Ocultarlo (active=false)</strong> no eliminarlo.
        </p>
      </section>
    </div>
  );
}