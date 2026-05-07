import { useEffect } from "react";

const html = `<h1>Términos y Condiciones de Uso</h1>

<p class="meta">
  <strong>Vigente desde:</strong> 7 de mayo de 2026 ·
  <strong>Versión:</strong> 1.0 (mínima viable)
</p>

<section>
  <h2>1. Aceptación</h2>
  <p>
    Al acceder y usar la plataforma ODI (<a href="https://liveodi.com">liveodi.com</a>) y sus servicios
    relacionados, usted acepta estos Términos y Condiciones. Si no está de acuerdo, no debe usar la plataforma.
  </p>
</section>

<section>
  <h2>2. Quiénes somos</h2>
  <p>
    <strong>Industrias ADSI–SRM–ODI</strong>, ecosistema digital de servicios de catalogación,
    búsqueda inteligente y asistencia conversacional para verticales industriales (motos, turismo,
    salud oral, profesionales, entre otros), con sede en Pereira, Colombia.
  </p>
</section>

<section>
  <h2>3. Servicios ofrecidos</h2>
  <p>ODI ofrece, sin limitación:</p>
  <ul>
    <li>Asistente conversacional (Ramona) con cadena ética de cobro acoplado.</li>
    <li>Catálogos enriquecidos de productos por vertical.</li>
    <li>Búsqueda semántica y por compatibilidad (m62-fitment SRM).</li>
    <li>Integración con tiendas Shopify (Manager Embedded).</li>
    <li>Recomendaciones personalizadas (Radar Persona, ADV - Aliento de Vida).</li>
  </ul>
</section>

<section>
  <h2>4. Cuenta de usuario</h2>
  <p>
    El usuario es responsable de mantener la confidencialidad de sus credenciales. Notificar
    inmediatamente cualquier uso no autorizado a <a href="mailto:soporte@liveodi.com">soporte@liveodi.com</a>.
    ODI puede suspender cuentas que infrinjan estos términos.
  </p>
</section>

<section>
  <h2>5. Uso aceptable</h2>
  <p>El usuario se compromete a:</p>
  <ul>
    <li>No usar la plataforma para fines ilegales o que infrinjan derechos de terceros.</li>
    <li>No realizar ingeniería inversa, scraping masivo, ni intentar comprometer la seguridad.</li>
    <li>No publicar contenido falso, ofensivo o que promueva discriminación.</li>
    <li>Respetar las cuotas de uso justo del servicio.</li>
  </ul>
</section>

<section>
  <h2>6. Modelo de cobro ético</h2>
  <p>
    ODI opera con un <strong>modelo de cobro acoplado a comportamiento ético</strong>. Las comisiones
    se calculan en función del valor real entregado al cliente y del puntaje de intervención del
    organismo. Existe modo "medición sola" (sin cobro) durante fases de evaluación, validación
    técnica, o cuando el guardián ético determina que la intervención no es facturable.
  </p>
  <p>
    El detalle del modelo (commission · score_intervención · estado_ético · cobro_permitido) está
    disponible bajo solicitud para clientes en relación contractual.
  </p>
</section>

<section>
  <h2>7. Propiedad intelectual</h2>
  <p>
    El software, código, diseño, doctrinas y memoria persistente de ODI son propiedad de
    <strong>Industrias ADSI–SRM–ODI</strong>. Los catálogos de cada cliente son propiedad de cada
    cliente y ODI los procesa bajo acuerdo de servicio.
  </p>
</section>

<section>
  <h2>8. Limitación de responsabilidad</h2>
  <p>
    ODI provee la plataforma "tal cual", con esfuerzo razonable de disponibilidad pero sin garantía
    de servicio ininterrumpido. ODI no responde por daños indirectos, consecuenciales o lucro
    cesante derivados del uso o imposibilidad de uso de la plataforma, dentro de los límites
    permitidos por la ley colombiana.
  </p>
  <p>
    Las recomendaciones del asistente Ramona son orientativas. Decisiones financieras, médicas,
    técnicas o legales basadas en sus respuestas son responsabilidad del usuario.
  </p>
</section>

<section>
  <h2>9. Datos personales</h2>
  <p>
    El tratamiento de datos personales se rige por la
    <a href="/privacy">Política de Privacidad</a> conforme Ley 1581 de 2012 (Habeas Data Colombia).
  </p>
</section>

<section>
  <h2>10. Modificaciones del servicio</h2>
  <p>
    ODI puede modificar características, suspender o discontinuar partes del servicio. Cambios
    sustanciales se notifican con anticipación razonable.
  </p>
</section>

<section>
  <h2>11. Terminación</h2>
  <p>
    El usuario puede dar por terminada la relación en cualquier momento solicitando supresión de
    cuenta vía <a href="mailto:soporte@liveodi.com">soporte@liveodi.com</a>. ODI puede terminar
    cuentas que infrinjan estos términos previa notificación cuando sea posible.
  </p>
</section>

<section>
  <h2>12. Ley aplicable y resolución de disputas</h2>
  <p>
    Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa será
    resuelta en los tribunales competentes de Pereira, Risaralda, salvo que la ley aplicable
    establezca otra jurisdicción.
  </p>
</section>

<section>
  <h2>13. Contacto</h2>
  <ul>
    <li>Soporte general: <a href="mailto:soporte@liveodi.com">soporte@liveodi.com</a></li>
    <li>Privacidad: <a href="mailto:privacidad@liveodi.com">privacidad@liveodi.com</a></li>
    <li>Web: <a href="https://liveodi.com">liveodi.com</a></li>
  </ul>
</section>

<footer>
  <p>
    <strong>Industrias ADSI–SRM–ODI</strong> · Pereira, Colombia ·
    <a href="/privacy">Política de Privacidad</a> ·
    <a href="/terms">Términos y Condiciones</a> ·
    Versión 1.0 — 7-may-2026
  </p>
  <p>
    Versión mínima viable. Versión final con asesoría legal pendiente.
  </p>
</footer>`;

export default function Terms() {
  useEffect(() => {
    document.title = "Terms — ODI";
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
