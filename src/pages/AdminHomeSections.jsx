// src/pages/AdminHomeSections.jsx
import { useEffect, useState } from "react";
import {
  getAllHomeSections,
  createHomeSection,
  updateHomeSection,
  toggleHomeSection,
  deleteHomeSection,
  toggleHomeSectionView,
  toggleHomeButtonView,

} from "../services/homeSectionService";

/* ============================= */
/* HELPERS */
/* ============================= */

function slugify(text = "") {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9]+/g, "-")     // espacios → -
    .replace(/^-+|-+$/g, "");        // limpia extremos
}

export default function AdminHomeSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ============================= */
  /* FORM STATE */
  /* ============================= */
  const [form, setForm] = useState({
    id: null,
    title: "",
    filter_type: "home_tag", // fijo por diseño
    filter_value: "",
    sort_order: 0,
    button_order: 0,
    section_order: 0,
    active: true,
  });

  /* ============================= */
  /* LOAD ALL */
  /* ============================= */
  async function loadAll() {
    try {
      setLoading(true);
      const data = await getAllHomeSections();
      setSections(data || []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las secciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  /* ============================= */
  /* FORM HELPERS */
  /* ============================= */
  function resetForm() {
    setForm({
      id: null,
      title: "",
      filter_type: "home_tag",
      filter_value: "",
      sort_order: 0,
      button_order: 0,
      section_order: 0,
      active: true,
    });
  }

  function editSection(section) {
    setForm({
      id: section.id,
      title: section.title,
      filter_type: section.filter_type,
      filter_value: section.filter_value,
      sort_order: section.sort_order,
      button_order: section.button_order ?? 0,
      section_order: section.section_order ?? 0,
      active: section.active,
    });
  }

  /* ============================= */
    /* CREATE / UPDATE */
    /* ============================= */
    async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
        alert("El título es obligatorio");
        return;
    }

    const filter_value = slugify(form.title);

    try {
        if (form.id) {
        await updateHomeSection(form.id, {
            title: form.title,
            filter_type: "home_tag",
            filter_value,

            // 👇 ORDENES
            sort_order: Number(form.sort_order) || 0,        // legacy
            button_order: Number(form.button_order) || 0,    // nuevo
            section_order: Number(form.section_order) || 0,  // nuevo

            active: form.active,
        });
        } else {
        await createHomeSection({
            title: form.title,
            filter_type: "home_tag",
            filter_value,

            // 👇 ORDENES
            sort_order: Number(form.sort_order) || 0,        // legacy
            button_order: Number(form.button_order) || 0,    // nuevo
            section_order: Number(form.section_order) || 0,  // nuevo

            active: form.active,
        });
        }

        resetForm();
        loadAll();
    } catch (e) {
        console.error("Error guardando la sección:", e);
        alert("Error guardando la sección");
    }
    }

  /* ============================= */
  /* ACTIONS */
  /* ============================= */
  async function handleToggle(section) {
    await toggleHomeSection(section.id, !section.active);
    loadAll();
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar esta sección?")) return;
    await deleteHomeSection(id);
    loadAll();
  }

  async function handleToggleSectionView(section) {
  await toggleHomeSectionView(section.id, !section.show_section);
  loadAll();
}

async function handleToggleButtonView(section) {
  await toggleHomeButtonView(section.id, !section.show_button);
  loadAll();
}

  /* ============================= */
  /* UI */
  /* ============================= */
  return (
    <div className="admin-page">
      <h1>Secciones del Home</h1>

      {/* FORM */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <h3>{form.id ? "Editar sección" : "Nueva sección"}</h3>

        {/* TÍTULO */}
        <input
          type="text"
          placeholder="Título (ej: Perfume Árabe)"
          value={form.title}
          onChange={(e) => {
            const title = e.target.value;
            setForm({
              ...form,
              title,
              filter_value: slugify(title),
            });
          }}
        />

        {/* INFO INTERNA */}
        {form.filter_value && (
          <small style={{ color: "#666" }}>
            Filtro interno: <code>{form.filter_value}</code>
          </small>
        )}

        {/* ORDEN */}
        <input
          type="number"
          placeholder="Orden"
          value={form.sort_order}
          onChange={(e) =>
            setForm({ ...form, sort_order: e.target.value })
          }
        />

        <input
        type="number"
        placeholder="Orden del botón"
        value={form.button_order}
        onChange={(e) =>
            setForm({ ...form, button_order: e.target.value })
        }
        />

        <input
        type="number"
        placeholder="Orden de la sección"
        value={form.section_order}
        onChange={(e) =>
            setForm({ ...form, section_order: e.target.value })
        }
        />

        {/* ACTIVA */}
        <label style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) =>
              setForm({ ...form, active: e.target.checked })
            }
          />
          Activa
        </label>

        {/* BOTONES */}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button type="submit">Guardar</button>

          {form.id && (
            <button type="button" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* LIST */}
      {loading && <p>Cargando…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && sections.length > 0 && (
        <table width="100%" border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Filter value</th>
              <th>Orden</th>
              <th>Orden Botón</th>
              <th>Orden Sección</th>
              <th>Activa</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>{s.filter_type}</td>
                <td>{s.filter_value}</td>
                <td>{s.sort_order}</td>
                <td>{s.button_order}</td>
                <td>{s.section_order}</td>
                <td>{s.active ? "Sí" : "No"}</td>
                <td>
                    <button onClick={() => editSection(s)}>Editar</button>

                    <button onClick={() => handleToggle(s)}>
                        {s.active ? "Desactivar" : "Activar"}
                    </button>

                    <button onClick={() => handleToggleSectionView(s)}>
                        {s.show_section ? "Ocultar sección" : "Mostrar sección"}
                    </button>

                    <button onClick={() => handleToggleButtonView(s)}>
                        {s.show_button ? "Ocultar botón" : "Mostrar botón"}
                    </button>

                    <button onClick={() => handleDelete(s.id)}>
                        Eliminar
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}