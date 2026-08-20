-- NIRC: backfill production build URLs on succeeded promotes (history used preview URLs).

UPDATE public.project_release_requests r
SET
  production_url = v.url,
  updated_at = now()
FROM (VALUES
  ('dpl_BiD1nxxtAEoDUHggKSfRVHLSjLQy', 'https://nirc-nrxopslph-codiva-dev.vercel.app'),
  ('dpl_B1MTSRuzgvhZS6j7ouLqu3opxKXh', 'https://nirc-9xh4opi26-codiva-dev.vercel.app'),
  ('dpl_BtCiBobLgUXfB4U5uceW2PsAH73x', 'https://nirc-9v1pu0otl-codiva-dev.vercel.app'),
  ('dpl_FxRsBTTL4mjAnhexHUMHJXTs5tbN', 'https://nirc-nfkygptey-codiva-dev.vercel.app')
) AS v(deployment_id, url)
WHERE r.vercel_deployment_id = v.deployment_id
  AND r.status = 'succeeded'
  AND coalesce(r.production_url, '') = '';
