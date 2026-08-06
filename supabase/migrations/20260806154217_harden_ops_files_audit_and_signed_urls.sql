-- Endurecer Storage: lectura/escritura solo del proyecto del miembro
-- (staff sigue con staff_storage_all)

DROP POLICY IF EXISTS client_storage_read ON storage.objects;
DROP POLICY IF EXISTS client_storage_insert ON storage.objects;

-- Lectura: solo objetos bajo projects/{projectId}/… del que el usuario es miembro
CREATE POLICY client_storage_read ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ops-files'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'projects'
    AND public.is_project_member(((storage.foldername(name))[2])::uuid)
  );

-- Inbound: solo a su carpeta inbound del proyecto
CREATE POLICY client_storage_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ops-files'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'projects'
    AND (storage.foldername(name))[3] = 'inbound'
    AND public.is_project_member(((storage.foldername(name))[2])::uuid)
  );

-- Bitácora de acceso a archivos (además de activity_log genérico)
CREATE TABLE IF NOT EXISTS file_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  file_path text NOT NULL,
  action text NOT NULL DEFAULT 'download',
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_file_access_project_created
  ON file_access_log (project_id, created_at DESC);

ALTER TABLE file_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_all_file_access ON file_access_log FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY client_insert_file_access ON file_access_log FOR INSERT
  WITH CHECK (
    project_id IN (SELECT public.client_project_ids())
    AND actor_id = auth.uid()
  );

CREATE POLICY client_read_own_file_access ON file_access_log FOR SELECT
  USING (actor_id = auth.uid());
