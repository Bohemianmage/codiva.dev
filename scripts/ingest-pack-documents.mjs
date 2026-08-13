/**
 * One-off: move remaining client-pack PDFs into ops-files and retarget documents.
 * Prefer: npx supabase storage cp --linked --experimental <file> ss:///ops-files/<dest>
 * Fallback: node scripts/ingest-pack-documents.mjs
 */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function isPlaceholder(value) {
  if (!value) return true;
  const trimmed = value.trim();
  return (
    trimmed === '[undefined]' ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    /^\[.*\]$/.test(trimmed)
  );
}

function loadEnvFile(filePath, { override = false } = {}) {
  if (!existsSync(filePath)) return;
  for (const raw of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (isPlaceholder(value)) continue;
    if (override || !process.env[key] || isPlaceholder(process.env[key])) {
      process.env[key] = value;
    }
  }
}

for (const key of [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_URL',
]) {
  if (isPlaceholder(process.env[key])) delete process.env[key];
}

loadEnvFile(resolve(root, '.env.local'), { override: true });
loadEnvFile(resolve(root, '.env'), { override: false });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || !/^https?:\/\//i.test(url) || key.length < 40) {
  console.error('Missing valid NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const files = [
  {
    id: '0f30d868-4cd2-4d00-ab0e-61cec77dbe6e',
    disk: 'public/client-packs/kaucho/contrato-firmado.pdf',
    dest: 'projects/9a478cdb-6fed-431c-a842-5fdf1c2e3a07/documents/contrato-firmado.pdf',
  },
  {
    id: '60b457a2-9f05-4d7b-8bbe-cbd5a33da5d3',
    disk: 'public/client-packs/kaucho/nda-firmado.pdf',
    dest: 'organizations/d8f9a9a6-132c-4eb5-8b30-868060b7216b/nda/nda-firmado.pdf',
    organizationId: 'd8f9a9a6-132c-4eb5-8b30-868060b7216b',
  },
  {
    id: 'e4bea6d4-42cb-4d3a-a19b-3660bd10c9fb',
    disk: 'public/client-packs/riser/contrato.pdf',
    dest: 'projects/b11c82f4-38d2-418d-9c19-f99742c293e6/documents/contrato.pdf',
  },
  {
    id: '61b24f3c-1821-4874-b4f5-be0d253cef88',
    disk: 'public/client-packs/riser/nda.pdf',
    dest: 'organizations/8a9c77cb-d1d2-4e0a-bfad-873e83b7b8f5/nda/nda.pdf',
    organizationId: '8a9c77cb-d1d2-4e0a-bfad-873e83b7b8f5',
  },
  {
    id: 'c9d597a3-bac2-4553-825d-8a49ba2c34d5',
    disk: 'public/client-packs/riser/cotizacion.pdf',
    dest: 'projects/b11c82f4-38d2-418d-9c19-f99742c293e6/documents/cotizacion.pdf',
  },
  {
    id: 'cd5a5723-2b73-4ed1-820e-67b547ecece7',
    disk: 'public/client-packs/kaucho/cotizacion-web.pdf',
    dest: 'projects/9a478cdb-6fed-431c-a842-5fdf1c2e3a07/documents/cotizacion-web.pdf',
  },
  {
    id: '1245b0dd-094c-46c1-925d-2e5c943abc2b',
    disk: 'public/client-packs/kaucho/cotizacion-catalogo-eshop.pdf',
    dest: 'projects/9a478cdb-6fed-431c-a842-5fdf1c2e3a07/documents/cotizacion-catalogo-eshop.pdf',
  },
  {
    id: 'c9cff724-ac1c-4578-a3ff-e89e3c2300aa',
    disk: 'public/client-packs/fes/cotizacion-eshop.pdf',
    dest: 'projects/836bffdd-5615-4b74-bf95-d32a19d53794/documents/cotizacion-eshop.pdf',
  },
];

let failed = 0;
for (const item of files) {
  const abs = resolve(root, item.disk);
  if (!existsSync(abs)) {
    console.error(`Missing file: ${item.disk}`);
    failed += 1;
    continue;
  }
  const buffer = readFileSync(abs);
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  const { error: uploadError } = await admin.storage.from('ops-files').upload(item.dest, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (uploadError) {
    console.error(`Upload failed ${item.disk}: ${uploadError.message}`);
    failed += 1;
    continue;
  }
  const fileUrl = `/api/ops/file?path=${encodeURIComponent(item.dest)}`;
  const patch = {
    file_path: item.dest,
    file_url: fileUrl,
    content_sha256: sha256,
  };
  if (item.organizationId) patch.organization_id = item.organizationId;
  const { error: updateError } = await admin.from('documents').update(patch).eq('id', item.id);
  if (updateError) {
    console.error(`Update failed ${item.id}: ${updateError.message}`);
    failed += 1;
    continue;
  }
  console.log(`Ingested ${item.disk} -> ${item.dest}`);
}

if (failed) {
  console.error(`Finished with ${failed} error(s)`);
  process.exit(1);
}
console.log('Done');
