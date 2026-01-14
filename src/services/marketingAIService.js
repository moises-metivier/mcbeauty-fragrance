// src/services/marketingAIService.js
import { supabase } from "../lib/supabaseClient";
import { getStoreInsights } from "./insightsService";

// 🖼️ OBTENER IMÁGENES PARA IA
// ==============================
export async function getImagesForAI() {
  const { data, error } = await supabase
    .from("marketing_images")
    .select("*")
    .eq("active", true)
    .eq("use_for_ai", true);

  if (error) throw error;
  return data;
}

// genera textos con tono humano + soporte de imagen
export async function generateMarketingContent({
  mode = "growth",
  image = null, // { id, title, tag, image_url }
} = {}) {
  // ==============================
  // 🔐 OBTENER SESIÓN REAL (JWT válido)
  // ==============================
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("No hay sesión activa. Inicia sesión nuevamente.");
  }

  // ==============================
  // 📊 INSIGHTS DE LA TIENDA
  // ==============================
  const insights = await getStoreInsights({ leadDays: 30 });

  const {
    activeCampaign,
    upcomingCampaign,
    topViewed,
    zeroViewed,
  } = insights;

  // ==============================
  // 🧠 DECISIÓN ESTRATÉGICA
  // ==============================
  let context = "";
  let objective = "";

  if (mode === "campaign" && activeCampaign) {
    context = `Campaña activa: ${activeCampaign.title}`;
    objective =
      "Impulsar ventas y reforzar la conexión emocional con la marca.";
  } else if (mode === "campaign" && upcomingCampaign) {
    context = `Próxima campaña: ${upcomingCampaign.title}`;
    objective =
      "Generar emoción y anticipación para que las personas recuerden la marca.";
  } else {
    context = "Crecimiento semanal de la tienda";
    objective =
      "Aumentar confianza, cercanía y recordación de marca.";
  }

  // ==============================
  // 🎯 FOCO DE PRODUCTOS
  // ==============================
  const featured =
    topViewed?.[0]?.product?.name ||
    zeroViewed?.[0]?.name ||
    "nuestros productos más queridos";

  // ==============================
  // 🖼️ CONTEXTO DE IMAGEN
  // ==============================
  let imageContext = "No hay imagen específica.";
  if (image) {
    imageContext = `
Imagen seleccionada:
- Título: ${image.title}
- Etiqueta: ${image.tag}
- URL: ${image.image_url}

El texto debe complementar visualmente esta imagen.
`;
  }

  // ==============================
  // 📝 PROMPT HUMANO
  // ==============================
  const prompt = `
Eres un experto en marketing emocional para una tienda de perfumes y belleza.

Contexto: ${context}
Objetivo: ${objective}
Producto destacado: ${featured}

${imageContext}

Reglas:
- NO sonar como inteligencia artificial
- Usar tono cercano, humano, natural
- Hacer que la persona se imagine regalando o usando el producto
- Usar español latino natural
- No usar emojis en exceso (máx 2)
- Si hay imagen, que el texto la complemente

Devuelve SOLO este JSON:

{
  "facebook": "",
  "instagram": "",
  "tiktok": "",
  "whatsapp": ""
}
`;

  // ==============================
  // 🤖 LLAMAR A LA EDGE FUNCTION
  // ==============================
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/marketing-writer`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 🔑 JWT REAL DEL USUARIO (NO anon key)
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ prompt }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Error IA: " + err);
  }

  const data = await res.json();

  // ==============================
  // 💾 GUARDAR RESULTADOS (opcional pero PRO)
  // ==============================
  if (data.text) {
    try {
      const parsed = JSON.parse(data.text);

      const inserts = Object.entries(parsed).map(
        ([platform, content]) => ({
          platform,
          content,
          image_id: image?.id || null,
          status: "draft",
        })
      );

      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/marketing_posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(inserts),
        }
      );
    } catch (e) {
      console.warn("No se pudieron guardar los posts:", e);
    }
  }

  // ==============================
  // ⬇️ DEVOLVER RESULTADO A LA UI
  // ==============================
  return {
    text: data.text,
    meta: {
      mode,
      context,
      objective,
      featured,
      image,
    },
  };
}