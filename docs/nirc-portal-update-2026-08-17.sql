-- Pegar en Supabase SQL Editor (proyecto Codiva) si `db push` no aplica por historial.
-- Efecto: vista cliente /p/nirc — Track A + kiosk. Pack HTML ya está en public/client-packs/nirc/.

UPDATE public.projects
SET
  status = 'active',
  start_date = '2026-08-17',
  target_delivery_date = '2026-11-09',
  progress_percent = 8,
  description = E'Workforce eventual · Track A arquitectura en curso (desde 17 ago 2026).\n\nFlujo de entrada: tableta kiosk escanea QR del empleado → contrato de adhesión (solo firma el trabajador) → tableta idle; alta IMSS en paralelo. Baja IMSS y pago al check-out.\n\nSandboxes: Cincel y Stripe listos; IDSE PRO pendiente de proveedor. Políticas de montos/SDI a cargo de NIRC (no bloquean el diseño).'
WHERE slug = 'nirc';

UPDATE public.milestones m
SET
  title = v.title,
  description = v.description,
  status = v.status::public.milestone_status,
  due_date = v.due_date::date
FROM (VALUES
  ('f0000001-0001-4000-8000-00000000000b', 'Arquitectura — arranque', E'Inicio Track A (17 ago 2026). Decisiones: adhesión 1 firmante en tableta kiosk; baja IMSS en check-out; INE documental; IDV Cincel off. Cincel+Stripe sandbox OK; IDSE sandbox pendiente.', 'in_progress', '2026-09-14'),
  ('f0000001-0001-4000-8000-00000000000c', 'Arquitectura — fundaciones', 'ADRs base, trazabilidad, catálogo P0 de entrada/kiosk y ownership congelado (fin Bloque I).', 'pending', '2026-09-14'),
  ('f0000001-0001-4000-8000-00000000000d', 'Arquitectura — dominios', 'Specs por dominio (pool/FCFS, QR/kiosk, Cincel, IDSE, Stripe) + fixtures.', 'pending', '2026-10-12'),
  ('f0000001-0001-4000-8000-00000000000e', 'Architecture freeze', 'Paquete certificado + handoff a build. Objetivo ~9 nov 2026.', 'pending', '2026-11-09'),
  ('f0000001-0001-4000-8000-00000000000f', 'Build MVP — UAT / go-live', 'Tras freeze: implementación 18 semanas, UAT y producción (hitos de build).', 'pending', '2027-03-15')
) AS v(id, title, description, status, due_date)
WHERE m.id = v.id::uuid;

INSERT INTO public.milestone_updates (id, milestone_id, body, created_at)
VALUES (
  'f1000001-0001-4000-8000-000000000001',
  'f0000001-0001-4000-8000-00000000000b',
  E'17 ago 2026 — Track A iniciado.\n• Firma: adhesión solo trabajador en tableta (idle→scan QR→firma→idle); IMSS async.\n• Baja IDSE en check-out.\n• Sandboxes Cincel/Stripe OK; IDSE pendiente.\n• Documento de arquitectura del portal actualizado (kiosk + colas correctas).',
  '2026-08-17T18:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.deliverables
SET description = 'Dominios, kiosk de entrada (adhesión 1 firmante), IDSE/Cincel/Stripe y flujos operativos.'
WHERE id = '92000001-0001-4000-8000-000000000001';

UPDATE public.milestones
SET
  title = 'Documentación base (Fase 0)',
  description = 'Arquitectura, flujos y MVP documentados en repo. Completado antes del Track A.',
  status = 'completed',
  due_date = '2026-08-17'
WHERE id = 'f0000001-0001-4000-8000-00000000000a';
