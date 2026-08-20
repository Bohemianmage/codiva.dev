-- RISER: la renovación del 19 sep 2026 es correo + dominio (montos reales).
-- No toca saldo de desarrollo ni el adeudo de alojamiento 2025.

-- Quitar el cargo genérico TBD de “Renovación del alojamiento”.
DELETE FROM public.project_charges c
USING public.projects p
WHERE c.project_id = p.id
  AND p.slug = 'riser'
  AND c.kind = 'hosting'
  AND c.due_date = '2026-09-19'
  AND c.amount IS NULL;

INSERT INTO public.project_charges (
  project_id,
  kind,
  title,
  description,
  amount,
  currency,
  status,
  due_date,
  period_label,
  notice_days,
  sort_order,
  visible_to_client,
  staff_notes
)
SELECT
  p.id,
  v.kind::public.charge_kind,
  v.title,
  v.description,
  v.amount,
  'MXN',
  'pending',
  '2026-09-19'::date,
  'Sep 2026 - Sep 2027',
  30,
  v.sort_order,
  true,
  v.staff_notes
FROM public.projects p
CROSS JOIN (
  VALUES
    (
      'pass_through',
      'Renovación de correo / mail',
      'Renovación anual del correo a tu cargo, al costo real del proveedor. Te avisamos con 30 días de anticipación.',
      427.68::numeric,
      4,
      'Renovación 19-sep-2026. Confirmado 20 ago 2026: 427.68 MXN. Aviso T-30.'
    ),
    (
      'domain',
      'Renovación de dominio',
      'Renovación anual del dominio a tu cargo, al costo real del proveedor. Te avisamos con 30 días de anticipación.',
      1227.24::numeric,
      5,
      'Renovación 19-sep-2026. Confirmado 20 ago 2026: 1227.24 MXN. Aviso T-30.'
    )
) AS v(kind, title, description, amount, sort_order, staff_notes)
WHERE p.slug = 'riser'
  AND NOT EXISTS (
    SELECT 1
    FROM public.project_charges c
    WHERE c.project_id = p.id
      AND c.kind = v.kind::public.charge_kind
      AND c.due_date = '2026-09-19'
  );
