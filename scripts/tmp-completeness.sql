-- Kaucho + RISER completeness snapshot
SELECT p.slug, p.status, p.client_visible, p.progress_percent,
       p.portal_show_quote, p.portal_show_costs,
       p.site_preview_url IS NOT NULL AS has_preview,
       p.site_production_url
FROM projects p
WHERE p.slug IN ('kaucho', 'riser')
ORDER BY p.slug;

SELECT p.slug, pm.role, pm.invited_at,
       (pm.terms_accepted_at IS NOT NULL AND pm.privacy_accepted_at IS NOT NULL AND pm.nda_accepted_at IS NOT NULL) AS legales_ok
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
WHERE p.slug IN ('kaucho', 'riser')
ORDER BY p.slug;

SELECT p.slug, q.version, q.status, q.title, q.total_amount
FROM quotes q
JOIN projects p ON p.id = q.project_id
WHERE p.slug IN ('kaucho', 'riser')
ORDER BY p.slug, q.version;

SELECT p.slug, c.kind::text, c.title, c.status::text, c.amount
FROM project_charges c
JOIN projects p ON p.id = c.project_id
WHERE p.slug IN ('kaucho', 'riser')
ORDER BY p.slug, c.sort_order;

SELECT p.slug, r.code, r.title, r.status
FROM document_requests r
JOIN projects p ON p.id = r.project_id
WHERE p.slug IN ('kaucho', 'riser') AND r.status = 'open'
ORDER BY p.slug, r.sort_order;
