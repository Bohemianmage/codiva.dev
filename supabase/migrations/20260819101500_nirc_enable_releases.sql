-- Enable NIRC release pipeline (GitHub Codiva-dev/nirc + Vercel project nirc).

INSERT INTO public.project_release_settings (
  project_id,
  enabled,
  github_owner,
  github_repo,
  promote_workflow,
  promote_ref,
  deployment_url_input,
  vercel_project_id,
  vercel_team_id,
  client_can_request,
  require_staff_approval,
  notes,
  updated_at
)
SELECT
  p.id,
  true,
  'Codiva-dev',
  'nirc',
  'promote-production.yml',
  'main',
  'deployment_url',
  'prj_GGlesi8OSxDAxabWGHH53coejcRC',
  'team_nI1wrmMTcj7XhYTUDwjy5Ak3',
  false,
  true,
  'GitHub CI → preview Vercel → QA Codiva → promote. Cliente solo lectura.',
  now()
FROM public.projects p
WHERE p.slug = 'nirc'
ON CONFLICT (project_id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  github_owner = EXCLUDED.github_owner,
  github_repo = EXCLUDED.github_repo,
  vercel_project_id = EXCLUDED.vercel_project_id,
  vercel_team_id = EXCLUDED.vercel_team_id,
  client_can_request = false,
  notes = EXCLUDED.notes,
  updated_at = now();
