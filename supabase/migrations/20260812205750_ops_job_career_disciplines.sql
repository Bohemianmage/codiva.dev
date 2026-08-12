-- Oficio de la postulación (front, back, full, UX/UI, QA) y copy ampliada de la vacante.

ALTER TABLE ops_job_applications
  ADD COLUMN IF NOT EXISTS discipline text;

ALTER TABLE ops_job_applications
  DROP CONSTRAINT IF EXISTS ops_job_applications_discipline_ck;

ALTER TABLE ops_job_applications
  ADD CONSTRAINT ops_job_applications_discipline_ck CHECK (
    discipline IS NULL
    OR discipline IN ('frontend', 'backend', 'fullstack', 'ux-ui', 'qa', 'other')
  );

COMMENT ON COLUMN ops_job_applications.discipline IS
  'Oficio declarado al postular: frontend, backend, fullstack, ux-ui, qa u other.';

UPDATE ops_job_postings
SET
  title = 'Frontend, Backend, Full stack, UX/UI y QA',
  description = $craft_desc$Sobre el rol:
En Codiva.dev construimos software a la medida y lo llevamos a producción. Esta vacante no es solo de testing: buscamos personas de frontend, backend, full stack, UX/UI y QA que entren a proyectos reales con un oficio claro y sin teatro de proceso.

Al postular indica tu oficio principal. El cupo es el mismo; el trabajo concreto depende de lo que sepas hacer bien.

Perfiles que buscamos:
- Frontend: interfaces, estados, accesibilidad y calidad de la experiencia en producto web.
- Backend: datos, APIs, autenticación, integraciones y lo que tiene que sostenerse en producción.
- Full stack: cruzar el producto de punta a punta y cerrar huecos entre cliente, servidor y operación.
- UX/UI: flujos, jerarquía visual, sistemas de interfaz y handoff claro a desarrollo.
- QA / testing: flujos críticos, regresiones, evidencia reproducible y UAT antes del pase a producción.

Responsabilidades:
- Entregar trabajo en productos a la medida y productos digitales de Codiva.dev, en el oficio que declares.
- Colaborar con PM, diseño y desarrollo: aclarar alcance, reportar bloqueos y dejar rastro suficiente para que otro continúe.
- Validar que lo entregado cumple el criterio de aceptación del proyecto, no solo que “se ve bien”.
- Documentar lo mínimo útil (tickets, evidencias, decisiones) en las herramientas del equipo.
- Otras actividades afines a tu oficio y a la operación del estudio que Codiva asigne según los proyectos.$craft_desc$,
  requirements = $craft_req$Requisitos:
- Experiencia demostrable en al menos uno de estos oficios: frontend, backend, full stack, UX/UI o QA.
- Criterio para distinguir un defecto de una preferencia, y para priorizar lo que bloquea una entrega.
- Comunicación clara en español, escrita y hablada, con el equipo y, cuando aplique, con el cliente.
- Soltura trabajando en remoto y sobre más de un producto a la vez.
- Portafolio, repo o CV que muestre trabajo real, no solo cursos.

Deseable:
- TypeScript, Next.js, paneles admin, flujos de auth o pagos.
- Experiencia en software a la medida (estudio, agencia o in-house), no solo plantillas o e-commerce genérico.
- Nociones de ambientes de staging, regresiones entre sprints y handoff diseño ↔ desarrollo.$craft_req$,
  updated_at = now()
WHERE lower(trim(slug)) = 'tester-qa';
