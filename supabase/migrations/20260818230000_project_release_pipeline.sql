-- Project release pipeline: preview → approve → promote (GitHub Actions / Vercel).
-- Controlled from Codiva ops + client portal.

CREATE TABLE public.project_release_settings (
  project_id uuid PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  github_owner text,
  github_repo text,
  promote_workflow text NOT NULL DEFAULT 'promote-production.yml',
  promote_ref text NOT NULL DEFAULT 'main',
  deployment_url_input text NOT NULL DEFAULT 'deployment_url',
  client_can_request boolean NOT NULL DEFAULT false,
  require_staff_approval boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_release_settings_github_pair CHECK (
    (github_owner IS NULL AND github_repo IS NULL)
    OR (github_owner IS NOT NULL AND github_repo IS NOT NULL)
  )
);

COMMENT ON TABLE public.project_release_settings IS
  'CI/CD promote config per project. Secrets stay in Codiva env (GITHUB_RELEASES_TOKEN); never in this table.';

CREATE TABLE public.project_release_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending_approval'
    CHECK (status IN (
      'pending_approval',
      'approved',
      'dispatching',
      'succeeded',
      'failed',
      'cancelled'
    )),
  preview_url text NOT NULL,
  production_url text,
  notes text NOT NULL DEFAULT '',
  error_message text,
  github_run_url text,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_by_kind text NOT NULL DEFAULT 'staff'
    CHECK (requested_by_kind IN ('staff', 'client')),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dispatched_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_release_requests_project_idx
  ON public.project_release_requests (project_id, created_at DESC);

CREATE INDEX project_release_requests_status_idx
  ON public.project_release_requests (project_id, status);

COMMENT ON TABLE public.project_release_requests IS
  'Promote-to-production requests visible in ops and (when enabled) client portal.';

ALTER TABLE public.project_release_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_release_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.project_release_settings FROM anon;
REVOKE ALL ON TABLE public.project_release_settings FROM authenticated;
REVOKE ALL ON TABLE public.project_release_requests FROM anon;
REVOKE ALL ON TABLE public.project_release_requests FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_release_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_release_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_release_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_release_requests TO service_role;

-- Settings: staff full; clients read only if pipeline enabled (to know they can request)
CREATE POLICY staff_all_project_release_settings ON public.project_release_settings
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY client_read_project_release_settings ON public.project_release_settings
  FOR SELECT USING (
    enabled = true
    AND project_id IN (SELECT public.client_project_ids())
  );

-- Requests: staff full; clients read own project; clients insert when enabled (enforced in app too)
CREATE POLICY staff_all_project_release_requests ON public.project_release_requests
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY client_read_project_release_requests ON public.project_release_requests
  FOR SELECT USING (
    project_id IN (SELECT public.client_project_ids())
  );

-- Clients never insert/update/delete release requests; promote is admin/PM only.
