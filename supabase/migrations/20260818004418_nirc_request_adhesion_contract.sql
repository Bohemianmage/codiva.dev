-- NIRC: pedir plantilla de contrato de adhesión (firma en kiosk / Cincel).
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
  '94000001-0001-4000-8000-000000000007',
  p.id,
  'adhesion_contract',
  'Contrato de adhesión',
  'Plantilla del contrato de adhesión que firmará el trabajador en la tableta kiosk (entrada).',
  'PDF o Word de la plantilla vigente aprobada por su abogado. Si ya tienen versión para Cincel, inclúyanla.',
  'other',
  'file',
  'open',
  true,
  45,
  true
FROM public.projects p
WHERE p.id = 'b0000001-0001-4000-8000-00000000000b'
   OR p.slug = 'nirc'
ON CONFLICT (id) DO NOTHING;
