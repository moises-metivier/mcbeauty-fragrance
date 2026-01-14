//src/services/filterService.js
import { supabase } from "../lib/supabaseClient";

// Marcas visibles (ordenadas)
export async function loadBrands() {
  const { data, error } = await supabase
    .from("brands")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error loading brands:", error);
    return [];
  }

  return data || [];
}

// Tipos visibles (ordenados)
export async function loadProductTypes() {
  const { data, error } = await supabase
    .from("product_types")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error loading product types:", error);
    return [];
  }

  return data || [];
}