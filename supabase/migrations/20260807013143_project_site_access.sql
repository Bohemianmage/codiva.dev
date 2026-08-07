-- URLs del sitio del cliente + accesos Codiva → cliente (protegidos con RLS).

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS site_preview_url text,
  ADD COLUMN IF NOT EXISTS site_production_url text;

COMMENT ON COLUMN public.projects.site_preview_url IS
  'URL de preview/staging del desarrollo; visible a miembros del proyecto en el portal.';
COMMENT ON COLUMN public.projects.site_production_url IS
  'URL de producción / dominio final del cliente.';

CREATE TABLE public.project_site_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label text NOT NULL,
  kind text NOT NULL DEFAULT 'other'
    CHECK (kind IN ('preview', 'production', 'cms', 'other')),
  url text,
  username text,
  secret text,
  notes text NOT NULL DEFAULT '',
  visible_to_client boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_site_access_project_idx
  ON public.project_site_access (project_id, sort_order);

COMMENT ON TABLE public.project_site_access IS
  'Accesos al desarrollo/CMS que Codiva publica para el cliente (no confundir con document_requests credentials).';
COMMENT ON COLUMN public.project_site_access.secret IS
  'Contraseña o token; solo vía portal autenticado / Ops staff. Nunca en client-packs ni emails.';

ALTER TABLE public.project_site_access ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.project_site_access FROM anon;
REVOKE ALL ON TABLE public.project_site_access FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_site_access TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_site_access TO service_role;

CREATE POLICY staff_all_project_site_access ON public.project_site_access FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY client_read_project_site_access ON public.project_site_access FOR SELECT
  USING (
    visible_to_client = true
    AND project_id IN (SELECT public.client_project_ids())
  );
