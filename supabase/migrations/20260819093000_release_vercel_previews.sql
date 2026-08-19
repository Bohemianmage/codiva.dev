-- Vercel project ids + commit metadata on release requests.

ALTER TABLE public.project_release_settings
  ADD COLUMN IF NOT EXISTS vercel_project_id text,
  ADD COLUMN IF NOT EXISTS vercel_team_id text;

ALTER TABLE public.project_release_requests
  ADD COLUMN IF NOT EXISTS commit_sha text,
  ADD COLUMN IF NOT EXISTS commit_message text,
  ADD COLUMN IF NOT EXISTS vercel_deployment_id text;
