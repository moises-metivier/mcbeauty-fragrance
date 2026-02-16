import React from "react";
import { Helmet } from "react-helmet-async";

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Política de Privacidad | MC Social Publisher</title>

        <meta
          name="description"
          content="Conoce cómo MC Social Publisher protege y gestiona tu información al utilizar nuestra plataforma de automatización de publicaciones en redes sociales."
        />

        <meta property="og:title" content="Política de Privacidad | MC Social Publisher" />
        <meta
          property="og:description"
          content="Información sobre cómo protegemos y utilizamos tus datos en MC Social Publisher."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="legal-container">
        <h1>Política de Privacidad</h1>

        <p className="legal-updated">
          Última actualización: {new Date().toLocaleDateString()}
        </p>

        <p>
          <strong>MC Social Publisher</strong> es una herramienta digital
          desarrollada por <strong>MC Beauty & Fragrance</strong> para gestionar,
          programar y automatizar publicaciones en plataformas como Instagram,
          Facebook, TikTok, YouTube y otras redes sociales autorizadas.
        </p>

        <h2>1. Información que recopilamos</h2>
        <ul>
          <li>Nombre de usuario y nombre público de la cuenta autorizada</li>
          <li>ID de cuenta proporcionado por la plataforma conectada</li>
          <li>Contenido de publicaciones programadas</li>
          <li>Información básica del perfil público disponible mediante API</li>
          <li>Datos técnicos necesarios para la integración (tokens de acceso)</li>
        </ul>

        <p>
          No recopilamos contraseñas, datos financieros ni información sensible.
        </p>

        <h2>2. Uso de la información</h2>
        <ul>
          <li>Publicar contenido en cuentas previamente autorizadas</li>
          <li>Programar publicaciones automáticas</li>
          <li>Gestionar contenido y campañas digitales</li>
          <li>Mejorar el rendimiento y estabilidad del sistema</li>
          <li>Cumplir con requisitos técnicos de las APIs oficiales</li>
        </ul>

        <h2>3. Almacenamiento de datos</h2>
        <p>
          Los datos pueden almacenarse temporalmente en servidores seguros
          proporcionados por servicios de infraestructura como Supabase u otros
          proveedores de nube confiables, únicamente con fines operativos y
          administrativos.
        </p>

        <h2>4. Compartición de datos</h2>
        <p>
          MC Social Publisher no vende, alquila ni comparte datos personales con
          terceros. Solo utilizamos la información para la finalidad autorizada
          por el usuario.
        </p>

        <h2>5. Seguridad</h2>
        <p>
          Implementamos medidas técnicas y organizativas razonables para proteger
          la información contra accesos no autorizados, pérdida o uso indebido.
        </p>

        <h2>6. Eliminación de datos</h2>
        <p>
          Puedes solicitar la eliminación de tus datos en cualquier momento
          visitando:
        </p>

        <p>
          <a href="/data-deletion">
            https://mcbeautyfragrance.com/data-deletion
          </a>
        </p>

        <h2>7. Cambios en esta política</h2>
        <p>
          Nos reservamos el derecho de actualizar esta política en cualquier
          momento. Las modificaciones serán publicadas en esta página.
        </p>

        <h2>8. Contacto</h2>
        <p>
          Para consultas relacionadas con privacidad:
          <br />
          <strong>Email:</strong> mcbeautyfragrance@gmail.com
        </p>
      </div>
    </>
  );
}