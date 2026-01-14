// src/services/productAnalyticsService.js
import { supabase } from "../lib/supabaseClient";

/* ============================= */
/* COMPATIBILIDAD               */
/* ============================= */
// Si en algún componente todavía llaman trackRealPerson(),
// no rompemos nada. El tracking real ya se hace con trackPageView().
export async function trackRealPerson(productId, sessionId) {
  return;
}

/* ============================= */
/* PERSONAS REALES POR PRODUCTO */
/* (usando page_views)          */
/* ============================= */

export async function getRealPeopleByProduct() {
  try {
    const { data, error } = await supabase
      .from("page_views")
      .select("entity_id, session_id")
      .eq("entity_type", "product")
      .not("entity_id", "is", null)
      .not("session_id", "is", null);

    if (error) throw error;

    // Map: product_id -> Set(session_id)
    const map = {};

    (data || []).forEach((r) => {
      const pid = r.entity_id;
      const sid = r.session_id;
      if (!pid || !sid) return;

      if (!map[pid]) map[pid] = new Set();
      map[pid].add(sid);
    });

    // convertir Set -> número
    const result = {};
    Object.entries(map).forEach(([pid, set]) => {
      result[pid] = set.size;
    });

    return result;
  } catch (e) {
    console.error("Error cargando personas reales por producto:", e);
    return {};
  }
}