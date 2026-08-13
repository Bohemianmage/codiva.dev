-- Cotizaciones PDF de packs estáticos: el cliente las ve en Cotización (documento Ops), no en Documentos.
UPDATE public.documents
SET visible_to_client = false
WHERE type = 'proposal_pdf'
  AND (
    title ILIKE '%cotizaci%'
    OR coalesce(file_url, '') ILIKE '%cotizacion%'
    OR coalesce(file_path, '') ILIKE '%cotizacion%'
  );
