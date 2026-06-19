'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaff } from '@/lib/ops/auth';
import { logActivity } from '@/lib/ops/activity';
import { generateProjectSlug } from '@/lib/ops/slug';
import { sendClientEmail, notifyStaff } from '@/lib/ops/email';
import {
  templateQuoteSent,
  templateLeadQuoteSent,
  templateStaffAlert,
  templatePortalInviteNewUser,
  templatePortalInviteExistingUser,
} from '@/lib/ops/email-templates';
import { opsBaseUrl } from '@/lib/ops/host';
import { uploadOpsFile } from '@/lib/ops/storage';
import { parseLineItemsJson } from '@/lib/ops/quote-document';
import { ensureQuoteAccessToken, publicQuoteUrl } from '@/lib/ops/quote-tokens';

function parseQuoteFormData(formData: FormData) {
  const lineItemsRaw = String(formData.get('lineItems') || '[]');
  let parsedLineItems: unknown = [];
  try {
    parsedLineItems = JSON.parse(lineItemsRaw);
  } catch {
    parsedLineItems = [];
  }

  return {
    title: String(formData.get('title') || 'Propuesta comercial'),
    serviceType: String(formData.get('serviceType') || 'Web'),
    projectState: String(formData.get('projectState') || 'Por iniciar — pendiente de aprobación formal'),
    scope: String(formData.get('scope') || ''),
    deliverables: String(formData.get('deliverables') || ''),
    considerations: String(formData.get('considerations') || ''),
    optionalExtras: String(formData.get('optionalExtras') || ''),
    lineItems: parseLineItemsJson(parsedLineItems),
    totalAmount: parseFloat(String(formData.get('totalAmount') || '0')) || null,
    currency: String(formData.get('currency') || 'MXN'),
    validUntil: String(formData.get('validUntil') || '') || null,
  };
}

export async function createLead(formData: FormData) {
  const { supabase, user } = await requireStaff();

  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  if (!name) throw new Error('Nombre requerido');
  if (!email) throw new Error('Email requerido');

  const source = String(formData.get('source') || 'manual');
  const budgetRaw = String(formData.get('budget') || '').trim();
  const company = String(formData.get('company') || '').trim();
  const partnerCompany = String(formData.get('partnerCompany') || '').trim() || null;

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      status: 'new',
      source,
      name,
      company,
      email,
      phone: String(formData.get('phone') || '').trim(),
      need: String(formData.get('need') || ''),
      delivery_date: String(formData.get('deliveryDate') || '') || null,
      budget: budgetRaw ? parseFloat(budgetRaw) : null,
      reference_site: String(formData.get('referenceSite') || '').trim() || null,
      partner_name: String(formData.get('partnerName') || '').trim() || null,
      partner_email: String(formData.get('partnerEmail') || '').trim() || null,
      partner_company: partnerCompany,
      end_client_name: String(formData.get('endClientName') || '').trim() || null,
      end_client_company: String(formData.get('endClientCompany') || '').trim() || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  await logActivity({
    entityType: 'lead',
    entityId: lead.id,
    action: 'created',
    metadata: { source },
    actorId: user.id,
  });

  await notifyStaff({
    subject: `[Lead] ${company || name}`,
    html: templateStaffAlert(`Lead creado en Ops — ${company || name}`, [
      `Origen: ${source}`,
      `Nombre: ${name}`,
      `Email: ${email}`,
      company ? `Empresa: ${company}` : null,
      partnerCompany ? `Intermediario: ${partnerCompany}` : null,
    ].filter((line): line is string => Boolean(line))),
  }).catch(() => {});

  revalidatePath('/leads');
  return lead.id;
}

