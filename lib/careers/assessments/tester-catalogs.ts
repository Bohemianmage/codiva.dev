import type { AssessmentCatalog, AssessmentQuestion } from './types';

function catalog(
  key: string,
  title: string,
  intro: string,
  questions: AssessmentQuestion[]
): AssessmentCatalog {
  return {
    key,
    title,
    intro,
    questionCount: 8,
    timeLimitSec: 15 * 60,
    passPct: 70,
    questions,
  };
}

export const TESTER_FRONTEND: AssessmentCatalog = catalog(
  'tester-frontend',
  'Prueba de criterio · Tester frontend',
  'Ocho situaciones de testing de interfaz en productos a la medida. No buscamos que programes el front: buscamos que sepas qué romper, cómo reportarlo y qué no es un bug. Tienes 15 minutos. Al aprobar, reportas un hallazgo de tu oficio en el sitio. Sin las dos partes no se habilita el CV.',
  [
    {
      id: 'tf-empty-error-loading',
      competency: 'Estados',
      type: 'multi',
      points: 2,
      prompt:
        'Vas a probar un formulario de alta. Marca todo lo que tienes que ver antes de darlo por «listo».',
      options: [
        { key: 'a', label: 'Vacío: validación, foco y mensaje cuando se envía sin datos.' },
        { key: 'b', label: 'Error de servidor: el usuario entiende qué pasó y puede reintentar.' },
        { key: 'c', label: 'Carga: no se puede mandar dos veces ni parece colgado.' },
        { key: 'd', label: 'Éxito: confirmación y el dato aparece donde el flujo promete.' },
        { key: 'e', label: 'Solo que el botón sea del color del Figma.' },
      ],
      correct: ['a', 'b', 'c', 'd'],
    },
    {
      id: 'tf-preference-vs-bug',
      competency: 'Criterio',
      type: 'single',
      points: 2,
      context:
        'El cliente dice: «el botón debería ser más grande». El flujo funciona, hay criterio de aceptación de acción, no de tamaño.',
      prompt: '¿Qué reportas?',
      options: [
        { key: 'a', label: 'Bug bloqueante de UI: se para el release.' },
        {
          key: 'b',
          label:
            'Preferencia / cambio de diseño: se documenta y se confirma con diseño/PM, no se trata como defecto de producto.',
        },
        { key: 'c', label: 'Nada: si funciona, no se deja rastro.' },
        { key: 'd', label: 'Regresión de accesibilidad, siempre.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tf-icon-button',
      competency: 'Accesibilidad',
      type: 'single',
      points: 2,
      prompt:
        'Hay un botón solo con ícono (basura) para borrar un ítem. En teclado llega el foco, pero un lector de pantalla dice «botón». ¿Qué es?',
      options: [
        { key: 'a', label: 'Detalle estético: se ignora.' },
        {
          key: 'b',
          label:
            'Defecto de accesibilidad: falta nombre accesible. Se reporta con pasos de teclado/lector, no como «se ve feo».',
        },
        { key: 'c', label: 'Solo importa si el cliente pidió WCAG en el contrato.' },
        { key: 'd', label: 'Se arregla subiendo el contraste del ícono.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tf-desktop-only',
      competency: 'Cobertura',
      type: 'single',
      points: 2,
      context:
        'El flujo se ve bien en tu monitor. Nadie abrió el viewport chico. El producto es web para operación diaria en laptop y celular.',
      prompt: '¿Qué haces antes de decir «probado»?',
      options: [
        { key: 'a', label: 'Darlo por bueno: si en desktop pasa, el resto es cosmética.' },
        {
          key: 'b',
          label:
            'Probar al menos un ancho chico y un caso táctil de los flujos críticos; documentar qué no cubriste.',
        },
        { key: 'c', label: 'Pedir que diseño entregue 14 mockups más antes de tocar el build.' },
        { key: 'd', label: 'Solo mirar el Lighthouse y copiar el score al ticket.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tf-overlap-report',
      competency: 'Evidencia',
      type: 'multi',
      points: 2,
      prompt: 'Un texto se monta sobre un botón en un ancho concreto. ¿Qué lleva el reporte?',
      options: [
        { key: 'a', label: 'Ancho de viewport, navegador y zoom.' },
        { key: 'b', label: 'Captura o video donde se ve el solape.' },
        { key: 'c', label: 'URL, usuario de prueba y pasos hasta esa pantalla.' },
        { key: 'd', label: '«CSS mal hecho, rehacer el front».' },
        { key: 'e', label: 'Si pasa siempre o solo con un texto largo / idioma.' },
      ],
      correct: ['a', 'b', 'c', 'e'],
    },
    {
      id: 'tf-optimistic-lie',
      competency: 'Estados',
      type: 'single',
      points: 2,
      context:
        'Al guardar, la UI muestra «Listo» al instante. El request falla. Al recargar, el cambio no está.',
      prompt: '¿Cómo lo tratas?',
      options: [
        { key: 'a', label: 'No es bug: el front «se siente rápido».' },
        {
          key: 'b',
          label:
            'Defecto: el usuario recibió un éxito falso. Se reporta con red/fail y el estado al recargar.',
        },
        { key: 'c', label: 'Solo backend: la UI no se menciona.' },
        { key: 'd', label: 'Se espera a que el cliente lo note en UAT.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tf-rank-checkout',
      competency: 'Prioridad',
      type: 'rank',
      points: 2,
      prompt:
        'Antes de un pase a producción de un checkout, ordena qué atacas primero (1 = primero).',
      options: [
        { key: 'a', label: 'Pagar con el medio feliz y ver confirmación + cargo coherente.' },
        { key: 'b', label: 'Error de pago, doble clic y sesión caducada.' },
        { key: 'c', label: 'Tipografía 1 px distinta al mock en el footer.' },
        { key: 'd', label: 'Vacío del carrito y volver atrás sin perder el contexto.' },
      ],
      correct: ['a', 'b', 'd', 'c'],
    },
    {
      id: 'tf-my-machine',
      competency: 'Ambiente',
      type: 'single',
      points: 2,
      prompt: 'En tu Chrome está bien. El cliente en Safari ve la pantalla en blanco. ¿Qué sigue?',
      options: [
        { key: 'a', label: 'Cerrar: «en mi máquina funciona».' },
        {
          key: 'b',
          label:
            'Reproducir en el navegador/ambiente del reporte, aislar y evidenciar; no discutir el gusto del cliente.',
        },
        { key: 'c', label: 'Pedirle que se pase a Chrome y olvidar el ticket.' },
        { key: 'd', label: 'Marcar como no reproducible sin intentar Safari.' },
      ],
      correct: ['b'],
    },
  ]
);

export const TESTER_BACKEND: AssessmentCatalog = catalog(
  'tester-backend',
  'Prueba de criterio · Tester backend',
  'Ocho situaciones de testing de APIs, auth y datos en software a la medida. No buscamos que implementes el servidor: buscamos contratos, permisos y evidencia. Tienes 15 minutos. Al aprobar, reportas un hallazgo de tu oficio en el sitio. Sin las dos partes no se habilita el CV.',
  [
    {
      id: 'tb-200-empty',
      competency: 'Contrato',
      type: 'single',
      points: 2,
      prompt:
        'El endpoint de crear recurso responde 200 con cuerpo vacío. El front no sabe si se creó. El criterio decía devolver el recurso o un id.',
      options: [
        { key: 'a', label: 'Pasa: 200 es éxito.' },
        {
          key: 'b',
          label:
            'Defecto de contrato: status y cuerpo no cumplen lo acordado. Se reporta con request/response.',
        },
        { key: 'c', label: 'Solo es tema del front por no adivinar.' },
        { key: 'd', label: 'Se ignora si en la base sí se insertó.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tb-idor',
      competency: 'Auth',
      type: 'single',
      points: 2,
      context:
        'Con el token del usuario A pides el recurso del usuario B cambiando el id en la URL. El servidor lo entrega.',
      prompt: '¿Qué es?',
      options: [
        { key: 'a', label: 'Detalle: si no está en el UAT del cliente, no se reporta.' },
        {
          key: 'b',
          label:
            'Defecto grave de autorización. Se reporta con usuarios de prueba, ids y respuesta; no se explota más de lo necesario.',
        },
        { key: 'c', label: 'Feature: así es más fácil el soporte.' },
        { key: 'd', label: 'Se avisa por Slack sin ticket ni pasos.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tb-double-post',
      competency: 'Idempotencia',
      type: 'single',
      points: 2,
      prompt: 'Un POST de cobro se dispara dos veces por reintento de red. ¿Qué miras?',
      options: [
        { key: 'a', label: 'Nada: el usuario hizo clic, dos cargos están bien.' },
        {
          key: 'b',
          label:
            'Si el contrato era un cargo, dos cargos son defecto. Evidencia: ids, idempotency key, extracto o filas.',
        },
        { key: 'c', label: 'Solo UI: el backend no se prueba así.' },
        { key: 'd', label: 'Esperar a que finanzas lo note el mes siguiente.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tb-client-only-validation',
      competency: 'Validación',
      type: 'single',
      points: 2,
      prompt:
        'El front no deja mandar un email inválido. Con un cliente HTTP mandas el mismo payload y el API lo acepta.',
      options: [
        { key: 'a', label: 'Pasa: el usuario normal no usa curl.' },
        {
          key: 'b',
          label:
            'Defecto: la regla de negocio tiene que sostenerse en servidor. Se reporta el request que bypassa el front.',
        },
        { key: 'c', label: 'Mejora opcional de UX, no de API.' },
        { key: 'd', label: 'Se cierra porque el linter del front está verde.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tb-api-report',
      competency: 'Evidencia',
      type: 'multi',
      points: 2,
      prompt: 'Marca lo que tiene que llevar un reporte de API para que desarrollo no adivine.',
      options: [
        { key: 'a', label: 'Método, URL, headers relevantes (sin secretos) y cuerpo.' },
        { key: 'b', label: 'Status y cuerpo de respuesta, con hora y ambiente.' },
        { key: 'c', label: 'Resultado esperado vs. obtenido.' },
        { key: 'd', label: 'Pegar el .env de producción «para que lo vean».' },
        { key: 'e', label: 'Usuario/rol de prueba con el que se reprodujo.' },
      ],
      correct: ['a', 'b', 'c', 'e'],
    },
    {
      id: 'tb-rank-auth',
      competency: 'Prioridad',
      type: 'rank',
      points: 2,
      prompt: 'Ordena qué pruebas de un API de cuentas atacas primero (1 = primero).',
      options: [
        { key: 'a', label: 'Login válido y que el token no sirva en el recurso de otro usuario.' },
        { key: 'b', label: 'Campos requeridos y tipos inválidos.' },
        { key: 'c', label: 'Orden alfabético de un campo opcional en un listado secundario.' },
        { key: 'd', label: 'Refresh/expiración de sesión en un flujo crítico.' },
      ],
      correct: ['a', 'd', 'b', 'c'],
    },
    {
      id: 'tb-staging-prod',
      competency: 'Ambiente',
      type: 'single',
      points: 2,
      prompt: 'Staging apunta a un proveedor de pagos real. ¿Qué haces?',
      options: [
        { key: 'a', label: 'Probar con tarjeta real «un poquito» para ver si jala.' },
        {
          key: 'b',
          label:
            'Parar y escalar: no se prueba con dinero/datos reales. Se pide ambiente sandbox y se deja evidencia del riesgo.',
        },
        { key: 'c', label: 'Seguir: si el PM no dijo nada, no es tu problema.' },
        { key: 'd', label: 'Borrar la tabla de cobros a mano y continuar.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tb-pagination',
      competency: 'Contrato',
      type: 'single',
      points: 2,
      prompt:
        'La primera página trae 20. La segunda trae 20 que incluyen 3 de la primera. El cliente pagina en UI.',
      options: [
        { key: 'a', label: 'Cosmético: el usuario puede deduplicar de vista.' },
        {
          key: 'b',
          label:
            'Defecto de listado: duplicados/huecos rompen operación. Se reporta con cursor/offset y dos responses.',
        },
        { key: 'c', label: 'Solo se prueba el totalCount, no las páginas.' },
        { key: 'd', label: 'Se espera a que el front cachee y «se quite».' },
      ],
      correct: ['b'],
    },
  ]
);

export const TESTER_FULLSTACK: AssessmentCatalog = catalog(
  'tester-fullstack',
  'Prueba de criterio · Tester full stack',
  'Ocho situaciones de testing de punta a punta: UI, API y operación. Buscamos que persigas el hueco entre capas, no que «el front se ve bien». Tienes 15 minutos. Al aprobar, reportas un hallazgo de tu oficio en el sitio. Sin las dos partes no se habilita el CV.',
  [
    {
      id: 'ts-ui-ok-api-fail',
      competency: 'Capas',
      type: 'single',
      points: 2,
      context:
        'La pantalla muestra «Guardado». En red el POST va 500. Al recargar, no hay cambio.',
      prompt: '¿Cuál es el reporte correcto?',
      options: [
        { key: 'a', label: 'Cerrar el de UI: se vio el toast.' },
        {
          key: 'b',
          label:
            'Defecto de punta a punta: éxito en UI con fallo de API. Evidencia de red + estado al recargar.',
        },
        { key: 'c', label: 'Dos tickets aislados sin relacionarlos.' },
        { key: 'd', label: 'Esperar a backend; QA de front no mira red.' },
      ],
      correct: ['b'],
    },
    {
      id: 'ts-stale-cache',
      competency: 'Datos',
      type: 'single',
      points: 2,
      prompt:
        'El usuario edita un dato, vuelve al listado y ve el valor viejo. Un refresh fuerte ya muestra el nuevo.',
      options: [
        { key: 'a', label: 'No es bug: que recarguen.' },
        {
          key: 'b',
          label:
            'Defecto de consistencia (cache/revalidación). Se reporta navegación exacta, no solo «a veces tarda».',
        },
        { key: 'c', label: 'Solo diseño: el listado «debería animar».' },
        { key: 'd', label: 'Se ignora si el API en Postman está bien.' },
      ],
      correct: ['b'],
    },
    {
      id: 'ts-flag-mismatch',
      competency: 'Release',
      type: 'single',
      points: 2,
      prompt:
        'El front ya muestra un módulo nuevo. El API de ese módulo no está en el ambiente. La pantalla queda a medias.',
      options: [
        { key: 'a', label: 'El tester «no cubre deploys».' },
        {
          key: 'b',
          label:
            'Hueco de entrega: se reporta el desfase front/API/flag y se bloquea comunicar «listo» al cliente.',
        },
        { key: 'c', label: 'Se oculta el menú a mano en producción y se olvida.' },
        { key: 'd', label: 'Pasa: el diseño ya estaba aprobado.' },
      ],
      correct: ['b'],
    },
    {
      id: 'ts-rank-login',
      competency: 'Investigación',
      type: 'rank',
      points: 2,
      prompt: 'Ticket: «el login no sirve». Ordena cómo investigas (1 = primero).',
      options: [
        { key: 'a', label: 'Reproducir en el ambiente del reporte con usuario de prueba.' },
        { key: 'b', label: 'Ver red: status del auth, cookies/token, redirect.' },
        { key: 'c', label: 'Pedir un rediseño completo del login.' },
        { key: 'd', label: 'Aislar: credencial mala vs. 500 vs. front que no guarda sesión.' },
      ],
      correct: ['a', 'b', 'd', 'c'],
    },
    {
      id: 'ts-contract-drift',
      competency: 'Contrato',
      type: 'multi',
      points: 2,
      prompt: 'El front espera `customerId` y el API ahora manda `customer_id`. ¿Qué haces?',
      options: [
        { key: 'a', label: 'Reproducir el flujo y capturar request/response.' },
        { key: 'b', label: 'Nombrar el campo esperado vs. el recibido.' },
        { key: 'c', label: 'Decidir tú solo el rename en producción.' },
        { key: 'd', label: 'Avisar a front y back: es un hueco de contrato, no «un CSS».' },
        { key: 'e', label: 'Cerrar porque «en JSON da igual».' },
      ],
      correct: ['a', 'b', 'd'],
    },
    {
      id: 'ts-webhook-ui',
      competency: 'Integraciones',
      type: 'single',
      points: 2,
      prompt:
        'El proveedor cobra y manda webhook. La UI de «pagado» no se actualiza. El extracto del proveedor sí muestra el cargo.',
      options: [
        { key: 'a', label: 'Pasa: el dinero ya salió.' },
        {
          key: 'b',
          label:
            'Defecto de consistencia operativa: hay que ver webhook, cola y lo que la UI lee. Evidencia de los tres.',
        },
        { key: 'c', label: 'Solo finanzas, QA no toca webhooks.' },
        { key: 'd', label: 'Pedir al cliente que recargue en una hora.' },
      ],
      correct: ['b'],
    },
    {
      id: 'ts-timezone',
      competency: 'Datos',
      type: 'single',
      points: 2,
      prompt:
        'Una cita se agenda a las 10:00 en México. En el correo sale 16:00. El API guarda UTC.',
      options: [
        { key: 'a', label: 'Nitpick de copy.' },
        {
          key: 'b',
          label:
            'Defecto de zona horaria entre capas. Se reporta con tz del usuario, valor en API y valor renderizado.',
        },
        { key: 'c', label: 'Se cambia el reloj de la laptop de QA y se cierra.' },
        { key: 'd', label: 'Solo pasa si el cliente viaja.' },
      ],
      correct: ['b'],
    },
    {
      id: 'ts-e2e-vs-unit',
      competency: 'Cobertura',
      type: 'single',
      points: 2,
      prompt: 'Hay tests unitarios verdes. El flujo real en staging falla al pagar. ¿Qué pesa más para el pase?',
      options: [
        { key: 'a', label: 'Los unitarios: si CI está verde, se libera.' },
        {
          key: 'b',
          label:
            'El flujo real en el ambiente de entrega. Los unitarios no sustituyen el camino que usa el cliente.',
        },
        { key: 'c', label: 'Ninguno: solo cuenta el UAT del cliente, aunque sea el viernes a las 7.' },
        { key: 'd', label: 'Un screenshot del Figma.' },
      ],
      correct: ['b'],
    },
  ]
);

export const TESTER_UX: AssessmentCatalog = catalog(
  'tester-ux-ui',
  'Prueba de criterio · Tester UX/UI',
  'Ocho situaciones de testing de flujo, copy y usabilidad. No buscamos que rediseñes el producto: buscamos que detectes cuando la interfaz miente, traba o no se puede usar. Tienes 15 minutos. Al aprobar, reportas un hallazgo de tu oficio en el sitio. Sin las dos partes no se habilita el CV.',
  [
    {
      id: 'tu-empty-state',
      competency: 'Flujos',
      type: 'single',
      points: 2,
      prompt:
        'Un listado nuevo no tiene filas. La pantalla queda en blanco, sin texto ni acción para crear el primero.',
      options: [
        { key: 'a', label: 'Pasa: no hay datos, no hay nada que probar.' },
        {
          key: 'b',
          label:
            'Defecto de flujo: falta estado vacío usable. Se reporta con cuenta nueva y lo que el usuario no puede hacer.',
        },
        { key: 'c', label: 'Se pide un illustration contest y se bloquea el release por estética.' },
        { key: 'd', label: 'Solo diseño; QA de UX no abre cuentas vacías.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tu-copy-lie',
      competency: 'Copy',
      type: 'single',
      points: 2,
      prompt:
        'El botón dice «Descargar PDF». Hace una navegación a otra pantalla y no descarga nada.',
      options: [
        { key: 'a', label: 'Preferencia de wording.' },
        {
          key: 'b',
          label:
            'Defecto: la interfaz promete una acción y hace otra. Se reporta esperado vs. obtenido.',
        },
        { key: 'c', label: 'Bien: más páginas = más engagement.' },
        { key: 'd', label: 'Se ignora si el PDF «se puede sacar luego» de otra ruta.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tu-modal-trap',
      competency: 'Accesibilidad',
      type: 'single',
      points: 2,
      prompt:
        'Un modal de confirmación no se cierra con Escape, el foco se queda atrás y no hay botón visible de cancelar en móvil.',
      options: [
        { key: 'a', label: 'Detalle de animación.' },
        {
          key: 'b',
          label:
            'Defecto de uso: el usuario puede quedar atrapado. Se reporta teclado + viewport chico.',
        },
        { key: 'c', label: 'Solo importa en desktop con mouse.' },
        { key: 'd', label: 'Se espera el rediseño del design system el próximo trimestre.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tu-figma-vs-build',
      competency: 'Handoff',
      type: 'single',
      points: 2,
      context:
        'El build no trae el estado de error que sí está en Figma. El flujo en staging no muestra qué falló.',
      prompt: '¿Qué haces?',
      options: [
        { key: 'a', label: 'Cerrar: «el dev no copió el Figma», sin evidencia.' },
        {
          key: 'b',
          label:
            'Reportar el hueco diseño↔build con captura de ambos y el impacto en el flujo; no es un capricho visual.',
        },
        { key: 'c', label: 'Redibujar tú el error en un PNG y sustituir el ticket.' },
        { key: 'd', label: 'Aprobar: el happy path se ve parecido.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tu-ux-report',
      competency: 'Evidencia',
      type: 'multi',
      points: 2,
      prompt: 'Marca lo que sí va en un reporte de usabilidad para que no parezca «me gusta / no me gusta».',
      options: [
        { key: 'a', label: 'Qué intentaba hacer el usuario y dónde se trabó.' },
        { key: 'b', label: 'Pasos, viewport y captura del estado.' },
        { key: 'c', label: 'Si bloquea una tarea o es cosmética.' },
        { key: 'd', label: '«Yo lo habría diseñado distinto», sin tarea concreta.' },
        { key: 'e', label: 'Referencia al criterio o al flujo acordado, si existe.' },
      ],
      correct: ['a', 'b', 'c', 'e'],
    },
    {
      id: 'tu-rank-release',
      competency: 'Severidad',
      type: 'rank',
      points: 2,
      prompt: 'Ordena qué atacas primero el día del pase (1 = primero).',
      options: [
        { key: 'a', label: 'No se puede completar el flujo de dinero o de acceso.' },
        { key: 'b', label: 'El usuario no entiende un error y reintenta mal.' },
        { key: 'c', label: 'El espaciado del hero no calza con el mock.' },
        { key: 'd', label: 'Un estado vacío sin siguiente paso en un módulo secundario.' },
      ],
      correct: ['a', 'b', 'd', 'c'],
    },
    {
      id: 'tu-preference',
      competency: 'Criterio',
      type: 'single',
      points: 2,
      prompt:
        'A ti te gusta más el CTA a la izquierda. El criterio y el diseño aprobado lo ponen a la derecha. El flujo se completa.',
      options: [
        {
          key: 'a',
          label: 'Bug de UX: tu gusto es el estándar.',
        },
        {
          key: 'b',
          label:
            'No es defecto. Si hay un problema real de uso, se argumenta con tarea y evidencia, no con preferencia personal.',
        },
        { key: 'c', label: 'Se cambia en producción sin avisar.' },
        { key: 'd', label: 'Se bloquea el release hasta un workshop de branding.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tu-destructive',
      competency: 'Flujos',
      type: 'single',
      points: 2,
      prompt:
        '«Eliminar organización» está al lado de «Guardar», mismo estilo, sin confirmación. Un clic borra.',
      options: [
        { key: 'a', label: 'Ahorro de clics: bien.' },
        {
          key: 'b',
          label:
            'Defecto de riesgo: acción destructiva sin fricción. Se reporta con el clic y el resultado irreversible.',
        },
        { key: 'c', label: 'Solo si el cliente ya perdió datos.' },
        { key: 'd', label: 'Se resuelve con un tooltip de «ten cuidado».' },
      ],
      correct: ['b'],
    },
  ]
);

export const TESTER_GENERAL: AssessmentCatalog = catalog(
  'tester-general',
  'Prueba de criterio · Tester',
  'Ocho situaciones de testing en productos a la medida, sin especialidad única. Buscamos evidencia, severidad y no confundir defecto con preferencia. Tienes 15 minutos. Al aprobar, reportas un hallazgo de tu oficio en el sitio. Sin las dos partes no se habilita el CV.',
  [
    {
      id: 'tg-repro',
      competency: 'Evidencia',
      type: 'single',
      points: 2,
      prompt: 'No puedes reproducir un reporte del cliente. ¿Qué haces primero?',
      options: [
        { key: 'a', label: 'Cerrar como no reproducible.' },
        {
          key: 'b',
          label:
            'Pedir ambiente, usuario, hora y pasos; intentar esas condiciones; dejar constancia de lo que sí/no viste.',
        },
        { key: 'c', label: 'Marcar P0 y parar el release sin datos.' },
        { key: 'd', label: 'Pedirle al cliente un rediseño.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tg-severity',
      competency: 'Severidad',
      type: 'single',
      points: 2,
      prompt: '¿Qué describe mejor severidad vs. prioridad?',
      options: [
        { key: 'a', label: 'Son lo mismo.' },
        {
          key: 'b',
          label:
            'Severidad = impacto en producto/usuario. Prioridad = cuándo conviene atacarlo dado el negocio y la entrega.',
        },
        { key: 'c', label: 'Prioridad la pone QA; severidad el cliente.' },
        { key: 'd', label: 'Severidad es el número de casos fallidos.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tg-uat',
      competency: 'UAT',
      type: 'single',
      points: 2,
      context:
        'El cliente en UAT marca «ok» un flujo que en staging falla con el usuario de prueba. Quiere salir mañana.',
      prompt: '¿Qué haces?',
      options: [
        { key: 'a', label: 'Liberar: el cliente firmó.' },
        {
          key: 'b',
          label:
            'Mostrar la evidencia de staging, no contradecir de a gratis, y no comunicar listo hasta cerrar el hueco o aceptar el riesgo por escrito.',
        },
        { key: 'c', label: 'Callar para no tensar.' },
        { key: 'd', label: 'Reabrir todos los tickets del sprint.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tg-scope',
      competency: 'Alcance',
      type: 'multi',
      points: 2,
      prompt: 'Marca prácticas sanas cuando el tiempo de prueba se acorta a la mitad.',
      options: [
        { key: 'a', label: 'Declarar qué flujos críticos sí cubres y cuáles no.' },
        { key: 'b', label: 'Mentir el alcance para que el tablero se vea verde.' },
        { key: 'c', label: 'Priorizar dinero, acceso y pérdida de datos.' },
        { key: 'd', label: 'Dejar rastros de lo no probado para PM/dev.' },
        { key: 'e', label: 'Probar solo el color del logo.' },
      ],
      correct: ['a', 'c', 'd'],
    },
    {
      id: 'tg-rank-triage',
      competency: 'Prioridad',
      type: 'rank',
      points: 2,
      prompt: 'Ordena el triage de una hora (1 = primero).',
      options: [
        { key: 'a', label: 'No se puede entrar o no se puede cobrar.' },
        { key: 'b', label: 'Datos mal guardados en un flujo usado diario.' },
        { key: 'c', label: 'Typo en un texto de ayuda.' },
        { key: 'd', label: 'Un filtro secundario mal ordenado.' },
      ],
      correct: ['a', 'b', 'd', 'c'],
    },
    {
      id: 'tg-fix-verify',
      competency: 'Regresión',
      type: 'single',
      points: 2,
      prompt: 'Dev dice «ya quedó». ¿Qué confirma el arreglo?',
      options: [
        { key: 'a', label: 'El ticket pasó a done.' },
        {
          key: 'b',
          label:
            'Reproducir el caso original en el ambiente acordado y una regresión corta de lo tocado.',
        },
        { key: 'c', label: 'Una captura del diff, sin ejecutar el flujo.' },
        { key: 'd', label: 'Confiar: ya conoces al dev.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tg-env',
      competency: 'Ambiente',
      type: 'single',
      points: 2,
      prompt: 'Prod, staging y tu local no coinciden. El bug solo aparece en staging. ¿Qué reportas?',
      options: [
        { key: 'a', label: 'Nada: si local está bien, no existe.' },
        {
          key: 'b',
          label:
            'El defecto en staging, con ambiente explícito, y la diferencia que viste. No lo escondas porque local «está limpio».',
        },
        { key: 'c', label: 'Solo prod: staging no cuenta.' },
        { key: 'd', label: 'Borrar staging y rehacerlo sin avisar.' },
      ],
      correct: ['b'],
    },
    {
      id: 'tg-not-a-bug',
      competency: 'Criterio',
      type: 'single',
      points: 2,
      prompt:
        'El cliente quiere una columna nueva que nunca estuvo en alcance. El flujo actual cumple el criterio.',
      options: [
        { key: 'a', label: 'Bug: el cliente siempre tiene razón.' },
        {
          key: 'b',
          label:
            'Cambio de alcance: se documenta y se escala a PM, no se cuela como defecto para «que lo saquen».',
        },
        { key: 'c', label: 'Se implementa callado para quedar bien.' },
        { key: 'd', label: 'Se rechaza al cliente sin dejar rastro.' },
      ],
      correct: ['b'],
    },
  ]
);
