-- NIRC: pedir Constancia de Situación Fiscal (SAT) para facturación.
INSERT INTO public.document_requests (
  id,
  project_id,
  code,
  title,
  description,
  instructions,
  expected_type,
  input_mode,
  status,
  required,
  sort_order,
  visible_to_client
)
SELECT
  '94000001-0001-4000-8000-000000000008',
  p.id,
  'constancia_situacion_fiscal',
  'Constancia de Situación Fiscal',
  'Constancia vigente emitida por el SAT (RFC, régimen y domicilio fiscal).',
  'PDF descargado del portal del SAT. Debe coincidir con los datos de facturación.',
  'other',
  'file',
  'open',
  true,
  48,
  true
FROM public.projects p
WHERE p.id = 'b0000001-0001-4000-8000-00000000000b'
   OR p.slug = 'nirc'
ON CONFLICT (id) DO NOTHING;