export async function convertInboxToLead(messageId: string) {
  const { supabase, user } = await requireStaff();

  const { data: message, error: msgError } = await supabase
    .from('inbox_messages')
    .select('*')
    .eq('id', messageId)
    .single();
  if (msgError || !message) throw new Error('Mensaje no encontrado');

  if (message.lead_id) {
    return { leadId: message.lead_id };
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      status: 'new',
      source: 'contact_form',
      name: message.name,
      email: message.email,
      need: message.message,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from('inbox_messages')
    .update({ lead_id: lead.id, status: 'read' })
    .eq('id', messageId);

  await logActivity({
    entityType: 'lead',
    entityId: lead.id,
    action: 'created_from_inbox',
    metadata: { inboxMessageId: messageId },
    actorId: user.id,
  });

  revalidatePath('/inbox');
  revalidatePath('/leads');
  return { leadId: lead.id };
}

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

export async function updateLeadDetails(leadId: string, formData: FormData) {
  const { supabase, user } = await requireStaff();

  const assignedTo = String(formData.get('assignedTo') || '').trim();

  const payload = {
    name: String(formData.get('name') || '').trim(),
    company: String(formData.get('company') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    need: String(formData.get('need') || ''),
    partner_name: String(formData.get('partnerName') || '').trim() || null,
    partner_email: String(formData.get('partnerEmail') || '').trim() || null,
    partner_company: String(formData.get('partnerCompany') || '').trim() || null,
    end_client_name: String(formData.get('endClientName') || '').trim() || null,
    end_client_company: String(formData.get('endClientCompany') || '').trim() || null,
    assigned_to: assignedTo || null,
  };

  const { error } = await supabase.from('leads').update(payload).eq('id', leadId);
  if (error) throw new Error(error.message);

  await logActivity({
    entityType: 'lead',
    entityId: leadId,
    action: 'updated',
    actorId: user.id,
  });

  revalidatePath('/leads');
  revalidatePath(`/leads/${leadId}`);
}

export async function createLeadQuote(leadId: string, formData: FormData) {
  const { supabase, user } = await requireStaff();
  const parsed = parseQuoteFormData(formData);

  const { data: last } = await supabase
    .from('quotes')
    .select('version')
    .eq('lead_id', leadId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('quotes').insert({
    lead_id: leadId,
    version: (last?.version ?? 0) + 1,
    status: 'draft',
    title: parsed.title,
    service_type: parsed.serviceType,
    project_state: parsed.projectState,
    scope: parsed.scope,
    deliverables: parsed.deliverables,
    considerations: parsed.considerations,
    optional_extras: parsed.optionalExtras,
    line_items: parsed.lineItems,
    total_amount: parsed.totalAmount,
    currency: parsed.currency,
    valid_until: parsed.validUntil,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

export async function sendLeadQuote(quoteId: string, leadId: string) {
  const { supabase, user } = await requireStaff();
  const admin = createAdminClient();

  const { error } = await supabase
    .from('quotes')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', quoteId)
    .eq('lead_id', leadId);
  if (error) throw new Error(error.message);

  const { data: lead } = await admin.from('leads').select('*').eq('id', leadId).single();
  if (!lead) throw new Error('Lead no encontrado');

  const token = await ensureQuoteAccessToken(quoteId);
  const quoteUrl = publicQuoteUrl(token);
  const recipient = lead.partner_email || lead.email;
  const subjectLabel =
    lead.end_client_company || lead.end_client_name || lead.company || lead.name || 'Oportunidad comercial';

  if (recipient) {
    await sendClientEmail({
      to: recipient,
      subject: `Propuesta comercial: ${subjectLabel}`,
      html: templateLeadQuoteSent(subjectLabel, quoteUrl, {
        partnerName: lead.partner_name || undefined,
        endClientLabel: lead.end_client_company || lead.end_client_name || undefined,
      }),
    });
  }

  await logActivity({
    entityType: 'quote',
    entityId: quoteId,
    action: 'sent',
    metadata: { leadId, recipient },
    actorId: user.id,
  });

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

  await admin.from('quotes').update({ project_id: project.id, lead_id: null }).eq('lead_id', leadId);

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
  const parsed = parseQuoteFormData(formData);

  const { data: last } = await supabase
    .from('quotes')
    .select('version')
    .eq('project_id', projectId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('quotes').insert({
    project_id: projectId,
    version: (last?.version ?? 0) + 1,
    status: 'draft',
    title: parsed.title,
    service_type: parsed.serviceType,
    project_state: parsed.projectState,
    scope: parsed.scope,
    deliverables: parsed.deliverables,
    considerations: parsed.considerations,
    optional_extras: parsed.optionalExtras,
    line_items: parsed.lineItems,
    phases: [],
    total_amount: parsed.totalAmount,
    currency: parsed.currency,
    valid_until: parsed.validUntil,
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
      html: templateQuoteSent(
        project?.name ?? 'Tu proyecto',
        `${opsBaseUrl()}/p/${project?.slug}/cotizacion`
      ),
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
    await sendClientEmail({
      to: email,
      subject: `Acceso a tu portal — ${project.name}`,
      html: templatePortalInviteExistingUser(
        project.name,
        `${opsBaseUrl()}/p/${project.slug}/login`
      ),
    });
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
      html: templatePortalInviteNewUser(
        project.name,
        email,
        tempPassword,
        `${opsBaseUrl()}/p/${project.slug}/login`
      ),
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
