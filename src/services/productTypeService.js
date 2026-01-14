// src/services/productTypeService.js
import { supabase } from "../lib/supabaseClient";

/* =========================================================
   HELPERS
========================================================= */
function normalizeName(value) {
  if (!value) return "";

  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* =========================================================
   GET PRODUCT TYPES
   - Por defecto solo activos
========================================================= */
/**
 * @param {Object} options
 * @param {boolean} [options.onlyActive=true]
 */
export async function getProductTypes(options = {}) {
  const { onlyActive = true } = options;

  let query = supabase
    .from("product_types")
    .select("id, name, active, created_at")
    .order("name", { ascending: true });

  if (onlyActive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ Error cargando product types:", error);
    throw error;
  }

  return data || [];
}

/* =========================================================
   CREATE PRODUCT TYPE (PRO)
   - Evita duplicados
   - Reactiva si estaba desactivado
========================================================= */
export async function createProductType(name) {
  const cleanName = normalizeName(name);

  if (!cleanName) {
    throw new Error("El nombre del tipo está vacío");
  }

  // 🔍 Buscar duplicado (case-insensitive)
  const { data: existing, error: searchError } = await supabase
    .from("product_types")
    .select("id, name, active")
    .ilike("name", cleanName)
    .maybeSingle();

  if (searchError) {
    console.error("❌ Error verificando product type:", searchError);
    throw searchError;
  }

  // 👉 Si existe, devolverlo
  if (existing) {
    // Reactivar si estaba oculto
    if (existing.active === false) {
      const { data: reactivated, error: reactivateError } = await supabase
        .from("product_types")
        .update({ active: true })
        .eq("id", existing.id)
        .select()
        .single();

      if (reactivateError) {
        console.error("❌ Error reactivando product type:", reactivateError);
        throw reactivateError;
      }

      return reactivated;
    }

    return existing;
  }

  // ➕ Crear nuevo tipo
  const { data, error } = await supabase
    .from("product_types")
    .insert([
      {
        name: cleanName,
        active: true,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("❌ Error creando product type:", error);
    throw error;
  }

  return data;
}

/* =========================================================
   SOFT DELETE (OCULTAR TIPO)
========================================================= */
export async function deactivateProductType(id) {
  const { error } = await supabase
    .from("product_types")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    console.error("❌ Error desactivando product type:", error);
    throw error;
  }

  return true;
}