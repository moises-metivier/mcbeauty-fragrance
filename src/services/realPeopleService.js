// services/realPeopleService.js
import { supabase } from "../lib/supabaseClient";

export async function trackRealPerson(productId, sessionId) {
  if (!productId || !sessionId) return;

  await supabase
    .from("product_unique_views")
    .insert({
      product_id: productId,
      session_id: sessionId,
    })
    .select()
    .catch(() => {
      // si ya existe, no pasa nada (unique constraint)
    });
}