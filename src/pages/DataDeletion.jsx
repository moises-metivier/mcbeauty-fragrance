import React from "react";
import { Helmet } from "react-helmet-async";

export default function DataDeletion() {
  return (
    <>
      <Helmet>
        <title>Solicitud de Eliminación de Datos | MC Beauty & Fragrance</title>

        <meta
          name="description"
          content="Solicita la eliminación de tus datos asociados a MC Beauty Auto Publisher de forma segura y transparente."
        />

        {/* Open Graph */}
        <meta
          property="og:title"
          content="Eliminación de Datos | MC Beauty & Fragrance"
        />
        <meta
          property="og:description"
          content="Proceso oficial para solicitar la eliminación de datos en MC Beauty Auto Publisher."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="legal-container">
        <h1>Eliminación de Datos</h1>

        <p className="legal-updated">
          Última actualización: 15 de febrero de 2026
        </p>

        <p>
          <strong>MC Beauty Auto Publisher</strong> permite a los usuarios
          solicitar la eliminación de los datos asociados a su cuenta en
          cualquier momento.
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
              <li>Nombre de usuario de Instagram o Facebook</li>
              <li>ID de cuenta (si lo conoces)</li>
              <li>Motivo de la solicitud</li>
            </ul>
          </li>
        </ol>

        <h2>Tiempo de procesamiento</h2>

        <p>
          Las solicitudes serán procesadas dentro de un plazo máximo de
          <strong> 7 días hábiles</strong> desde la recepción del correo.
        </p>

        <h2>Alcance de la eliminación</h2>

        <p>
          La eliminación incluye la remoción de datos almacenados en nuestros
          servidores operativos relacionados con publicaciones programadas
          y metadatos asociados.
        </p>

        <p>
          Si tienes preguntas adicionales sobre privacidad, puedes consultar
          nuestra <a href="/privacy-policy">Política de Privacidad</a>.
        </p>
      </div>
    </>
  );
}