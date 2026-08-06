-- Point NDA request instructions at the inline download in the request card.
UPDATE public.document_requests
SET
  instructions = 'Descarga el borrador aquí, hazlo firmar por el representante legal y súbelo en PDF.',
  updated_at = now()
WHERE code = 'nda_signed'
  OR id = '94000001-0001-4000-8000-000000000001';
