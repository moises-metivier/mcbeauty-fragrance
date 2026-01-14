// src/services/pageViewService.js
import { supabase } from "../lib/supabaseClient";

/**
 * Obtiene o crea un session_id persistente
 * - No requiere login
 * - Se guarda en localStorage
 */
function getSessionId() {
  const KEY = "mc_session_id";
  let sessionId = localStorage.getItem(KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(KEY, sessionId);
  }

  return sessionId;
}

/**
 * Registra una vista de página
 * @param {string} path - ruta visitada (ej: "/", "/product/uuid")
 * @param {string|null} entity_type - "product" | "category" | null
 * @param {string|null} entity_id - uuid del producto/categoría
 */
export async function trackPageView(
  path,
  entity_type = null,
  entity_id = null
) {
  try {
    // No contar Admin en analytics
    if (path?.startsWith("/admin")) return;

    const session_id = getSessionId();

    // ⛔ GUARDIA CRÍTICA
    if (entity_type && !entity_id) {
      console.warn(
        "Page view skipped: entity_type provided without entity_id",
        { path, entity_type }
      );
      return;
    }

    await supabase.from("page_views").insert({
      path,
      session_id,
      entity_type,
      entity_id,
    });
  } catch (error) {
    console.warn("Page view not recorded:", error?.message);
  }
}