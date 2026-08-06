-- Controles de visibilidad portal: cotización, costos y quotes por ítem.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS portal_show_quote boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS portal_show_costs boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN projects.portal_show_quote IS 'Si false, el portal oculta Cotización (nav, cards, página).';
COMMENT ON COLUMN projects.portal_show_costs IS 'Si false, oculta canvas/contenido comercial (mvp/proposal) y montos.';

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS visible_to_client boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN quotes.visible_to_client IS 'Staff puede ocultar una cotización concreta aunque el módulo quote esté ON.';

DROP POLICY IF EXISTS client_read_quotes ON quotes;
CREATE POLICY client_read_quotes ON quotes FOR SELECT
  USING (
    visible_to_client = true
    AND status IN ('sent', 'accepted', 'rejected', 'expired')
    AND project_id IN (SELECT public.client_project_ids())
  );

DROP POLICY IF EXISTS client_update_quotes ON quotes;
CREATE POLICY client_update_quotes ON quotes FOR UPDATE
  USING (
    visible_to_client = true
    AND status = 'sent'
    AND project_id IN (SELECT public.client_project_ids())
  )
  WITH CHECK (
    visible_to_client = true
    AND status IN ('accepted', 'rejected')
    AND project_id IN (SELECT public.client_project_ids())
  );
