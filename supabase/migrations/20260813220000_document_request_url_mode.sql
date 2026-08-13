-- Solicitudes al cliente: respuesta tipo URL (p. ej. GitHub existente).

ALTER TABLE public.document_requests
  DROP CONSTRAINT IF EXISTS document_requests_input_mode_check;

ALTER TABLE public.document_requests
  ADD CONSTRAINT document_requests_input_mode_check
  CHECK (input_mode IN ('file', 'text', 'credentials', 'url'));

COMMENT ON COLUMN public.document_requests.input_mode IS
  'file=archivo; text=texto libre; credentials=accesos (hosting/dominio/etc.); url=enlace (p. ej. GitHub)';
