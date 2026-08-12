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
  'Tester / QA',
  $qa_desc$Sobre el rol:
En Codiva.dev el software se diseña para operar negocios reales. Buscamos testers / QA que validen flujos, regresiones y criterios de aceptación antes de una entrega o un pase a producción, con evidencia clara y sin teatro de proceso.

Responsabilidades:
- Diseñar y ejecutar pruebas sobre productos de software a la medida y productos digitales de Codiva.dev.
- Validar flujos críticos, regresiones y criterios de aceptación antes de una entrega o pase a producción.
- Reportar defectos con pasos, evidencia y severidad en las herramientas del equipo.
- Acompañar UAT con el cliente o stakeholders cuando el proyecto lo requiera.
- Verificar correcciones y confirmar que el arreglo no rompe lo ya entregado.
- Apoyar la calidad operativa del estudio: checklists, ambientes de prueba y handoff a desarrollo.
- Otras actividades afines a testing y QA que Codiva asigne según las necesidades del estudio y de los proyectos.$qa_desc$,
  $qa_req$Requisitos:
- Experiencia práctica en testing funcional de aplicaciones web (exploratorio y casos guiados).
- Capacidad de escribir reportes reproducibles: pasos, resultado esperado vs. obtenido, capturas o URLs.
- Criterio para distinguir un defecto de una preferencia, y para priorizar lo que bloquea una entrega.
- Comunicación clara en español con desarrollo y, cuando aplique, con el cliente en UAT.
- Soltura trabajando en remoto y sobre varios productos a la vez.

Deseable:
- Familiaridad con Next.js, paneles admin, flujos de auth o pagos.
- Experiencia en QA de software a la medida (no solo scripts de e-commerce genérico).
- Nociones de API, ambientes de staging y regresiones entre sprints.$qa_req$,
  'Remoto · México',
  'full_time',
  'published',
  2,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM ops_job_postings WHERE lower(trim(slug)) = 'tester-qa'
);
