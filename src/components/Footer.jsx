import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">

      <div className="footer-content">

        {/* ===== MARCA ===== */}
        <div className="footer-brand">
          <div className="brand-row">
            <img src="/logo.png" alt="MC Beauty & Fragrance" />
            <h3>MC Beauty & Fragrance</h3>
          </div>

          <p>
            Perfumes y cremas 100% originales. Atención personalizada y
            entregas rápidas en República Dominicana.
          </p>

          <div className="footer-socials">
            <a
              href="https://www.facebook.com/share/1KHhnAs4g1/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/facebook.svg"
                alt="Facebook"
                width="24"
                height="24"
                loading="lazy"
              />
            </a>

            <a
              href="https://www.instagram.com/mcbeautyfragrance"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/instagram.svg"
                alt="Instagram"
                width="24"
                height="24"
                loading="lazy"
              />
            </a>

            <a
              href="https://www.tiktok.com/@mcbeautyfragrance"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/tiktok.svg"
                alt="TikTok"
                width="24"
                height="24"
                loading="lazy"
              />
            </a>
          </div>
        </div>

        {/* ===== ENLACES ===== */}
        <div className="footer-links">
          <h4>Enlaces</h4>
          <ul>
            <li>Cómo comprar</li>
            <li>Métodos de pago</li>
            <li>Envíos y entregas</li>
            <li>Preguntas frecuentes</li>
          </ul>
        </div>

        {/* ===== AYUDA ===== */}
        <div className="footer-help">
          <h4>¿Necesitas ayuda?</h4>

          <a
            href="https://wa.me/18297283652"
            target="_blank"
            className="footer-whatsapp"
          >
            <img src="/whatsapp.svg" alt="WhatsApp" />
            WhatsApp: 829-728-3652
          </a>

          <div className="footer-location">
            📍 República Dominicana
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        © 2025 MC Beauty & Fragrance. Todos los derechos reservados.
      </div>

    </footer>
  );
}