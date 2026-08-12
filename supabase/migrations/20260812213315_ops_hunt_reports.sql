-- Reportes de la cacería de hallazgos (testers / sitio público).

CREATE TABLE ops_hunt_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  page_url text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  expected text,
  matched_seed_id text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_hunt_reports_email_len_ck CHECK (char_length(trim(email)) BETWEEN 3 AND 320),
  CONSTRAINT ops_hunt_reports_name_len_ck CHECK (char_length(trim(full_name)) BETWEEN 1 AND 200),
  CONSTRAINT ops_hunt_reports_title_len_ck CHECK (char_length(trim(title)) BETWEEN 4 AND 200)
);

CREATE INDEX idx_ops_hunt_reports_created
  ON ops_hunt_reports (created_at DESC);

CREATE INDEX idx_ops_hunt_reports_email
  ON ops_hunt_reports (lower(trim(email)), created_at DESC);

COMMENT ON TABLE ops_hunt_reports IS 'Hallazgos reportados en la cacería pública de la bolsa / sitio.';

ALTER TABLE ops_hunt_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_ops_hunt_reports ON ops_hunt_reports FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());
