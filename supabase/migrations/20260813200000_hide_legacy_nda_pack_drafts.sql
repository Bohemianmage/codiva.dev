-- Borradores NDA de packs estáticos: el cliente usa el NDA mutuo generado en Ops.
UPDATE public.documents
SET visible_to_client = false
WHERE type = 'nda'
  AND signed = false
  AND (
    coalesce(file_url, '') ILIKE '%client-packs%'
    OR coalesce(file_path, '') ILIKE '%client-packs%'
  );
