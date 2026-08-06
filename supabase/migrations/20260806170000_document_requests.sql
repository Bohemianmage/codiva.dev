-- Solicitudes de información/documentos: staff habilita slots; el cliente responde.

CREATE TABLE document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code text,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  expected_type text NOT NULL DEFAULT 'other'
    CHECK (expected_type IN ('contract', 'nda', 'proposal_pdf', 'other')),
  input_mode text NOT NULL DEFAULT 'file'
    CHECK (input_mode IN ('file', 'text', 'credentials')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'fulfilled', 'waived', 'cancelled')),
  required boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  due_date date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fulfilled_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  fulfilled_at timestamptz,
  response_text text,
  visible_to_client boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX document_requests_project_idx ON document_requests (project_id, status, sort_order);
CREATE INDEX document_requests_code_idx ON document_requests (project_id, code);

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES document_requests(id) ON DELETE SET NULL;

CREATE INDEX documents_request_id_idx ON documents (request_id);

COMMENT ON TABLE document_requests IS 'Pedidos de material al cliente; solo con status=open el portal habilita respuesta.';
COMMENT ON COLUMN document_requests.input_mode IS 'file=archivo; text=texto libre; credentials=accesos (hosting/dominio/etc.)';
COMMENT ON COLUMN document_requests.response_text IS 'Respuesta textual o JSON de credenciales cuando no hay archivo.';

ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_all_document_requests ON document_requests FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY client_read_document_requests ON document_requests FOR SELECT
  USING (
    visible_to_client = true
    AND project_id IN (SELECT public.client_project_ids())
  );

-- Cliente no inserta/actualiza requests directamente (solo vía server actions + admin).
