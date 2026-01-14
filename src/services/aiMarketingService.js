//src/services/aiMarketingService.js
import { generateMarketingContent } from "./marketingAIService";

// Llama a tu Edge Function de Supabase (o backend)
export async function generatePostWithAI({ mode = "growth" } = {}) {
  // 1️⃣ obtenemos el prompt inteligente
  const { prompt, meta } = await generateMarketingContent({ mode });

  // 2️⃣ enviamos a tu función IA
  const res = await fetch(
    "https://jvbzjqtvdenwgfdbobcz.supabase.co/functions/v1/marketing-writer",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ prompt }),
    }
  );

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t);
  }

  const data = await res.json();

  return {
    ...data,
    meta, // contexto para mostrar en el panel
  };
}