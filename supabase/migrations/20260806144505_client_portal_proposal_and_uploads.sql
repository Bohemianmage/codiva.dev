-- Portal cliente: propuesta (arquitectura/MVP), origen de documentos y subida del cliente

CREATE TYPE deliverable_kind AS ENUM ('architecture', 'mvp', 'proposal', 'other');
CREATE TYPE document_source AS ENUM ('staff', 'client');

ALTER TABLE deliverables
  ADD COLUMN IF NOT EXISTS kind deliverable_kind NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS source document_source NOT NULL DEFAULT 'staff',
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_deliverables_project_kind ON deliverables (project_id, kind);
CREATE INDEX IF NOT EXISTS idx_documents_project_source ON documents (project_id, source);

-- Cliente puede subir documentos a proyectos donde es miembro
CREATE POLICY client_insert_documents ON documents FOR INSERT
  WITH CHECK (
    source = 'client'
    AND project_id IN (SELECT public.client_project_ids())
    AND visible_to_client = true
  );

-- Lectura: docs visibles al cliente (staff outbound + client inbound)
-- (política existente client_read_documents ya cubre visible_to_client = true)

-- Storage: cliente puede subir a su carpeta de inbound
CREATE POLICY client_storage_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ops-files'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'projects'
    AND (storage.foldername(name))[3] = 'inbound'
  );
