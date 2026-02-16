import React from "react";
import { Helmet } from "react-helmet-async";

export default function TermsOfService() {
  return (
    <>
      <Helmet>
        <title>Términos de Servicio | MC Social Publisher</title>

        <meta
          name="description"
          content="Consulta los términos y condiciones oficiales de MC Social Publisher, sistema de automatización y gestión de publicaciones en redes sociales."
        />

        {/* Open Graph */}
        <meta
          property="og:title"
          content="Términos de Servicio | MC Social Publisher"
        />
        <meta
          property="og:description"
          content="Términos y condiciones oficiales de MC Social Publisher."
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
            Bienvenido a <strong>MC Social Publisher</strong>, una herramienta
            digital desarrollada por <strong>MC Beauty & Fragrance</strong>.
            Al acceder y utilizar nuestro sitio web y servicios, aceptas cumplir
            con los siguientes términos y condiciones. Si no estás de acuerdo
            con alguno de estos términos, te recomendamos no utilizar nuestros
            servicios.
          </p>
        </section>

        <section>
          <h2>2. Descripción del Servicio</h2>
          <p>
            MC Social Publisher es una plataforma de automatización y gestión
            de contenido que permite a los usuarios publicar, programar y
            administrar contenido en redes sociales como Instagram, Facebook,
            TikTok, YouTube y otras plataformas autorizadas mediante sus APIs
            oficiales.
          </p>
        </section>

        <section>
          <h2>3. Uso Permitido</h2>
          <p>
            El servicio debe utilizarse únicamente con fines legítimos y en
            cumplimiento de las políticas de cada plataforma integrada. No está
            permitido utilizar el sistema para actividades fraudulentas,
            spam, manipulación de métricas o cualquier uso que viole las
            políticas de terceros.
          </p>
        </section>

        <section>
          <h2>4. Integraciones con Terceros</h2>
          <p>
            MC Social Publisher utiliza APIs oficiales proporcionadas por
            plataformas externas. No estamos afiliados, patrocinados ni
            respaldados directamente por dichas plataformas, salvo que se
            indique expresamente.
          </p>
        </section>

        <section>
          <h2>5. Pagos y Transacciones</h2>
          <p>
            En caso de ofrecer planes de pago en el futuro, todas las
            transacciones deberán efectuarse mediante métodos autorizados.
            No almacenamos información sensible de tarjetas de crédito en
            nuestros servidores.
          </p>
        </section>

        <section>
          <h2>6. Política de Privacidad</h2>
          <p>
            El uso del servicio también está sujeto a nuestra{" "}
            <a href="/privacy-policy">Política de Privacidad</a>, donde se
            explica cómo recopilamos, utilizamos y protegemos la información.
          </p>
        </section>

        <section>
          <h2>7. Eliminación de Datos</h2>
          <p>
            Los usuarios pueden solicitar la eliminación de sus datos siguiendo
            las instrucciones descritas en nuestra página de{" "}
            <a href="/data-deletion">Eliminación de Datos</a>.
          </p>
        </section>

        <section>
          <h2>8. Limitación de Responsabilidad</h2>
          <p>
            MC Social Publisher no será responsable por daños indirectos,
            incidentales o consecuentes derivados del uso del servicio,
            incluyendo interrupciones de APIs externas o cambios en políticas
            de plataformas de terceros.
          </p>
        </section>

        <section>
          <h2>9. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de actualizar estos términos en cualquier
            momento. Los cambios serán publicados en esta página y entrarán en
            vigor inmediatamente.
          </p>
        </section>

        <section>
          <h2>10. Contacto</h2>
          <p>
            Para consultas relacionadas con estos términos:
          </p>
          <p>
            <strong>mcbeautyfragrance@gmail.com</strong>
          </p>
        </section>
      </div>
    </>
  );
}