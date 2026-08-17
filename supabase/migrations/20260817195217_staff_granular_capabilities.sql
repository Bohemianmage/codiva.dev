-- Per-staff workspace capabilities. Roles remain templates; access follows this list.

ALTER TABLE public.staff_profiles
  ADD COLUMN IF NOT EXISTS capabilities text[] NOT NULL DEFAULT '{}';

UPDATE public.staff_profiles
SET capabilities = CASE role
  WHEN 'admin' THEN ARRAY[
    'leads',
    'inbox',
    'quotes',
    'charges',
    'portal_users',
    'organizations',
    'workload',
    'time_entries',
    'team',
    'careers_review',
    'legal_publish',
    'projects_all',
    'projects_create',
    'milestones_write',
    'sprints_plan',
    'sprints_update_own',
    'documents',
    'deliverables',
    'site_access',
    'tickets',
    'dashboard_finance',
    'settings_profile'
  ]
  WHEN 'pm' THEN ARRAY[
    'leads',
    'inbox',
    'quotes',
    'charges',
    'portal_users',
    'organizations',
    'workload',
    'time_entries',
    'careers_review',
    'projects_create',
    'milestones_write',
    'sprints_plan',
    'sprints_update_own',
    'documents',
    'deliverables',
    'site_access',
    'tickets',
    'settings_profile'
  ]
  ELSE ARRAY[
    'sprints_update_own',
    'time_entries',
    'documents',
    'deliverables',
    'site_access',
    'tickets',
    'settings_profile'
  ]
END
WHERE capabilities = '{}';

ALTER TABLE public.staff_profiles
  DROP CONSTRAINT IF EXISTS staff_profiles_capabilities_known;

ALTER TABLE public.staff_profiles
  ADD CONSTRAINT staff_profiles_capabilities_known
  CHECK (
    capabilities <@ ARRAY[
      'leads',
      'inbox',
      'quotes',
      'charges',
      'portal_users',
      'organizations',
      'workload',
      'time_entries',
      'team',
      'careers_review',
      'legal_publish',
      'projects_all',
      'projects_create',
      'milestones_write',
      'sprints_plan',
      'sprints_update_own',
      'documents',
      'deliverables',
      'site_access',
      'tickets',
      'dashboard_finance',
      'settings_profile'
    ]::text[]
  );

CREATE OR REPLACE FUNCTION public.staff_has_capability(cap text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE id = auth.uid()
      AND active = true
      AND cap = ANY (capabilities)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.staff_has_capability(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.staff_has_capability(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.staff_has_capability(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_has_capability(text) TO service_role;

CREATE OR REPLACE FUNCTION public.is_admin_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.staff_has_capability('team');
$$;

CREATE OR REPLACE FUNCTION public.is_careers_review_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.staff_has_capability('team')
      OR public.staff_has_capability('careers_review');
$$;

DROP POLICY IF EXISTS staff_all_staff_profiles ON public.staff_profiles;

CREATE POLICY staff_select_staff_profiles ON public.staff_profiles
  FOR SELECT
  USING (public.is_staff());
