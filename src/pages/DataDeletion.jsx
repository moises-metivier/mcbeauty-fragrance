import React from "react";
import { Helmet } from "react-helmet-async";

export default function DataDeletion() {
  return (
    <>
      <Helmet>
        <title>Solicitud de Eliminación de Datos | MC Social Publisher</title>

        <meta
          name="description"
          content="Solicita la eliminación de tus datos asociados a MC Social Publisher de forma segura y transparente."
        />

        <meta
          property="og:title"
          content="Eliminación de Datos | MC Social Publisher"
        />
        <meta
          property="og:description"
          content="Proceso oficial para solicitar la eliminación de datos en MC Social Publisher."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="legal-container">
        <h1>Eliminación de Datos</h1>

        <p className="legal-updated">
          Última actualización: {new Date().toLocaleDateString()}
        </p>

        <p>
          <strong>MC Social Publisher</strong>, desarrollado por{" "}
          <strong>MC Beauty & Fragrance</strong>, permite a los usuarios
          solicitar la eliminación de los datos asociados a sus cuentas
          conectadas en cualquier momento.
        </p>

        <h2>Cómo solicitar la eliminación</h2>

        <p>
          Para solicitar la eliminación de tus datos, sigue los siguientes pasos:
        </p>

        <ol>
          <li>
            Envía un correo electrónico a:
            <br />
            <strong>mcbeautyfragrance@gmail.com</strong>
          </li>
          <li>
            Incluye la siguiente información:
            <ul>
              <li>Nombre de usuario de la cuenta conectada</li>
              <li>Plataforma (Instagram, Facebook, TikTok, YouTube, etc.)</li>
              <li>ID de cuenta (si lo conoces)</li>
            </ul>
          </li>
        </ol>

        <h2>Tiempo de procesamiento</h2>

        <p>
          Las solicitudes serán procesadas dentro de un plazo máximo de{" "}
          <strong>7 días hábiles</strong> desde la recepción del correo.
        </p>

        <h2>Alcance de la eliminación</h2>

        <p>
          La eliminación incluye la remoción de:
        </p>

        <ul>
          <li>Publicaciones programadas</li>
          <li>Medios almacenados</li>
          <li>Tokens de acceso asociados</li>
          <li>Metadatos técnicos relacionados con la cuenta</li>
        </ul>

        <p>
          Algunos registros pueden mantenerse de forma limitada cuando sea
          requerido por obligaciones legales o técnicas.
        </p>

        <p>
          Para más información, consulta nuestra{" "}
          <a href="/privacy-policy">Política de Privacidad</a>.
        </p>
      </div>
    </>
  );
}