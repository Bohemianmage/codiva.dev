-- Canvas de arquitectura / propuesta: Ops es la fuente (HTML editado en staff).
ALTER TABLE deliverables
  ADD COLUMN IF NOT EXISTS body_html text;

COMMENT ON COLUMN deliverables.body_html IS
  'Documento HTML de arquitectura/MVP/propuesta. Si está presente, el portal lo sirve autenticado en lugar del pack estático.';
