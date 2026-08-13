import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sha256Hex } from '@/lib/ops/storage';
import { scanUploadedBytes } from '@/lib/ops/malware-scan';

export const HUNT_EVIDENCE_BUCKET = 'hunt-evidence';
export const HUNT_MAX_EVIDENCE_BYTES = 3 * 1024 * 1024;
export const HUNT_MAX_EVIDENCE_FILES = 4;

export function sniffHuntImage(buffer: Buffer): { mime: string; ext: string } | null {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

export function isHuntEvidencePath(path: string): boolean {
  return /^hunt\/[a-z0-9-]{8,80}\/[0-9a-f-]{36}\.(png|jpg|webp)$/i.test(path.trim());
}

export async function storeHuntEvidence(input: {
  folder: string;
  buffer: Buffer;
  filename?: string;
}): Promise<{ path: string } | { error: string }> {
  const sniffed = sniffHuntImage(input.buffer);
  if (!sniffed) return { error: 'image_type_not_allowed' };
  if (input.buffer.length > HUNT_MAX_EVIDENCE_BYTES) return { error: 'file_too_large' };

  const hash = sha256Hex(input.buffer);
  const scan = await scanUploadedBytes(input.buffer, hash, input.filename || `paste.${sniffed.ext}`);
  if (scan.status === 'infected') return { error: 'file_rejected' };

  const folder = input.folder.replace(/[^a-z0-9-]/gi, '').slice(0, 80).toLowerCase() || 'open';
  const path = `hunt/${folder}/${randomUUID()}.${sniffed.ext}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from(HUNT_EVIDENCE_BUCKET).upload(path, input.buffer, {
    contentType: sniffed.mime,
    upsert: false,
  });
  if (error) {
    console.error('storeHuntEvidence', error);
    return { error: 'upload_failed' };
  }
  return { path };
}

export async function huntEvidenceExists(path: string): Promise<boolean> {
  if (!isHuntEvidencePath(path)) return false;
  const admin = createAdminClient();
  const dir = path.split('/').slice(0, -1).join('/');
  const name = path.split('/').pop();
  const { data } = await admin.storage.from(HUNT_EVIDENCE_BUCKET).list(dir, { search: name, limit: 2 });
  return Boolean(data?.some((row) => row.name === name));
}
