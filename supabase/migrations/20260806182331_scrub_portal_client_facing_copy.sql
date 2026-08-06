-- Scrub client-facing portal copy: no meta "(sin precios)", no montos en descripción NIRC,
-- and revoke public quote token that bypassed portal_show_quote=false.

UPDATE public.projects
SET description = 'Workforce eventual: pool FCFS, entrada dura (Cincel+IDSE), Stripe Connect y privacy. Alcance técnico en 18 semanas. Hosting e integraciones de terceros se presupuestan aparte.'
WHERE id = 'b0000001-0001-4000-8000-00000000000b'
  OR (
    slug = 'nirc'
    AND description ILIKE '%$980%'
  );

UPDATE public.deliverables
SET description = 'Dominios, stack, integraciones IDSE/Cincel/Stripe y flujos operativos.'
WHERE id = '92000001-0001-4000-8000-000000000001'
  OR description ILIKE '%(sin precios)%';

-- Notes on outbound docs are staff-editable; clear seeded dual-use note (portal no longer renders notes).
UPDATE public.documents
SET notes = ''
WHERE id = '93000001-0001-4000-8000-000000000001';

DELETE FROM public.quote_access_tokens
WHERE id = 'e0000001-0001-4000-8000-00000000000b'
   OR token = 'nirc-mvp-fase1-2026';
