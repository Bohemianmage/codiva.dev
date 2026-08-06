-- Remove Ops portfolio demo seed data; keep live clients (NIRC seed UUID + non-seed orgs like BYD).

-- Demo tickets / inbox (SET NULL FKs would leave orphans if only orgs were deleted)
DELETE FROM tickets
WHERE id::text LIKE '81000001-0001-4000-8000-%';

DELETE FROM inbox_messages
WHERE id::text LIKE '71000001-0001-4000-8000-%';

-- Demo leads (CASCADE deletes lead-only quotes + tokens). Keep NIRC lead.
DELETE FROM leads
WHERE id::text LIKE 'c0000001-0001-4000-8000-%'
  AND id <> 'c0000001-0001-4000-8000-00000000000b';

-- Demo organizations (CASCADE projects → quotes, milestones, documents, etc.). Keep NIRC.
DELETE FROM organizations
WHERE id::text LIKE 'a0000001-0001-4000-8000-%'
  AND id <> 'a0000001-0001-4000-8000-00000000000b';

-- Safety: any leftover demo quote tokens
DELETE FROM quote_access_tokens
WHERE token = 'demo-kaucho-eshop-2026'
   OR id::text LIKE 'e0000001-0001-4000-8000-%';

-- NIRC milestone title was portfolio-demo wording
UPDATE milestones
SET title = 'Fundaciones', description = 'Auth, backoffice y carga masiva.'
WHERE id = 'f0000001-0001-4000-8000-00000000000c';
