// src/services/aiQueueProcessor.js
import { supabase } from "../lib/supabaseClient";

// Trae campaña activa de mayor prioridad (priority más baja = manda)
async function getTopActiveCampaignId() {
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, priority, active")
    .eq("active", true)
    .order("priority", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("⚠️ No se pudo cargar campaña activa:", error);
    return null;
  }

  return data?.id || null;
}

// Procesa UN trabajo pendiente de la cola
export async function processNextAIJob() {
  try {
    // 1️⃣ Buscar el primero pendiente
    const { data: job, error } = await supabase
      .from("ai_posts_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (error || !job) {
      alert("No hay trabajos pendientes en la cola.");
      return;
    }

    // 2️⃣ Texto base + contexto estratégico
    const generatedText = `
${job.headline ? "🔥 " + job.headline : ""}

✨ ${job.title || ""}
${job.subtitle || ""}

${job.support_text ? "💡 " + job.support_text : ""}

👉 ${job.cta || ""}
`.trim();

    // 3️⃣ Campaign id (prioridad):
    // - si el job ya trae campaign_id => usa ese
    // - si no trae => usa la campaña activa top
    const campaignId =
      job.campaign_id || (await getTopActiveCampaignId());

    // 4️⃣ Guardar en marketing_posts
    const { error: insertError } = await supabase
      .from("marketing_posts")
      .insert({
        platform: "instagram",
        content: generatedText,
        image_id: null,
        status: "draft",

        // metadata estratégica
        template_type: job.template_type,
        format: job.format,
        objective: job.objective,

        // ✅ NUEVO
        campaign_id: campaignId,
      });

    if (insertError) throw insertError;

    // 5️⃣ Marcar job como completado
    await supabase
      .from("ai_posts_queue")
      .update({ status: "done" })
      .eq("id", job.id);

    alert("✅ Trabajo IA procesado correctamente");
  } catch (e) {
    console.error("❌ Error procesando cola IA:", e);
    alert("Error procesando la cola IA");
  }
}