-- NIRC Ops sprints: close Track A after architecture freeze; carry vendor/policy leftovers into B0;
-- retarget Track B to the 18-week build calendar (go-live 2026-12-21).

-- Track A dates + status
UPDATE public.project_sprints SET
  status = 'completed',
  ends_on = '2026-08-17',
  goal = 'Acta de arranque. Cincel y Stripe sandbox OK; IDSE pendiente de proveedor. Decisiones P0 de entrada/salida cerradas en freeze.'
WHERE id = 'c1000001-0001-4000-8000-0000000000a0';

UPDATE public.project_sprints SET
  status = 'completed',
  starts_on = '2026-08-13',
  ends_on = '2026-08-17',
  goal = 'ADRs, trazabilidad y catálogo P0. Cerrado en freeze 17 ago 2026 (Track A comprimido).'
WHERE id = 'c1000001-0001-4000-8000-0000000000a1';

UPDATE public.project_sprints SET
  status = 'completed',
  starts_on = '2026-08-13',
  ends_on = '2026-08-17',
  goal = 'Specs por dominio (pool/FCFS, kiosk, Cincel, IDSE, Stripe, contabilidad, privacidad). Cerrado en freeze 17 ago 2026.'
WHERE id = 'c1000001-0001-4000-8000-0000000000a2';

UPDATE public.project_sprints SET
  status = 'completed',
  starts_on = '2026-08-13',
  ends_on = '2026-08-17',
  goal = 'Arquitectura certificada 17 ago 2026. Handoff a build listo.'
WHERE id = 'c1000001-0001-4000-8000-0000000000a3';

-- Architecture work done; vendor/policy leftovers stay open and move to B0
UPDATE public.sprint_items
SET status = 'done'
WHERE sprint_id IN (
    'c1000001-0001-4000-8000-0000000000a0',
    'c1000001-0001-4000-8000-0000000000a1',
    'c1000001-0001-4000-8000-0000000000a2',
    'c1000001-0001-4000-8000-0000000000a3'
  )
  AND id NOT IN (
    '720dd99a-1cbf-423e-844f-56b6909bc40a',
    '01f71ff8-961c-4ef1-9b85-0d9cb92bc302',
    '76535b54-1e77-4b9c-acaa-f4ac0305b4e8',
    '025b05e0-a942-45e7-b11f-381414c5c1a0'
  );

UPDATE public.sprint_items SET
  details = 'Cerrado 17 ago 2026. Baja IMSS y pago Stripe en check-out (en paralelo). SPEI solo respaldo. AGT-A03 alineado en pack de arquitectura.'
WHERE id = '178270e7-aacd-4893-9f02-bad809d0c7f6';

UPDATE public.sprint_items SET
  details = 'Cerrado 17 ago 2026. INE documental en kiosk; IDV Cincel off en MVP.'
WHERE id = 'a20bdab3-f9f5-45fb-94a5-e6df4cb7bbef';

UPDATE public.sprint_items SET
  details = 'Cerrado 17 ago 2026. Acta de freeze firmada; handoff a implementación.'
WHERE id = 'ca99ae2e-30e6-43e2-949f-8e6563bfb11e';

UPDATE public.sprint_items SET
  sprint_id = 'c1000001-0001-4000-8000-0000000000b0',
  sort_order = 50,
  status = 'in_progress',
  details = 'Cincel y Stripe sandbox OK. Falta sandbox IDSE PRO (credenciales + 1 alta de prueba). No bloquea diseño; sí bloquea certificar el adapter.'
WHERE id = '720dd99a-1cbf-423e-844f-56b6909bc40a';

UPDATE public.sprint_items SET
  sprint_id = 'c1000001-0001-4000-8000-0000000000b0',
  sort_order = 60,
  status = 'todo',
  details = 'Política NIRC ($400 neto vs bruto). No bloquea arquitectura; sí la spec de Stripe en build.'
WHERE id = '01f71ff8-961c-4ef1-9b85-0d9cb92bc302';

UPDATE public.sprint_items SET
  sprint_id = 'c1000001-0001-4000-8000-0000000000b0',
  sort_order = 70,
  status = 'todo',
  details = 'Política NIRC (SDI). Si no hay dictamen, se documenta supuesto. No bloquea arquitectura.'
WHERE id = '76535b54-1e77-4b9c-acaa-f4ac0305b4e8';

UPDATE public.sprint_items SET
  sprint_id = 'c1000001-0001-4000-8000-0000000000b0',
  sort_order = 80,
  status = 'todo',
  details = 'Cincel sandbox listo. Pendiente: 1 alta IDSE PRO de prueba. Specs de arquitectura ya van contra el contrato del proveedor.'
WHERE id = '025b05e0-a942-45e7-b11f-381414c5c1a0';

-- Track B → 18 weeks from freeze (matches portal milestones)
UPDATE public.project_sprints SET
  status = 'active',
  starts_on = '2026-08-18',
  ends_on = '2026-08-24',
  goal = 'Semana 1. Sandbox IDSE PRO, plantilla de adhesión, secretos y cloud. Cincel/Stripe ya listos.'
WHERE id = 'c1000001-0001-4000-8000-0000000000b0';

UPDATE public.project_sprints SET
  status = 'planned',
  starts_on = '2026-08-25',
  ends_on = '2026-09-21',
  goal = 'Semanas 2-5. Monorepo, auth/RBAC, expediente, CSV, BullMQ/outbox.'
WHERE id = 'c1000001-0001-4000-8000-0000000000b1';

UPDATE public.project_sprints SET
  status = 'planned',
  starts_on = '2026-09-22',
  ends_on = '2026-10-19',
  goal = 'Semanas 6-9. Scoring, convocatorias, lock de cupo, no-show/refill.'
WHERE id = 'c1000001-0001-4000-8000-0000000000b2';

UPDATE public.project_sprints SET
  status = 'planned',
  starts_on = '2026-10-20',
  ends_on = '2026-11-16',
  goal = 'Semanas 10-13. QR, kiosk, Cincel, alta IDSE, gate Trabajando.'
WHERE id = 'c1000001-0001-4000-8000-0000000000b3';

UPDATE public.project_sprints SET
  status = 'planned',
  starts_on = '2026-11-17',
  ends_on = '2026-12-07',
  goal = 'Semanas 14-16. Check-out, baja IDSE, Stripe, asientos, disposal LFPDPPP.'
WHERE id = 'c1000001-0001-4000-8000-0000000000b4';

UPDATE public.project_sprints SET
  status = 'planned',
  starts_on = '2026-12-08',
  ends_on = '2026-12-21',
  goal = 'Semanas 17-18. UAT P0, capacitación, go-live asistido. No-go si falla el gate.'
WHERE id = 'c1000001-0001-4000-8000-0000000000b5';
