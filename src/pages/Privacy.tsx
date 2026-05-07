import { useEffect } from "react";

const html = `<h1>Política de Privacidad y Tratamiento de Datos Personales</h1>

<p class="meta">
  <strong>Vigente desde:</strong> 7 de mayo de 2026 ·
  <strong>Última actualización:</strong> 7 de mayo de 2026 ·
  <strong>Versión:</strong> 1.0 (mínima viable)
</p>

<section>
  <h2>1. Responsable del tratamiento</h2>
  <p>
    <strong>Industrias ADSI–SRM–ODI</strong> (en adelante "ODI") con domicilio en Pereira, Colombia.
    Para asuntos relacionados con tratamiento de datos personales:
  </p>
  <ul>
    <li>Correo electrónico: <a href="mailto:privacidad@liveodi.com">privacidad@liveodi.com</a></li>
    <li>Sitio web: <a href="https://liveodi.com">https://liveodi.com</a></li>
  </ul>
</section>

<section>
  <h2>2. Marco legal aplicable</h2>
  <p>
    Esta política se rige por la <strong>Ley 1581 de 2012</strong> (Régimen General de Protección
    de Datos Personales — Habeas Data) y el <strong>Decreto Reglamentario 1377 de 2013</strong> de
    la República de Colombia, así como por las directrices de la
    <a href="https://www.sic.gov.co" target="_blank" rel="noopener">Superintendencia de Industria y Comercio (SIC)</a>.
  </p>
</section>

<section>
  <h2>3. Datos personales que tratamos</h2>
  <p>ODI recolecta y trata los siguientes datos personales:</p>
  <ul>
    <li><strong>Datos de identificación:</strong> nombre completo, correo electrónico, teléfono.</li>
    <li><strong>Datos de uso:</strong> historial de interacciones, fichas técnicas consultadas, productos vistos.</li>
    <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo, identificadores de sesión.</li>
    <li><strong>Datos de geolocalización:</strong> únicamente cuando el titular lo autoriza expresamente.</li>
  </ul>
  <p>
    <strong>NO recolectamos datos sensibles</strong> (salud, orientación sexual, opiniones políticas,
    convicciones religiosas) salvo autorización expresa y específica del titular.
  </p>
</section>

<section>
  <h2>4. Finalidades del tratamiento</h2>
  <p>Los datos personales se tratan para las siguientes finalidades:</p>
  <ul>
    <li>Prestar los servicios de la plataforma ODI (catálogos, búsqueda, recomendación de productos).</li>
    <li>Gestionar la cuenta del usuario y autenticación segura.</li>
    <li>Comunicaciones operacionales (confirmaciones, alertas técnicas, soporte).</li>
    <li>Mejora del servicio mediante analítica agregada y anónima.</li>
    <li>Cumplimiento de obligaciones legales aplicables.</li>
  </ul>
  <p>
    Los datos <strong>NO se utilizan para marketing automatizado de terceros</strong> sin
    consentimiento expreso e informado del titular.
  </p>
</section>

<section>
  <h2>5. Derechos del titular</h2>
  <p>Conforme a la Ley 1581 de 2012, usted tiene derecho a:</p>
  <ul>
    <li><strong>Conocer</strong> los datos personales que ODI tiene sobre usted.</li>
    <li><strong>Actualizar</strong> y rectificar datos inexactos o incompletos.</li>
    <li><strong>Solicitar prueba</strong> de la autorización otorgada para el tratamiento.</li>
    <li><strong>Revocar la autorización</strong> y solicitar la supresión de datos cuando no exista deber legal o contractual de conservarlos.</li>
    <li><strong>Acceder de forma gratuita</strong> a sus datos cada vez que sea necesario.</li>
    <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC).</li>
  </ul>
  <p>
    Para ejercer estos derechos, envíe correo a
    <a href="mailto:privacidad@liveodi.com">privacidad@liveodi.com</a> con asunto
    "Habeas Data — [tipo de solicitud]". Responderemos en máximo 15 días hábiles.
  </p>
</section>

<section>
  <h2>6. Seguridad y conservación</h2>
  <p>
    ODI implementa medidas técnicas y administrativas razonables para proteger sus datos:
    cifrado en tránsito (TLS), almacenamiento con acceso restringido por roles, auditoría
    diaria de configuración (Doctrina #25 — verificación runtime), backups encriptados con
    GPG, y planes de recuperación ante desastres (RUNBOOK_DR v1).
  </p>
  <p>
    Conservamos sus datos por el tiempo necesario para cumplir las finalidades descritas o
    mientras exista relación con el titular. Una vez finalizada, se procede a su supresión segura.
  </p>
</section>

<section>
  <h2>7. Transferencia y transmisión de datos</h2>
  <p>
    ODI <strong>NO transfiere datos personales a terceros</strong> sin consentimiento expreso.
    Las transferencias necesarias para operación (proveedores de infraestructura, motores de IA
    para procesamiento) se realizan bajo acuerdos contractuales que garantizan estándares
    equivalentes de protección.
  </p>
  <p>
    Lista de encargados actuales:
  </p>
  <ul>
    <li><strong>DigitalOcean:</strong> alojamiento del servidor (datos en reposo cifrados).</li>
    <li><strong>OpenAI / Anthropic / Google / Groq:</strong> motores de IA para procesamiento de consultas
      (datos transitorios, no almacenamiento persistente por estos terceros).</li>
    <li><strong>ElevenLabs:</strong> síntesis de voz (texto transitorio).</li>
    <li><strong>Meta WhatsApp Cloud API:</strong> mensajería con consentimiento del titular.</li>
  </ul>
</section>

<section>
  <h2>8. Cookies y tecnologías similares</h2>
  <p>
    Utilizamos cookies estrictamente necesarias para el funcionamiento del sitio
    (autenticación, preferencias). NO usamos cookies de publicidad de terceros sin
    consentimiento expreso. Detalle en nuestra
    <a href="/cookies">Política de Cookies</a> (próximamente).
  </p>
</section>

<section>
  <h2>9. Modificaciones a esta política</h2>
  <p>
    ODI puede actualizar esta política. Cambios sustanciales serán notificados por correo
    electrónico al titular o mediante aviso prominente en la plataforma con anticipación
    razonable.
  </p>
</section>

<section>
  <h2>10. Contacto y consultas</h2>
  <p>
    Para cualquier pregunta sobre esta política o el tratamiento de sus datos:
  </p>
  <ul>
    <li>Correo: <a href="mailto:privacidad@liveodi.com">privacidad@liveodi.com</a></li>
    <li>Asunto sugerido: "Habeas Data — [consulta / actualización / supresión / queja]"</li>
  </ul>
</section>

<footer>
  <p>
    <strong>Industrias ADSI–SRM–ODI</strong> · Pereira, Colombia ·
    <a href="/terms">Términos y Condiciones</a> ·
    <a href="/privacy">Política de Privacidad</a> ·
    Versión 1.0 — 7-may-2026
  </p>
  <p>
    Esta política es una versión mínima viable conforme Ley 1581/2012. La versión final certificada
    por asesoría legal está pendiente y sustituirá a esta cuando esté lista.
  </p>
</footer>`;

export default function Privacy() {
  useEffect(() => {
    document.title = "Privacy — ODI";
  }, []);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `body { font-family: system-ui, sans-serif; max-width: 760px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #222; }
h1, h2 { color: #003366; }
a { color: #0066cc; }
section { margin-bottom: 1.5rem; }
.meta { font-size: 0.9rem; color: #666; }
footer { margin-top: 3rem; font-size: 0.85rem; color: #888; border-top: 1px solid #ddd; padding-top: 1rem; }` }} />
      <article dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
