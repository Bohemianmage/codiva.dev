-- NIRC packs: same filenames as Inquilia (folder already namespaces the client).
-- Ops body_html remains the portal source; these URLs are bootstrap / fallback.

UPDATE public.deliverables
SET
  url = '/client-packs/nirc/arquitectura-portal.html',
  description = 'Arquitectura certificada + infra cloud + plan de dominio en Vercel y marca. Sigue build MVP.'
WHERE id = '92000001-0001-4000-8000-000000000001'
  AND project_id = 'b0000001-0001-4000-8000-00000000000b';

INSERT INTO public.deliverables (
  id, project_id, title, description, url, kind, sort_order, visible_to_client
) VALUES (
  '92000001-0001-4000-8000-000000000002',
  'b0000001-0001-4000-8000-00000000000b',
  'Arquitectura completa',
  'Inventario interno: ADRs, economics, hosting y deuda. Solo staff.',
  '/client-packs/nirc/arquitectura-completa.html',
  'architecture',
  2,
  false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  url = EXCLUDED.url,
  kind = EXCLUDED.kind,
  sort_order = EXCLUDED.sort_order,
  visible_to_client = EXCLUDED.visible_to_client;
