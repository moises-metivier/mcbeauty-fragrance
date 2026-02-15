import React from "react";

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", lineHeight: "1.7" }}>
      <h1>Política de Privacidad</h1>
      <p><strong>MC Beauty Auto Publisher</strong></p>
      <p>Última actualización: 15 de febrero de 2026</p>

      <p>
        MC Beauty Auto Publisher es una herramienta interna desarrollada por 
        MC Beauty & Fragrance para gestionar y automatizar publicaciones 
        en redes sociales como Instagram.
      </p>

      <h2>1. Información que recopilamos</h2>
      <ul>
        <li>Nombre de usuario de Instagram</li>
        <li>ID de cuenta</li>
        <li>Contenido de publicaciones programadas</li>
        <li>Información básica del perfil público</li>
      </ul>

      <p>No recopilamos contraseñas ni información financiera.</p>

      <h2>2. Uso de la información</h2>
      <ul>
        <li>Publicar contenido en cuentas autorizadas</li>
        <li>Programar publicaciones</li>
        <li>Gestionar contenido de redes sociales</li>
      </ul>

      <h2>3. Almacenamiento de datos</h2>
      <p>
        Los datos pueden almacenarse temporalmente en servidores seguros 
        (Supabase) únicamente con fines operativos.
      </p>

      <h2>4. Compartición de datos</h2>
      <p>No vendemos ni compartimos datos con terceros.</p>

      <h2>5. Seguridad</h2>
      <p>
        Implementamos medidas técnicas y organizativas para proteger la información.
      </p>

      <h2>6. Eliminación de datos</h2>
      <p>
        Puedes solicitar la eliminación de tus datos visitando:
        <br />
        <a href="/data-deletion">/data-deletion</a>
      </p>

      <h2>7. Contacto</h2>
      <p>Correo: mcbeautyfragrance@gmail.com</p>
    </div>
  );
}