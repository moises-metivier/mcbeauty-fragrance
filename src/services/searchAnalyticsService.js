// src/services/searchAnalyticsService.js
import { supabase } from "../lib/supabaseClient";

export async function trackSearch(query, resultsCount = 0) {
  const clean = query?.trim().toLowerCase();
  if (!clean) return;

  // Opcional: evita logs por 1 letra
  if (clean.length < 2) return;

  try {
    await supabase.from("search_logs").insert({
      query: clean,
      results_count: resultsCount,
    });
  } catch (e) {
    console.warn("No se pudo registrar búsqueda:", e.message);
  }
}

// 📊 Obtener búsquedas recientes para el Admin
export async function getRecentSearches({ limit = 50 } = {}) {
  try {
    const { data, error } = await supabase
      .from("search_logs")
      .select("query, results_count, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("Error cargando búsquedas:", e.message);
    return [];
  }
}

// ---------------- NORMALIZACIÓN ----------------
// minúsculas, sin tildes, espacios limpios
export function normalizeText(text) {
  if (!text) return "";

  return text
    .toLowerCase()
    .normalize("NFD")               // separa letras y tildes
    .replace(/[\u0300-\u036f]/g, "") // elimina tildes
    .replace(/\s+/g, " ")           // espacios múltiples → uno
    .trim();
}

export function applyAliases(text) {
  for (const [canonical, variants] of Object.entries(SEARCH_ALIASES)) {
    if (variants.includes(text)) {
      return canonical;
    }
  }
  return text;
}

// ---------------- TIPOS DE PRODUCTO ----------------
export const PRODUCT_TYPES = [
  "splash",
  "crema",
  "perfume",
  "locion",
  "lotion",
  "body cream",
  "body lotion",
  "mist",
  "body mist",
];

// ---------------- AROMAS GENÉRICOS ----------------
export const GENERIC_AROMAS = [
  // Vanilla
  "vanilla",
  "vainilla",

  // Coconut
  "coconut",
  "coco",

  // Rose
  "rose",
  "rosa",

  // Amber
  "amber",
  "ambar",

  // Floral
  "floral",
  "flores",

  // Sweet
  "sweet",
  "dulce",

  // Fruity
  "fruity",
  "frutal",
  "frutas",

  // Citrus
  "citrus",
  "citrico",

  // Cherry
  "cherry",
  "cereza",

  // Peach
  "peach",
  "durazno",
  "melocoton",
];

// ---------------- ALIAS SEMÁNTICOS ----------------
// clave = forma normalizada final
// valores = variaciones que escribe la gente
export const SEARCH_ALIASES = {
  vanilla: [
    "vainilla",
    "vanilla",
    "vanila",
    "vavilla",
    "van",
    "va"
  ],

  lubriderm: [
    "lubriderm",
    "lubrider",
    "lubridern",
    "lubridrm"
  ]
};

// ---------------- CLASIFICACIÓN ----------------
export function classifySearch(query) {
  if (!query) return "unknown";

  // ⚠️ NORMALIZAMOS UNA SOLA VEZ
  const normalized = normalizeText(query);
  const q = applyAliases(normalized);

  const hasType = PRODUCT_TYPES.some(t => q.includes(t));
  const hasGenericAroma = GENERIC_AROMAS.some(a => q.includes(a));

  // 🟠 MIXTA → aroma + tipo
  if (hasGenericAroma && hasType) {
    return "mixed";
  }

  // 🟡 GENÉRICA → solo aroma
  if (hasGenericAroma && !hasType) {
    return "generic";
  }

  // 🟢 ÚNICA → nombre comercial
  return "unique";
}