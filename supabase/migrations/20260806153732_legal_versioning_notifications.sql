-- Versionado de documentos legales y bitácora de re-notificación

CREATE TABLE IF NOT EXISTS legal_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('terms', 'privacy', 'nda', 'bundle')),
  version_code text NOT NULL,
  changelog text NOT NULL DEFAULT '',
  published_at timestamptz NOT NULL DEFAULT now(),
  published_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  UNIQUE (kind, version_code)
);

CREATE TABLE IF NOT EXISTS legal_reacceptance_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_code text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id, version_code)
);

CREATE INDEX IF NOT EXISTS idx_legal_reaccept_project
  ON legal_reacceptance_notifications (project_id, version_code);

ALTER TABLE legal_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_reacceptance_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_all_legal_versions ON legal_document_versions FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_legal_reaccept ON legal_reacceptance_notifications FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY client_read_own_legal_reaccept ON legal_reacceptance_notifications FOR SELECT
  USING (user_id = auth.uid());

-- Versión inicial del bundle legal del portal
INSERT INTO legal_document_versions (kind, version_code, changelog)
VALUES (
  'bundle',
  '2026.08.06',
  'Publicación inicial: TyC, aviso de privacidad y NDA de portal (aceptación digital por usuario).'
)
ON CONFLICT (kind, version_code) DO NOTHING;
