// src/services/aiService.js
export async function suggestProductWithAI({ imageUrl, nameHint }) {
  const prompt = `
You are an expert product manager for a beauty & fragrance store.

Analyze the image and the optional product name.
Return ONLY valid JSON with these fields:

{
  "name": "",
  "brand": "",
  "type": "",
  "category": "",
  "audience": "",
  "description": ""
}

Rules:
- category must be one of: frutal, floral, dulce, amaderado, citrico, otros
- audience must be: mujer, hombre, unisex, nino, otros
- type examples: Crema, Splash, Perfume, Set
- Brand should be realistic (Bath & Body Works, Victoria's Secret, etc.)
- No extra text. Only JSON.
`;

  const res = await fetch(
    "https://jvbzjqtvdenwgfdbobcz.supabase.co/functions/v1/product-analyser",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` // 🔥 ESTA LÍNEA ES LA CLAVE
      },
      body: JSON.stringify({
        imageUrl
      })
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return await res.json();
}