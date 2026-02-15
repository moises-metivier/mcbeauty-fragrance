import React from "react";
import { Helmet } from "react-helmet-async";

export default function TermsOfService() {
  return (
    <>
      <Helmet>
        <title>Términos de Servicio | MC Beauty & Fragrance</title>

        <meta
          name="description"
          content="Consulta los términos y condiciones oficiales de uso de MC Beauty & Fragrance y su sistema de automatización de publicaciones."
        />

        {/* Open Graph */}
        <meta
          property="og:title"
          content="Términos de Servicio | MC Beauty & Fragrance"
        />
        <meta
          property="og:description"
          content="Términos y condiciones oficiales de MC Beauty & Fragrance."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="legal-container">
        <h1>Términos y Condiciones de Servicio</h1>

        <p className="legal-updated">
          Última actualización: {new Date().toLocaleDateString()}
        </p>

        <section>
          <h2>1. Información General</h2>
          <p>
            Bienvenido a <strong>MC Beauty & Fragrance</strong>. Al acceder y
            utilizar nuestro sitio web y servicios, aceptas cumplir con los
            siguientes términos y condiciones. Si no estás de acuerdo con
            alguno de estos términos, te recomendamos no utilizar nuestros
            servicios.
          </p>
        </section>

        <section>
          <h2>2. Uso del Sitio Web</h2>
          <p>
            Este sitio web está destinado para uso personal y comercial
            legítimo. No está permitido utilizar nuestro contenido, imágenes,
            marcas o materiales con fines fraudulentos o sin autorización
            previa.
          </p>
        </section>

        <section>
          <h2>3. Productos y Precios</h2>
          <p>
            Nos esforzamos por mostrar información precisa sobre productos y
            precios. Sin embargo, nos reservamos el derecho de modificar
            precios, descripciones o disponibilidad sin previo aviso.
          </p>
        </section>

        <section>
          <h2>4. Pagos y Transacciones</h2>
          <p>
            Todas las transacciones deben efectuarse mediante métodos de pago
            autorizados. No almacenamos información sensible de tarjetas de
            crédito en nuestros servidores.
          </p>
        </section>

        <section>
          <h2>5. Política de Privacidad</h2>
          <p>
            El uso de nuestros servicios también está sujeto a nuestra{" "}
            <a href="/privacy-policy">Política de Privacidad</a>, donde se
            explica cómo recopilamos y utilizamos los datos personales.
          </p>
        </section>

        <section>
          <h2>6. Eliminación de Datos</h2>
          <p>
            Los usuarios pueden solicitar la eliminación de sus datos siguiendo
            las instrucciones descritas en nuestra página de{" "}
            <a href="/data-deletion">Eliminación de Datos</a>.
          </p>
        </section>

        <section>
          <h2>7. Limitación de Responsabilidad</h2>
          <p>
            MC Beauty & Fragrance no será responsable por daños indirectos,
            incidentales o consecuentes derivados del uso de nuestros servicios.
          </p>
        </section>

        <section>
          <h2>8. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de actualizar estos términos en cualquier
            momento. Los cambios serán publicados en esta página y entrarán en
            vigor inmediatamente.
          </p>
        </section>

        <section>
          <h2>9. Contacto</h2>
          <p>
            Si tienes preguntas sobre estos términos, puedes escribirnos a:
          </p>
          <p>
            <strong>mcbeautyfragrance@gmail.com</strong>
          </p>
        </section>
      </div>
    </>
  );
}