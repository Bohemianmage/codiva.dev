-- Hash, retención, estado de scan y auditoría en accesos

CREATE TYPE document_scan_status AS ENUM (
  'pending',
  'clean',
  'infected',
  'skipped',
  'error'
);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS document_retention_days int NOT NULL DEFAULT 365;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS content_sha256 text,
  ADD COLUMN IF NOT EXISTS scan_status document_scan_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS scan_provider text,
  ADD COLUMN IF NOT EXISTS scan_detail text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS scanned_at timestamptz,
  ADD COLUMN IF NOT EXISTS retain_until date,
  ADD COLUMN IF NOT EXISTS disposed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_documents_retain_until
  ON documents (retain_until)
  WHERE disposed_at IS NULL AND file_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_sha256 ON documents (content_sha256);

ALTER TABLE file_access_log
  ADD COLUMN IF NOT EXISTS ip text,
  ADD COLUMN IF NOT EXISTS user_agent text;

-- Docs dispuestos no visibles al cliente
CREATE OR REPLACE FUNCTION public.documents_hide_disposed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.disposed_at IS NOT NULL THEN
    NEW.visible_to_client := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_documents_hide_disposed ON documents;
CREATE TRIGGER trg_documents_hide_disposed
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION public.documents_hide_disposed();
