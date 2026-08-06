-- Aceptaciones legales por miembro del portal (TyC, privacidad, NDA)

ALTER TABLE project_members
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_version text,
  ADD COLUMN IF NOT EXISTS nda_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS nda_version text;

COMMENT ON COLUMN project_members.terms_version IS 'Versión de TyC aceptada (ej. 2026.08.06)';
COMMENT ON COLUMN project_members.privacy_version IS 'Versión de aviso de privacidad aceptada';
COMMENT ON COLUMN project_members.nda_version IS 'Versión de NDA de portal aceptada';
