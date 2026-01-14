//src/services/aromaService.js
import { supabase } from "../lib/supabaseClient";

/* -------------------- OBTENER AROMAS -------------------- */
export async function getAromas() {
  const { data, error } = await supabase
    .from("aromas")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error cargando aromas:", error);
    throw error;
  }

  return data || [];
}

/* -------------------- CREAR AROMA -------------------- */
export async function createAroma(name) {
  const clean = String(name || "").trim();
  if (!clean) return null;

  const { data, error } = await supabase
    .from("aromas")
    .insert([{ name: clean }])
    .select()
    .single();

  if (error) {
    console.error("Error creando aroma:", error);
    throw error;
  }

  return data;
}