-- Soften client-facing NDA request copy: legal representative instead of client-name specifics.
UPDATE public.document_requests
SET
  description = 'Devolver el NDA mutuo firmado por el representante legal de la organización.',
  instructions = 'Descarga el borrador en Materiales de Codiva, hazlo firmar por el representante legal y súbelo en PDF.',
  updated_at = now()
WHERE code = 'nda_signed'
  AND (
    description ILIKE '%o al menos por%'
    OR description ILIKE '%ambas partes%'
    OR id = '94000001-0001-4000-8000-000000000001'
  );

UPDATE public.document_requests
SET
  description = 'Logos, colores, tipografías y guía de uso de marca.',
  updated_at = now()
WHERE code = 'brandbook'
  AND (
    description ILIKE '%NIRC%'
    OR id = '94000001-0001-4000-8000-000000000002'
  );
