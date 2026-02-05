// src/components/SEO.jsx
import { Helmet } from "react-helmet-async";

export default function SEO({
  title = "Perfumes y cremas originales en República Dominicana | MC Beauty & Fragrance",
  description = "Compra perfumes, splash (body mist) y cremas corporales (body cream) 100% originales en República Dominicana. Pago contra entrega y atención directa por WhatsApp.",
  image = "https://mcbeautyfragrance.com/banner.png",
  canonical = "https://mcbeautyfragrance.com/",
  type = "website",
}) {
  return (
    <Helmet>
      {/* ================= BASIC SEO ================= */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* ================= OPEN GRAPH (Facebook / WhatsApp) ================= */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="MC Beauty & Fragrance" />
      <meta property="og:locale" content="es_DO" />

      {/* ================= TWITTER CARD ================= */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}