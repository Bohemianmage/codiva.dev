import { createAdminClient } from '@/lib/supabase/admin';
import { scanUploadedBytes } from '@/lib/ops/malware-scan';
import { deleteOpsFile, retainUntilFromDays, uploadOpsFile } from '@/lib/ops/storage';
import type { RequestAudit } from '@/lib/ops/request-audit';

export async function ingestProjectDocument(opts: {
  projectId: string;
  file: File;
  type: string;
  title: string;
  notes?: string;
  signed?: boolean;
  visibleToClient?: boolean;
  source: 'staff' | 'client';
  uploadedBy: string;
  folder: 'documents' | 'inbound';
  requestId?: string | null;
  audit?: RequestAudit;
  organizationId?: string | null;
}) {
  const admin = createAdminClient();

  const { data: project } = await admin
    .from('projects')
    .select('document_retention_days, organization_id')
    .eq('id', opts.projectId)
    .single();

  const retentionDays = project?.document_retention_days ?? 365;
  const organizationId = opts.organizationId ?? project?.organization_id ?? null;
  const uploaded = await uploadOpsFile(
    opts.file,
    `projects/${opts.projectId}/${opts.folder}`
  );

  const scan = await scanUploadedBytes(uploaded.buffer, uploaded.sha256, opts.file.name);

  if (scan.status === 'infected') {
    await deleteOpsFile(uploaded.path);
    throw new Error(`Archivo rechazado: posible malware (${scan.provider ?? 'scan'}). ${scan.detail}`);
  }

  const { data: doc, error } = await admin
    .from('documents')
    .insert({
      project_id: opts.projectId,
      organization_id: organizationId,
      type: opts.type,
      title: opts.title,
      file_path: uploaded.path,
      file_url: uploaded.url,
      signed: Boolean(opts.signed),
      visible_to_client: Boolean(opts.visibleToClient),
      source: opts.source,
      uploaded_by: opts.uploadedBy,
      notes: opts.notes ?? '',
      request_id: opts.requestId ?? null,
      content_sha256: uploaded.sha256,
      scan_status: scan.status,
      scan_provider: scan.provider,
      scan_detail: scan.detail,
      scanned_at: new Date().toISOString(),
      retain_until: retainUntilFromDays(retentionDays),
    })
    .select('id, content_sha256, scan_status, retain_until, organization_id')
    .single();

  if (error) {
    await deleteOpsFile(uploaded.path).catch(() => undefined);
    throw new Error(error.message);
  }

  return {
    doc,
    sha256: uploaded.sha256,
    path: uploaded.path,
    scan,
    audit: opts.audit,
  };
}

/** NDA (u otro doc) a nivel organización: path under organizations/{orgId}/… */
export async function ingestOrgDocument(opts: {
  organizationId: string;
  file: File;
  type: string;
  title: string;
  notes?: string;
  signed?: boolean;
  visibleToClient?: boolean;
  source: 'staff' | 'client';
  uploadedBy: string;
  folder?: string;
  requestId?: string | null;
  /** Proyecto de origen (opcional; el doc queda org-scoped). */
  projectId?: string | null;
  audit?: RequestAudit;
  retentionDays?: number;
}) {
  const admin = createAdminClient();
  const folder = opts.folder ?? 'nda';
  const uploaded = await uploadOpsFile(
    opts.file,
    `organizations/${opts.organizationId}/${folder}`
  );

  const scan = await scanUploadedBytes(uploaded.buffer, uploaded.sha256, opts.file.name);
  if (scan.status === 'infected') {
    await deleteOpsFile(uploaded.path);
    throw new Error(`Archivo rechazado: posible malware (${scan.provider ?? 'scan'}). ${scan.detail}`);
  }

  const { data: doc, error } = await admin
    .from('documents')
    .insert({
      project_id: opts.projectId ?? null,
      organization_id: opts.organizationId,
      type: opts.type,
      title: opts.title,
      file_path: uploaded.path,
      file_url: uploaded.url,
      signed: Boolean(opts.signed),
      visible_to_client: Boolean(opts.visibleToClient),
      source: opts.source,
      uploaded_by: opts.uploadedBy,
      notes: opts.notes ?? '',
      request_id: opts.requestId ?? null,
      content_sha256: uploaded.sha256,
      scan_status: scan.status,
      scan_provider: scan.provider,
      scan_detail: scan.detail,
      scanned_at: new Date().toISOString(),
      retain_until: retainUntilFromDays(opts.retentionDays ?? 365),
    })
    .select('id, content_sha256, scan_status, retain_until, organization_id')
    .single();

  if (error) {
    await deleteOpsFile(uploaded.path).catch(() => undefined);
    throw new Error(error.message);
  }

  return {
    doc,
    sha256: uploaded.sha256,
    path: uploaded.path,
    scan,
    audit: opts.audit,
  };
}

export async function disposeExpiredDocuments(limit = 100): Promise<{ disposed: number }> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: due } = await admin
    .from('documents')
    .select('id, file_path, project_id')
    .is('disposed_at', null)
    .not('retain_until', 'is', null)
    .lte('retain_until', today)
    .limit(limit);

  let disposed = 0;
  for (const doc of due ?? []) {
    if (doc.file_path?.startsWith('projects/') || doc.file_path?.startsWith('organizations/')) {
      await deleteOpsFile(doc.file_path).catch(() => undefined);
    }
    await admin
      .from('documents')
      .update({
        disposed_at: new Date().toISOString(),
        visible_to_client: false,
        file_url: null,
        notes: 'Disposed by retention policy',
      })
      .eq('id', doc.id);
    disposed += 1;
  }

  return { disposed };
}
