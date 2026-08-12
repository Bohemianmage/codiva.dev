-- Vacantes iniciales de la bolsa Codiva.dev (career.codiva.dev).

INSERT INTO ops_job_postings (
  slug,
  title,
  description,
  requirements,
  location,
  employment_type,
  status,
  sort_order,
  published_at
)
SELECT
  'project-manager',
  'Project Manager',
  $pm_desc$Sobre el rol:
En Codiva.dev desarrollamos software a la medida y lo llevamos a producción. El Project Manager es el punto de contacto operativo entre cliente, diseño, desarrollo y dirección: mantiene el ritmo, la claridad de prioridades y la calidad de la entrega.

Responsabilidades:
- Coordinar el avance de proyectos de software a la medida y productos digitales asignados.
- Ser el punto de contacto operativo entre cliente, diseño, desarrollo y dirección de Codiva.
- Dar seguimiento a alcance, tiempos, riesgos, dependencias y entregables en las herramientas del equipo Codiva.dev.
- Facilitar alineaciones, revisiones y demos con el cliente o stakeholders del proyecto.
- Mantener claridad de prioridades, comunicar bloqueos a tiempo y proponer siguientes pasos.
- Gestionar expectativas y cambios de alcance, escalando a dirección cuando afecten tiempos o costo.
- Apoyar la documentación operativa del proyecto (hitos, tickets, entregables y estatus).
- Participar en estimación, priorización y planeación de entregas cuando se requiera.
- Colaborar en la mejora de procesos operativos del estudio (rituales, plantillas, handoffs).
- Otras actividades afines al rol de Project Manager que Codiva asigne según las necesidades del estudio y de los proyectos.$pm_desc$,
  $pm_req$Requisitos:
- Experiencia coordinando proyectos de software o productos digitales (estudio, agencia o in-house).
- Comunicación clara en español, escrita y hablada, con clientes y con quien construye el producto.
- Criterio para priorizar, detectar riesgos y documentar acuerdos sin burocracia innecesaria.
- Soltura con herramientas de seguimiento (tickets, hitos, tableros) y con trabajo remoto.
- Capacidad de sostener expectativas cuando el alcance se mueve, y de escalar a tiempo.

Deseable:
- Familiaridad con entregas iterativas (sprints, demos, UAT).
- Experiencia en proyectos a la medida, no solo en producto único o marketing sites.$pm_req$,
  'Remoto · México',
  'full_time',
  'published',
  1,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM ops_job_postings WHERE lower(trim(slug)) = 'project-manager'
);

INSERT INTO ops_job_postings (
  slug,
  title,
  description,
  requirements,
  location,
  employment_type,
  status,
  sort_order,
  published_at
)
SELECT
  'tester-qa',
  'Tester · Frontend, Backend, Full stack, UX/UI y QA',
  $qa_desc$Sobre el rol:
En Codiva.dev el software se diseña para operar negocios reales. Buscamos testers, no perfiles de desarrollo o diseño para construir el producto: personas que validen flujos, regresiones y criterios de aceptación en el oficio que mejor dominan.

Al postular eliges tu oficio de testing y haces la prueba de criterio de ese oficio. Sin esa prueba no se habilita el CV.

Perfiles que buscamos:
- Tester frontend: UI, estados, accesibilidad, responsive y lo que el usuario ve y toca.
- Tester backend: APIs, auth, datos, permisos, contratos e integraciones.
- Tester full stack: el flujo de punta a punta, incluyendo huecos entre capas.
- Tester UX/UI: flujos, copy, usabilidad, estados vacíos/error y handoff diseño↔build.
- Tester QA: calidad transversal, regresiones, evidencia reproducible y UAT.

Responsabilidades:
- Diseñar y ejecutar pruebas en el oficio declarado, sobre productos a la medida de Codiva.dev.
- Reportar defectos con pasos, evidencia y severidad; no con opiniones sueltas.
- Distinguir un defecto de una preferencia o de un cambio de alcance.
- Verificar correcciones y una regresión corta de lo tocado.
- Acompañar UAT cuando el proyecto lo requiera.
- Otras actividades afines a testing que Codiva asigne según las necesidades del estudio y de los proyectos.$qa_desc$,
  $qa_req$Requisitos:
- Experiencia práctica testeando software (web, API o producto digital), no solo cursos.
- Capacidad de escribir reportes reproducibles: pasos, esperado vs. obtenido, ambiente y evidencia.
- Criterio para priorizar lo que bloquea una entrega.
- Comunicación clara en español con desarrollo y, cuando aplique, con el cliente en UAT.
- Soltura trabajando en remoto y sobre más de un producto a la vez.

Deseable:
- Familiaridad con Next.js, paneles admin, auth o pagos, según el oficio.
- Experiencia en software a la medida (estudio, agencia o in-house).
- Nociones de staging, regresiones entre sprints y handoff diseño ↔ desarrollo.$qa_req$,
  'Remoto · México',
  'full_time',
  'published',
  2,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM ops_job_postings WHERE lower(trim(slug)) = 'tester-qa'
);
