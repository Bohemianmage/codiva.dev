-- Revisión Ops de hallazgos, evidencias y recordatorio de cacería.

ALTER TABLE ops_hunt_reports
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS evidence_paths text[] NOT NULL DEFAULT '{}';

ALTER TABLE ops_hunt_reports
  DROP CONSTRAINT IF EXISTS ops_hunt_reports_review_status_ck;

ALTER TABLE ops_hunt_reports
  ADD CONSTRAINT ops_hunt_reports_review_status_ck
  CHECK (review_status IN ('open', 'noted', 'discarded'));

COMMENT ON COLUMN ops_hunt_reports.review_status IS
  'Revisión interna Ops. open/noted/discarded; no afecta el umbral de postulación.';
COMMENT ON COLUMN ops_hunt_reports.evidence_paths IS
  'Rutas en bucket hunt-evidence (capturas pegadas).';

ALTER TABLE ops_job_assessment_attempts
  ADD COLUMN IF NOT EXISTS hunt_nudge_sent_at timestamptz;

COMMENT ON COLUMN ops_job_assessment_attempts.hunt_nudge_sent_at IS
  'Correo de recordatorio 48h si aún no hay hallazgo del oficio.';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hunt-evidence',
  'hunt-evidence',
  false,
  3145728,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;
