-- Aviso al cliente N días antes del vencimiento (p. ej. renovación de hosting T-30).

ALTER TABLE project_charges
  ADD COLUMN IF NOT EXISTS notice_days int NOT NULL DEFAULT 30
  CONSTRAINT project_charges_notice_days_nonneg CHECK (notice_days >= 0);

COMMENT ON COLUMN project_charges.notice_days IS
  'Días antes de due_date para mostrar aviso en el portal del cliente (0 = solo el día de vencimiento).';
