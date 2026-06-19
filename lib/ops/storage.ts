import { createAdminClient } from '@/lib/supabase/admin';

export async function uploadOpsFile(
  file: File | Blob,
  folder: string
): Promise<{ path: string; url: string }> {
  const admin = createAdminClient();
  const name = file instanceof File ? file.name : 'file';
  const safeName = `${Date.now()}-${name.replace(/\s+/g, '-')}`;
  const path = `${folder}/${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from('ops-files').upload(path, buffer, {
    contentType: file instanceof File ? file.type : 'application/octet-stream',
    upsert: false,
  });

  if (error) throw error;

  const { data: signed } = await admin.storage
    .from('ops-files')
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  return {
    path,
    url: signed?.signedUrl ?? path,
  };
}
