-- Pruebas de conocimiento por vacante: intentos, eventos de avance y vínculo a postulaciones.

CREATE TYPE job_assessment_attempt_status AS ENUM (
  'started',
  'completed',
  'expired',
  'abandoned'
);

ALTER TABLE ops_job_postings
  ADD COLUMN IF NOT EXISTS assessment_key text;

UPDATE ops_job_postings
SET assessment_key = slug
WHERE assessment_key IS NULL
  AND slug IN ('project-manager', 'tester-qa');

CREATE TABLE ops_job_assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_token text NOT NULL,
  job_posting_id uuid NOT NULL REFERENCES ops_job_postings(id) ON DELETE CASCADE,
  catalog_key text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  status job_assessment_attempt_status NOT NULL DEFAULT 'started',
  attempt_number integer NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  time_limit_sec integer NOT NULL,
  question_ids text[] NOT NULL,
  option_orders jsonb NOT NULL DEFAULT '{}'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score_correct integer,
  score_total integer,
  score_pct numeric(5, 2),
  passed boolean,
  duration_ms integer,
  blur_count integer NOT NULL DEFAULT 0,
  ip_hash text,
  user_agent text,
  timezone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_job_assessment_attempts_token_len_ck CHECK (
    char_length(public_token) BETWEEN 16 AND 80
  ),
  CONSTRAINT ops_job_assessment_attempts_email_len_ck CHECK (
    char_length(trim(email)) BETWEEN 3 AND 320
  ),
  CONSTRAINT ops_job_assessment_attempts_name_len_ck CHECK (
    char_length(trim(full_name)) BETWEEN 1 AND 200
  ),
  CONSTRAINT ops_job_assessment_attempts_catalog_len_ck CHECK (
    char_length(trim(catalog_key)) BETWEEN 2 AND 80
  )
);

CREATE UNIQUE INDEX uq_ops_job_assessment_attempts_token
  ON ops_job_assessment_attempts (public_token);

CREATE INDEX idx_ops_job_assessment_attempts_job
  ON ops_job_assessment_attempts (job_posting_id, created_at DESC);

CREATE INDEX idx_ops_job_assessment_attempts_email
  ON ops_job_assessment_attempts (job_posting_id, lower(trim(email)), created_at DESC);

CREATE TABLE ops_job_assessment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES ops_job_assessment_attempts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  question_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text,
  CONSTRAINT ops_job_assessment_events_type_ck CHECK (
    event_type IN (
      'started',
      'resumed',
      'question_viewed',
      'answered',
      'window_blur',
      'window_focus',
      'submitted',
      'timed_out'
    )
  )
);

CREATE INDEX idx_ops_job_assessment_events_attempt
  ON ops_job_assessment_events (attempt_id, created_at);

ALTER TABLE ops_job_applications
  ADD COLUMN IF NOT EXISTS assessment_attempt_id uuid
    REFERENCES ops_job_assessment_attempts(id) ON DELETE SET NULL;

CREATE INDEX idx_ops_job_applications_attempt
  ON ops_job_applications (assessment_attempt_id)
  WHERE assessment_attempt_id IS NOT NULL;

COMMENT ON TABLE ops_job_assessment_attempts IS
  'Intentos de prueba de vacante; token público para el candidato, detalle para reclutamiento.';
COMMENT ON TABLE ops_job_assessment_events IS
  'Línea de tiempo de un intento: vistas, respuestas, foco de ventana, envío.';

ALTER TABLE ops_job_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_job_assessment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_ops_job_assessment_attempts ON ops_job_assessment_attempts FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());

CREATE POLICY admin_all_ops_job_assessment_events ON ops_job_assessment_events FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());
