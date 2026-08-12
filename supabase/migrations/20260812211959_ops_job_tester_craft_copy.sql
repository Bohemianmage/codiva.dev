-- Testers con oficio (front, back, full, UX/UI, QA): copy alineada a testing, no a desarrollo/diseño.

UPDATE ops_job_postings
SET
  title = 'Tester · Frontend, Backend, Full stack, UX/UI y QA',
  description = $craft_desc$Sobre el rol:
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
- Otras actividades afines a testing que Codiva asigne según las necesidades del estudio y de los proyectos.$craft_desc$,
  requirements = $craft_req$Requisitos:
- Experiencia práctica testeando software (web, API o producto digital), no solo cursos.
- Capacidad de escribir reportes reproducibles: pasos, esperado vs. obtenido, ambiente y evidencia.
- Criterio para priorizar lo que bloquea una entrega.
- Comunicación clara en español con desarrollo y, cuando aplique, con el cliente en UAT.
- Soltura trabajando en remoto y sobre más de un producto a la vez.

Deseable:
- Familiaridad con Next.js, paneles admin, auth o pagos, según el oficio.
- Experiencia en software a la medida (estudio, agencia o in-house).
- Nociones de staging, regresiones entre sprints y handoff diseño ↔ desarrollo.$craft_req$,
  updated_at = now()
WHERE lower(trim(slug)) = 'tester-qa';
