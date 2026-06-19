'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaff } from '@/lib/ops/auth';
import { logActivity } from '@/lib/ops/activity';
import { generateProjectSlug } from '@/lib/ops/slug';
import { sendClientEmail } from '@/lib/ops/email';
import { opsBaseUrl } from '@/lib/ops/host';
import { uploadOpsFile } from '@/lib/ops/storage';

export async function updateLeadStatus(leadId: string, status: string) {
  const { supabase, user } = await requireStaff();
  const { error } = await supabase.from('leads').update({ status }).eq('id', leadId);
  if (error) throw new Error(error.message);
  await logActivity({
    entityType: 'lead',
    entityId: leadId,
    action: 'status_updated',
    metadata: { status },
    actorId: user.id,
  });
  revalidatePath('/leads');
  revalidatePath(`/leads/${leadId}`);
}

export async function updateInboxStatus(messageId: string, status: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from('inbox_messages').update({ status }).eq('id', messageId);
  if (error) throw new Error(error.message);
  revalidatePath('/inbox');
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const { supabase, user } = await requireStaff();
  const { error } = await supabase.from('tickets').update({ status }).eq('id', ticketId);
  if (error) throw new Error(error.message);
  await logActivity({
    entityType: 'ticket',
    entityId: ticketId,
    action: 'status_updated',
    metadata: { status },
    actorId: user.id,
  });
  revalidatePath('/tickets');
  revalidatePath(`/tickets/${ticketId}`);
}

export async function convertLeadToProject(leadId: string) {
  const { supabase, user } = await requireStaff();
  const admin = createAdminClient();

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();
  if (leadError || !lead) throw new Error('Lead no encontrado');

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: lead.company || lead.name,
      contact_email: lead.email,
      contact_phone: lead.phone,
    })
    .select('id')
    .single();
  if (orgError) throw new Error(orgError.message);

  const slug = generateProjectSlug(lead.company || lead.name);
  const { data: project, error: projectError } = await admin
    .from('projects')
    .insert({
      organization_id: org.id,
      lead_id: leadId,
      name: `${lead.company || lead.name} — Proyecto`,
      slug,
      status: 'quoting',
      description: lead.need || '',
      target_delivery_date: lead.delivery_date,
    })
    .select('id, slug')
    .single();
  if (projectError) throw new Error(projectError.message);

  await admin
    .from('leads')
    .update({ status: 'converted', converted_project_id: project.id })
    .eq('id', leadId);

  await logActivity({
    entityType: 'project',
    entityId: project.id,
    action: 'created_from_lead',
    metadata: { leadId },
    actorId: user.id,
  });

  revalidatePath('/leads');
  revalidatePath('/projects');
  return { projectId: project.id, slug: project.slug };
}

