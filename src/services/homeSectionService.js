// src/services/homeSectionService.js
import { supabase } from "../lib/supabaseClient";

/* ======================================================
   OBTENER SECCIONES ACTIVAS (HOME PÚBLICO)
   ====================================================== */
export async function loadHomeSections() {
  const { data, error } = await supabase
    .from("home_sections")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error loading home sections:", error);
    return [];
  }

  return data || [];
}

/* ======================================================
   OBTENER TODAS (ADMIN)
   ====================================================== */
export async function getAllHomeSections() {
  const { data, error } = await supabase
    .from("home_sections")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching all home sections:", error);
    return [];
  }

  return data || [];
}

/* ======================================================
   CREAR NUEVA SECCIÓN
   ====================================================== */
export async function createHomeSection(payload) {
  const { data, error } = await supabase
    .from("home_sections")
    .insert([
      {
        title: payload.title,
        slug: payload.filter_value, // ✅ NUNCA NULL
        filter_type: payload.filter_type ?? "home_tag",
        filter_value: payload.filter_value,
        sort_order: payload.sort_order ?? 0,
        active: payload.active ?? true,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating home section:", error);
    throw error;
  }

  return data;
}

/* ======================================================
   ACTUALIZAR SECCIÓN
   ====================================================== */
export async function updateHomeSection(id, updates) {
  const { data, error } = await supabase
    .from("home_sections")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating home section:", error);
    throw error;
  }

  return data;
}

/* ======================================================
   ACTIVAR / DESACTIVAR
   ====================================================== */
export async function toggleHomeSection(id, active) {
  const { error } = await supabase
    .from("home_sections")
    .update({ active })
    .eq("id", id);

  if (error) {
    console.error("Error toggling home section:", error);
    throw error;
  }

  return true;
}

/* ======================================================
   ELIMINAR (OPCIONAL – USAR CON CUIDADO)
   ====================================================== */
export async function deleteHomeSection(id) {
  const { error } = await supabase
    .from("home_sections")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting home section:", error);
    throw error;
  }

  return true;
}

export async function toggleHomeSectionView(id, value) {
  const { error } = await supabase
    .from("home_sections")
    .update({ show_section: value })
    .eq("id", id);

  if (error) throw error;
}

export async function toggleHomeButtonView(id, value) {
  const { error } = await supabase
    .from("home_sections")
    .update({ show_button: value })
    .eq("id", id);

  if (error) throw error;
}