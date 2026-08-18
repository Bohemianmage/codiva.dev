'use server';

import { revalidatePath } from 'next/cache';
import {
  assertCapability,
  assertProjectAccessOrThrow,
  type StaffAccess,
} from '@/lib/ops/auth';
import { logActivity } from '@/lib/ops/activity';
import { dispatchPromoteWorkflow, releasesTokenConfigured } from '@/lib/ops/releases/github';

/** Promote pipeline: admin or PM only (not client, not default for dev). */
async function assertReleaseOps(projectId: string): Promise<StaffAccess> {
  const access = await assertCapability('site_access');
  await assertProjectAccessOrThrow(access, projectId);
  const role = access.staff.role;
  if (role !== 'admin' && role !== 'pm') {
    throw new Error('Solo admin o PM pueden gestionar releases');
  }
  return access;
}

export type ReleaseSettingsRow = {
  project_id: string;
  enabled: boolean;
  github_owner: string | null;
  github_repo: string | null;
  promote_workflow: string;
  promote_ref: string;
  deployment_url_input: string;
  client_can_request: boolean;
  require_staff_approval: boolean;
  notes: string;
};

export type ReleaseRequestRow = {
  id: string;
  project_id: string;
  status: string;
  preview_url: string;
  production_url: string | null;
  notes: string;
  error_message: string | null;
  github_run_url: string | null;
  requested_by_kind: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

function revalidateReleasePaths(projectId: string, slug?: string | null) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/p`);
  if (slug) {
    revalidatePath(`/p/${slug}`);
    revalidatePath(`/p/${slug}/sitio`);
    revalidatePath(`/ops/p/${slug}/sitio`);
  }
}

async function projectSlug(
  supabase: Awaited<ReturnType<typeof assertCapability>>['supabase'],
  projectId: string
): Promise<string | null> {
  const { data } = await supabase.from('projects').select('slug').eq('id', projectId).maybeSingle();
  return data?.slug ?? null;
}

export async function upsertReleaseSettings(projectId: string, formData: FormData) {
  const { supabase, user } = await assertReleaseOps(projectId);

  const enabled = formData.get('enabled') === 'on';
  const github_owner = String(formData.get('githubOwner') || '').trim() || null;
  const github_repo = String(formData.get('githubRepo') || '').trim() || null;

  const payload = {
    project_id: projectId,
    enabled,
    github_owner,
    github_repo,
    promote_workflow: String(formData.get('promoteWorkflow') || 'promote-production.yml').trim(),
    promote_ref: String(formData.get('promoteRef') || 'main').trim(),
    deployment_url_input: String(formData.get('deploymentUrlInput') || 'deployment_url').trim(),
    client_can_request: false,
    require_staff_approval: formData.get('requireStaffApproval') === 'on',
    notes: String(formData.get('notes') || ''),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('project_release_settings').upsert(payload, {
    onConflict: 'project_id',
  });
  if (error) throw new Error(error.message);

  await logActivity({
    entityType: 'project',
    entityId: projectId,
    action: 'release_settings_updated',
    actorId: user.id,
    metadata: {
      project_id: projectId,
      enabled,
      has_github: Boolean(github_owner && github_repo),
    },
  });

  revalidateReleasePaths(projectId, await projectSlug(supabase, projectId));
}

export async function createReleaseRequestAsStaff(projectId: string, formData: FormData) {
  const { supabase, user } = await assertReleaseOps(projectId);

  const preview_url = String(formData.get('previewUrl') || '').trim();
  if (!preview_url) throw new Error('preview_url_required');

  const { data: settings } = await supabase
    .from('project_release_settings')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();

  if (!settings?.enabled) throw new Error('releases_disabled');

  const requireApproval = settings.require_staff_approval !== false;
  const status = requireApproval ? 'pending_approval' : 'approved';

  const { data, error } = await supabase
    .from('project_release_requests')
    .insert({
      project_id: projectId,
      status,
      preview_url,
      production_url: String(formData.get('productionUrl') || '').trim() || null,
      notes: String(formData.get('notes') || ''),
      requested_by: user.id,
      requested_by_kind: 'staff',
      approved_by: requireApproval ? null : user.id,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await logActivity({
    entityType: 'project_release_request',
    entityId: data.id,
    action: 'created',
    actorId: user.id,
    metadata: { project_id: projectId, status, kind: 'staff' },
  });

  revalidateReleasePaths(projectId, await projectSlug(supabase, projectId));
  return data.id;
}

export async function approveReleaseRequest(requestId: string, projectId: string) {
  const { supabase, user } = await assertReleaseOps(projectId);

  const { error } = await supabase
    .from('project_release_requests')
    .update({
      status: 'approved',
      approved_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('project_id', projectId)
    .eq('status', 'pending_approval');
  if (error) throw new Error(error.message);

  await logActivity({
    entityType: 'project_release_request',
    entityId: requestId,
    action: 'approved',
    actorId: user.id,
    metadata: { project_id: projectId },
  });

  revalidateReleasePaths(projectId, await projectSlug(supabase, projectId));
}

export async function cancelReleaseRequest(requestId: string, projectId: string) {
  const { supabase, user } = await assertReleaseOps(projectId);

  const { error } = await supabase
    .from('project_release_requests')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('project_id', projectId)
    .in('status', ['pending_approval', 'approved', 'failed']);
  if (error) throw new Error(error.message);

  await logActivity({
    entityType: 'project_release_request',
    entityId: requestId,
    action: 'cancelled',
    actorId: user.id,
    metadata: { project_id: projectId },
  });

  revalidateReleasePaths(projectId, await projectSlug(supabase, projectId));
}

export async function dispatchReleasePromote(requestId: string, projectId: string) {
  const { supabase, user } = await assertReleaseOps(projectId);

  const { data: req, error: reqErr } = await supabase
    .from('project_release_requests')
    .select('*')
    .eq('id', requestId)
    .eq('project_id', projectId)
    .maybeSingle();
  if (reqErr) throw new Error(reqErr.message);
  if (!req) throw new Error('request_not_found');
  if (!['approved', 'failed'].includes(req.status)) {
    throw new Error('request_not_dispatchable');
  }

  const { data: settings } = await supabase
    .from('project_release_settings')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();

  if (!settings?.enabled || !settings.github_owner || !settings.github_repo) {
    throw new Error('github_not_configured');
  }

  await supabase
    .from('project_release_requests')
    .update({
      status: 'dispatching',
      error_message: null,
      updated_at: new Date().toISOString(),
      dispatched_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  const result = await dispatchPromoteWorkflow({
    owner: settings.github_owner,
    repo: settings.github_repo,
    workflow: settings.promote_workflow,
    ref: settings.promote_ref,
    deploymentUrlInput: settings.deployment_url_input,
    previewUrl: req.preview_url,
  });

  if (!result.ok) {
    await supabase
      .from('project_release_requests')
      .update({
        status: 'failed',
        error_message: result.error,
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    await logActivity({
      entityType: 'project_release_request',
      entityId: requestId,
      action: 'dispatch_failed',
      actorId: user.id,
      metadata: { project_id: projectId, error: result.error, missing_token: result.missingToken },
    });

    revalidateReleasePaths(projectId, await projectSlug(supabase, projectId));
    throw new Error(result.error);
  }

  await supabase
    .from('project_release_requests')
    .update({
      status: 'succeeded',
      github_run_url: result.runUrl,
      error_message: null,
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  await logActivity({
    entityType: 'project_release_request',
    entityId: requestId,
    action: 'dispatched',
    actorId: user.id,
    metadata: { project_id: projectId, run_url: result.runUrl },
  });

  revalidateReleasePaths(projectId, await projectSlug(supabase, projectId));
}

export async function markReleaseSucceededManually(requestId: string, projectId: string) {
  const { supabase, user } = await assertReleaseOps(projectId);

  const { error } = await supabase
    .from('project_release_requests')
    .update({
      status: 'succeeded',
      notes: 'Marcado como promovido manualmente (Vercel/GitHub fuera de Codiva).',
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('project_id', projectId);
  if (error) throw new Error(error.message);

  await logActivity({
    entityType: 'project_release_request',
    entityId: requestId,
    action: 'manual_succeeded',
    actorId: user.id,
    metadata: { project_id: projectId },
  });

  revalidateReleasePaths(projectId, await projectSlug(supabase, projectId));
}

export { releasesTokenConfigured };
