// src/services/brandService.js
import { supabase } from "../lib/supabaseClient";

/* =========================================================
   HELPERS
========================================================= */

// Para comparar (evitar duplicados)
function normalizeKey(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// Para mostrar bonito
function formatLabel(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* =========================================================
   GET BRANDS
========================================================= */
export async function getBrands({ onlyActive = true } = {}) {
  let query = supabase
    .from("brands")
    .select("id, name, active, created_at")
    .order("name", { ascending: true });

  if (onlyActive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ Error cargando brands:", error);
    throw error;
  }

  return data || [];
}

/* =========================================================
   CREATE BRAND (PRO)
========================================================= */
export async function createBrand(name) {
  const key = normalizeKey(name);
  const label = formatLabel(name);

  if (!key) {
    throw new Error("El nombre de la marca está vacío");
  }

  // 🔍 Buscar duplicado (case-insensitive)
  const { data: existing, error: searchError } = await supabase
    .from("brands")
    .select("id, name, active")
    .ilike("name", key)
    .maybeSingle();

  if (searchError) {
    console.error("❌ Error verificando brand:", searchError);
    throw searchError;
  }

  // 👉 Si existe
  if (existing) {
    // Reactivar si estaba oculta
    if (existing.active === false) {
      const { data: reactivated, error: reactivateError } = await supabase
        .from("brands")
        .update({ active: true })
        .eq("id", existing.id)
        .select()
        .single();

      if (reactivateError) {
        console.error("❌ Error reactivando brand:", reactivateError);
        throw reactivateError;
      }

      return reactivated;
    }

    return existing;
  }

  // ➕ Crear nueva
  const { data, error } = await supabase
    .from("brands")
    .insert([
      {
        name: label,   // ← se guarda ya bonito
        active: true,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("❌ Error creando brand:", error);
    throw error;
  }

  return data;
}

/* =========================================================
   SOFT DELETE (OCULTAR)
========================================================= */
export async function deactivateBrand(id) {
  const { error } = await supabase
    .from("brands")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    console.error("❌ Error desactivando brand:", error);
    throw error;
  }

  return true;
}