export async function createProject(formData: FormData) {
  const { user } = await requireStaff();
  const admin = createAdminClient();

  const name = String(formData.get('name') || '').trim();
  const orgName = String(formData.get('organizationName') || name).trim();
  const email = String(formData.get('contactEmail') || '').trim();
  if (!name) throw new Error('Nombre requerido');

  const { data: org } = await admin
    .from('organizations')
    .insert({ name: orgName, contact_email: email || null })
    .select('id')
    .single();

  const slug = generateProjectSlug(name);
  const { data: project, error } = await admin
    .from('projects')
    .insert({
      organization_id: org!.id,
      name,
      slug,
      status: 'draft',
      description: String(formData.get('description') || ''),
      target_delivery_date: String(formData.get('targetDeliveryDate') || '') || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  await logActivity({
    entityType: 'project',
    entityId: project.id,
    action: 'created',
    actorId: user.id,
  });

  revalidatePath('/projects');
  return project.id;
}

export async function updateProject(projectId: string, formData: FormData) {
  const { supabase, user } = await requireStaff();

  const payload = {
    name: String(formData.get('name') || ''),
    status: String(formData.get('status') || 'draft'),
    description: String(formData.get('description') || ''),
    client_visible: formData.get('clientVisible') === 'on',
    progress_percent: parseInt(String(formData.get('progressPercent') || '0'), 10),
    start_date: String(formData.get('startDate') || '') || null,
    target_delivery_date: String(formData.get('targetDeliveryDate') || '') || null,
  };

  const { error } = await supabase.from('projects').update(payload).eq('id', projectId);
  if (error) throw new Error(error.message);

  await logActivity({
    entityType: 'project',
    entityId: projectId,
    action: 'updated',
    actorId: user.id,
  });

  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
}

export async function createMilestone(projectId: string, formData: FormData) {
  const { supabase, user } = await requireStaff();

  const { data: last } = await supabase
    .from('milestones')
    .select('sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('milestones').insert({
    project_id: projectId,
    title: String(formData.get('title') || ''),
    description: String(formData.get('description') || ''),
    status: String(formData.get('status') || 'pending'),
    due_date: String(formData.get('dueDate') || '') || null,
    visible_to_client: formData.get('visibleToClient') !== 'off',
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) throw new Error(error.message);

  await logActivity({
    entityType: 'milestone',
    entityId: projectId,
    action: 'created',
    actorId: user.id,
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function updateMilestone(milestoneId: string, projectId: string, formData: FormData) {
  const { supabase, user } = await requireStaff();

  const status = String(formData.get('status') || 'pending');
  const payload = {
    title: String(formData.get('title') || ''),
    description: String(formData.get('description') || ''),
    status,
    due_date: String(formData.get('dueDate') || '') || null,
    visible_to_client: formData.get('visibleToClient') === 'on',
    completed_at: status === 'completed' ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from('milestones').update(payload).eq('id', milestoneId);
  if (error) throw new Error(error.message);

  await logActivity({
    entityType: 'milestone',
    entityId: milestoneId,
    action: 'updated',
    actorId: user.id,
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function addMilestoneUpdate(milestoneId: string, projectId: string, body: string) {
  const { supabase, user } = await requireStaff();
  const { error } = await supabase.from('milestone_updates').insert({
    milestone_id: milestoneId,
    body,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function createQuote(projectId: string, formData: FormData) {
  const { supabase, user } = await requireStaff();

  const { data: last } = await supabase
    .from('quotes')
    .select('version')
    .eq('project_id', projectId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const phasesRaw = String(formData.get('phases') || '[]');
  let phases = [];
  try {
    phases = JSON.parse(phasesRaw);
  } catch {
    phases = [];
  }

  const { error } = await supabase.from('quotes').insert({
    project_id: projectId,
    version: (last?.version ?? 0) + 1,
    status: 'draft',
    title: String(formData.get('title') || 'Propuesta comercial'),
    scope: String(formData.get('scope') || ''),
    phases,
    total_amount: parseFloat(String(formData.get('totalAmount') || '0')) || null,
    currency: String(formData.get('currency') || 'USD'),
    valid_until: String(formData.get('validUntil') || '') || null,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function sendQuote(quoteId: string, projectId: string) {
  const { supabase, user } = await requireStaff();
  const admin = createAdminClient();

  const { error } = await supabase
    .from('quotes')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', quoteId);
  if (error) throw new Error(error.message);

  await supabase.from('projects').update({ status: 'quoting' }).eq('id', projectId);

  const { data: project } = await admin
    .from('projects')
    .select('slug, name, organizations(contact_email)')
    .eq('id', projectId)
    .single();

  const email = (project as { organizations?: { contact_email?: string } })?.organizations
    ?.contact_email;
  if (email) {
    await sendClientEmail({
      to: email,
      subject: `Nueva cotización: ${project?.name}`,
      html: `<p>Tienes una nueva propuesta disponible en tu portal.</p><p><a href="${opsBaseUrl()}/p/${project?.slug}/cotizacion">Ver cotización</a></p>`,
    });
  }

  await logActivity({
    entityType: 'quote',
    entityId: quoteId,
    action: 'sent',
    actorId: user.id,
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function acceptQuote(quoteId: string, projectId: string) {
  const { supabase, user } = await requireStaff();
  const now = new Date().toISOString();
  await supabase
    .from('quotes')
    .update({ status: 'accepted', accepted_at: now, accepted_by: user.id })
    .eq('id', quoteId);
  await supabase.from('projects').update({ status: 'active', client_visible: true }).eq('id', projectId);
  revalidatePath(`/projects/${projectId}`);
}

export async function inviteProjectMember(projectId: string, formData: FormData) {
  await requireStaff();
  const admin = createAdminClient();

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const role = String(formData.get('role') || 'viewer');
  if (!email) throw new Error('Email requerido');

  const { data: project } = await admin
    .from('projects')
    .select('slug, name, client_visible')
    .eq('id', projectId)
    .single();
  if (!project) throw new Error('Proyecto no encontrado');

  let userId: string;
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const found = existingUsers?.users?.find((u) => u.email === email);

  if (found) {
    userId = found.id;
  } else {
    const tempPassword = crypto.randomUUID();
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? 'No se pudo crear usuario');
    userId = created.user.id;

    await sendClientEmail({
      to: email,
      subject: `Acceso a tu portal — ${project.name}`,
      html: `<p>Se creó tu acceso al portal del proyecto <strong>${project.name}</strong>.</p>
        <p>URL: <a href="${opsBaseUrl()}/p/${project.slug}/login">${opsBaseUrl()}/p/${project.slug}/login</a></p>
        <p>Email: ${email}<br/>Contraseña temporal: ${tempPassword}</p>
        <p>Te recomendamos cambiar tu contraseña al ingresar.</p>`,
    });
  }

  const { error: memberError } = await admin.from('project_members').upsert(
    {
      project_id: projectId,
      user_id: userId,
      role,
      accepted_at: new Date().toISOString(),
    },
    { onConflict: 'project_id,user_id' }
  );
  if (memberError) throw new Error(memberError.message);

  if (!project.client_visible) {
    await admin.from('projects').update({ client_visible: true }).eq('id', projectId);
  }

  revalidatePath(`/projects/${projectId}`);
}

export async function uploadDocument(projectId: string, formData: FormData) {
  await requireStaff();
  const admin = createAdminClient();

  const file = formData.get('file') as File | null;
  if (!file?.size) throw new Error('Archivo requerido');

  const uploaded = await uploadOpsFile(file, `projects/${projectId}/documents`);

  const { error } = await admin.from('documents').insert({
    project_id: projectId,
    type: String(formData.get('type') || 'other'),
    title: String(formData.get('title') || file.name),
    file_path: uploaded.path,
    file_url: uploaded.url,
    signed: formData.get('signed') === 'on',
    visible_to_client: formData.get('visibleToClient') === 'on',
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function createDeliverable(projectId: string, formData: FormData) {
  const { supabase } = await requireStaff();

  const file = formData.get('file') as File | null;
  let filePath: string | null = null;
  let fileUrl: string | null = null;

  if (file?.size) {
    const uploaded = await uploadOpsFile(file, `projects/${projectId}/deliverables`);
    filePath = uploaded.path;
    fileUrl = uploaded.url;
  }

  const { error } = await supabase.from('deliverables').insert({
    project_id: projectId,
    title: String(formData.get('title') || ''),
    description: String(formData.get('description') || ''),
    url: String(formData.get('url') || '') || null,
    file_path: filePath,
    file_url: fileUrl,
    visible_to_client: formData.get('visibleToClient') !== 'off',
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function clientAcceptQuote(quoteId: string, projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('quotes')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by: user.id,
    })
    .eq('id', quoteId)
    .eq('project_id', projectId);

  if (error) throw new Error(error.message);

  const admin = createAdminClient();
  await admin.from('projects').update({ status: 'active' }).eq('id', projectId);

  revalidatePath(`/p`);
}

export async function clientRejectQuote(quoteId: string, projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('quotes')
    .update({ status: 'rejected' })
    .eq('id', quoteId)
    .eq('project_id', projectId);

  if (error) throw new Error(error.message);
  revalidatePath(`/p`);
}
