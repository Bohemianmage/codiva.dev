-- Recorrido de la cacería: páginas visitadas con sesión identificada (después de aprobar criterio).

CREATE TABLE ops_hunt_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_attempt_id uuid NOT NULL REFERENCES ops_job_assessment_attempts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  path text NOT NULL,
  host text,
  referrer text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_hunt_events_type_ck CHECK (event_type IN ('page_view', 'reported')),
  CONSTRAINT ops_hunt_events_path_len_ck CHECK (char_length(path) BETWEEN 1 AND 200)
);

CREATE INDEX idx_ops_hunt_events_attempt
  ON ops_hunt_events (assessment_attempt_id, created_at);

COMMENT ON TABLE ops_hunt_events IS
  'Mapa de sesión de la cacería: page views y reportes ligados al intento identificado.';

ALTER TABLE ops_hunt_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_ops_hunt_events ON ops_hunt_events FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());
