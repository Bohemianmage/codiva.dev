-- Cotizaciones sobre leads (Opción A) + acceso público por token

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS partner_name text,
  ADD COLUMN IF NOT EXISTS partner_email text,
  ADD COLUMN IF NOT EXISTS partner_company text,
  ADD COLUMN IF NOT EXISTS end_client_name text,
  ADD COLUMN IF NOT EXISTS end_client_company text;

ALTER TABLE quotes
  ALTER COLUMN project_id DROP NOT NULL;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS service_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS project_state text NOT NULL DEFAULT 'Por iniciar — pendiente de aprobación formal',
  ADD COLUMN IF NOT EXISTS deliverables text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS considerations text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS optional_extras text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS line_items jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_project_id_version_key;

CREATE UNIQUE INDEX IF NOT EXISTS quotes_project_version_unique
  ON quotes (project_id, version)
  WHERE project_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS quotes_lead_version_unique
  ON quotes (lead_id, version)
  WHERE lead_id IS NOT NULL;

ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_parent_check;

ALTER TABLE quotes ADD CONSTRAINT quotes_parent_check
  CHECK (
    (project_id IS NOT NULL AND lead_id IS NULL)
    OR (project_id IS NULL AND lead_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_quotes_lead_id ON quotes(lead_id);

CREATE TABLE IF NOT EXISTS quote_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_access_tokens_token ON quote_access_tokens(token);

ALTER TABLE quote_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_all_quote_tokens ON quote_access_tokens FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());
