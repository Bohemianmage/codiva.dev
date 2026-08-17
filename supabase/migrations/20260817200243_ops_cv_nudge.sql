-- Recordatorio 48h para enviar CV si el hallazgo del oficio ya está.

ALTER TABLE ops_job_assessment_attempts
  ADD COLUMN IF NOT EXISTS cv_nudge_sent_at timestamptz;

COMMENT ON COLUMN ops_job_assessment_attempts.cv_nudge_sent_at IS
  'Correo de recordatorio 48h si hay hallazgo del oficio y aún no hay CV.';
