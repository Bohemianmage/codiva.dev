-- Org-level mutual NDA + documents.organization_id

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS mutual_nda_document_id uuid,
  ADD COLUMN IF NOT EXISTS mutual_nda_signed_at timestamptz;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE documents
  ALTER COLUMN project_id DROP NOT NULL;

ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_project_or_org_chk;

ALTER TABLE documents
  ADD CONSTRAINT documents_project_or_org_chk
  CHECK (project_id IS NOT NULL OR organization_id IS NOT NULL);

ALTER TABLE file_access_log
  ALTER COLUMN project_id DROP NOT NULL;

-- Avoid circular FK at create time; add after documents.organization_id exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organizations_mutual_nda_document_id_fkey'
  ) THEN
    ALTER TABLE organizations
      ADD CONSTRAINT organizations_mutual_nda_document_id_fkey
      FOREIGN KEY (mutual_nda_document_id) REFERENCES documents(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.client_organization_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.organization_id
  FROM projects p
  WHERE p.id IN (SELECT public.client_project_ids())
    AND p.organization_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_organization_client(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_organization_ids() ids WHERE ids = org_id
  );
$$;

DROP POLICY IF EXISTS client_read_documents ON documents;
CREATE POLICY client_read_documents ON documents FOR SELECT
  USING (
    visible_to_client = true
    AND (
      (project_id IS NOT NULL AND project_id IN (SELECT public.client_project_ids()))
      OR (
        organization_id IS NOT NULL
        AND organization_id IN (SELECT public.client_organization_ids())
      )
    )
  );

DROP POLICY IF EXISTS client_insert_documents ON documents;
CREATE POLICY client_insert_documents ON documents FOR INSERT
  WITH CHECK (
    source = 'client'
    AND (
      (project_id IS NOT NULL AND project_id IN (SELECT public.client_project_ids()))
      OR (
        organization_id IS NOT NULL
        AND organization_id IN (SELECT public.client_organization_ids())
      )
    )
  );

-- Storage: allow org-scoped paths for clients of that org
DROP POLICY IF EXISTS client_storage_read ON storage.objects;
CREATE POLICY client_storage_read ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ops-files'
    AND auth.uid() IS NOT NULL
    AND (
      (
        (storage.foldername(name))[1] = 'projects'
        AND public.is_project_member(((storage.foldername(name))[2])::uuid)
      )
      OR (
        (storage.foldername(name))[1] = 'organizations'
        AND public.is_organization_client(((storage.foldername(name))[2])::uuid)
      )
    )
  );

DROP POLICY IF EXISTS client_storage_insert ON storage.objects;
CREATE POLICY client_storage_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ops-files'
    AND auth.uid() IS NOT NULL
    AND (
      (
        (storage.foldername(name))[1] = 'projects'
        AND (storage.foldername(name))[3] = 'inbound'
        AND public.is_project_member(((storage.foldername(name))[2])::uuid)
      )
      OR (
        (storage.foldername(name))[1] = 'organizations'
        AND (storage.foldername(name))[3] = 'nda'
        AND public.is_organization_client(((storage.foldername(name))[2])::uuid)
      )
    )
  );
