-- Oficio e intento de prueba en reportes de cacería.

ALTER TABLE ops_hunt_reports
  ADD COLUMN IF NOT EXISTS discipline text,
  ADD COLUMN IF NOT EXISTS assessment_attempt_id uuid,
  ADD COLUMN IF NOT EXISTS job_posting_id uuid;

CREATE INDEX IF NOT EXISTS idx_ops_hunt_reports_attempt
  ON ops_hunt_reports (assessment_attempt_id, created_at DESC)
  WHERE assessment_attempt_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ops_hunt_reports_discipline
  ON ops_hunt_reports (discipline, created_at DESC)
  WHERE discipline IS NOT NULL;

COMMENT ON COLUMN ops_hunt_reports.discipline IS 'Oficio declarado al reportar (alineado a la prueba de tester).';
