import React from "react";
import { Helmet } from "react-helmet-async";

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Política de Privacidad | MC Beauty & Fragrance</title>

        <meta
          name="description"
          content="Conoce cómo MC Beauty & Fragrance protege y gestiona tu información en el uso de MC Beauty Auto Publisher."
        />

        {/* Open Graph */}
        <meta property="og:title" content="Política de Privacidad | MC Beauty & Fragrance" />
        <meta
          property="og:description"
          content="Información sobre cómo protegemos y utilizamos tus datos en MC Beauty Auto Publisher."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="legal-container">
        <h1>Política de Privacidad</h1>

        <p className="legal-updated">
          Última actualización: 15 de febrero de 2026
        </p>

        <p>
          <strong>MC Beauty Auto Publisher</strong> es una herramienta interna
          desarrollada por <strong>MC Beauty & Fragrance</strong> para gestionar
          y automatizar publicaciones en redes sociales como Instagram, Facebook
          y otras plataformas autorizadas.
        </p>

        <h2>1. Información que recopilamos</h2>
        <ul>
          <li>Nombre de usuario de Instagram o Facebook</li>
          <li>ID de cuenta</li>
          <li>Contenido de publicaciones programadas</li>
          <li>Información básica del perfil público</li>
        </ul>

        <p>
          No recopilamos contraseñas, datos financieros ni información sensible.
        </p>

        <h2>2. Uso de la información</h2>
        <ul>
          <li>Publicar contenido en cuentas previamente autorizadas</li>
          <li>Programar publicaciones automáticas</li>
          <li>Gestionar contenido y campañas digitales</li>
          <li>Mejorar el rendimiento de automatización</li>
        </ul>

        <h2>3. Almacenamiento de datos</h2>
        <p>
          Los datos pueden almacenarse temporalmente en servidores seguros
          proporcionados por Supabase, únicamente con fines operativos y
          administrativos.
        </p>

        <h2>4. Compartición de datos</h2>
        <p>
          MC Beauty & Fragrance no vende, alquila ni comparte datos personales
          con terceros.
        </p>

        <h2>5. Seguridad</h2>
        <p>
          Implementamos medidas técnicas y organizativas razonables para
          proteger la información contra accesos no autorizados.
        </p>

        <h2>6. Eliminación de datos</h2>
        <p>
          Puedes solicitar la eliminación de tus datos en cualquier momento
          visitando:
        </p>

        <p>
          <a href="/data-deletion">https://mcbeautyfragrance.com/data-deletion</a>
        </p>

        <h2>7. Contacto</h2>
        <p>
          Para consultas relacionadas con privacidad:
          <br />
          <strong>Email:</strong> mcbeautyfragrance@gmail.com
        </p>
      </div>
    </>
  );
}