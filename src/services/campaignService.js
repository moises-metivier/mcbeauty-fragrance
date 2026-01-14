// src/services/campaignService.js
import { supabase } from "../lib/supabaseClient";

/**
 * Obtiene la campaña activa con mayor prioridad
 * y valida fechas si existen.
 */
export async function getActiveCampaign() {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("active", true)
    .order("priority", { ascending: false });

  if (error) {
    console.warn("No se pudo cargar campaña:", error.message);
    return null;
  }

  if (!data || data.length === 0) return null;

  // valida fechas si existen
  const valid = data.find((c) => {
    if (c.start_date && today < c.start_date) return false;
    if (c.end_date && today > c.end_date) return false;
    return true;
  });

  return valid || null;
}

// ✅ Campaña próxima (para empezar a promocionar X días antes)
export async function getUpcomingCampaign({ leadDays = 30 } = {}) {
  const today = new Date();
  const lead = new Date();
  lead.setDate(today.getDate() + Number(leadDays || 30));

  const todayISO = today.toISOString().slice(0, 10);
  const leadISO = lead.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("active", true)
    .not("start_date", "is", null)
    .gte("start_date", todayISO)
    .lte("start_date", leadISO)
    .order("priority", { ascending: false })
    .order("start_date", { ascending: true });

  if (error) {
    console.warn("No se pudo cargar campaña próxima:", error.message);
    return null;
  }

  return (data && data[0]) || null;
}