export default async function handler(req, res) {
  try {
    // 🔹 Consumimos el sitemap dinámico de Supabase
    const response = await fetch(
      "https://jvbzjqtvdenwgfdbobcz.supabase.co/functions/v1/sitemap"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch sitemap from Supabase");
    }

    const xml = await response.text();

    // 🔹 Headers correctos para Google
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");

    // 🔹 Devolvemos el XML
    res.status(200).send(xml);
  } catch (error) {
    res.status(500).send("Error generating sitemap");
  }
}