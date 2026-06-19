export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { notifyStaff, sendConfirmationEmail } from '@/lib/ops/email';
import { logActivity } from '@/lib/ops/activity';
import { uploadOpsFile } from '@/lib/ops/storage';

const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;

const toStr = (v) => (typeof v === 'string' ? v : (v ?? '').toString());

const validate = (p) => {
  const e = [];
  ['name', 'email', 'company', 'issueTitle', 'issueDescription', 'priority'].forEach((k) => {
    if (!p[k] || p[k].trim() === '') e.push(`${k} requerido`);
  });
  if (p.email && !/^\S+@\S+\.\S+$/.test(p.email)) e.push('email inválido');
  if (p.priority && !['Alta', 'Media', 'Baja'].includes(p.priority)) e.push('priority inválido');
  return e;
};

const priorityMap = {
  Alta: 'alta',
  Media: 'media',
  Baja: 'baja',
};

export async function POST(req) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Servicio no configurado' }, { status: 503 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Se requiere multipart/form-data' }, { status: 400 });
    }

    const form = await req.formData();
    const body = {
      name: toStr(form.get('name')),
      email: toStr(form.get('email')),
      company: toStr(form.get('company')),
      issueTitle: toStr(form.get('issueTitle')),
      issueDescription: toStr(form.get('issueDescription')),
      priority: toStr(form.get('priority')),
      incidentTime: toStr(form.get('incidentTime')),
      projectId: toStr(form.get('projectId')) || null,
    };

    const errors = validate(body);
    if (errors.length) return NextResponse.json({ error: errors.join(' | ') }, { status: 400 });

    const files = form.getAll('attachments').filter(Boolean);
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Máximo ${MAX_FILES} archivos` }, { status: 400 });
    }

    const admin = createAdminClient();

    let organizationId = null;
    if (body.projectId) {
      const { data: project } = await admin
        .from('projects')
        .select('organization_id')
        .eq('id', body.projectId)
        .single();
      organizationId = project?.organization_id ?? null;
    }

    const { data: ticket, error: ticketError } = await admin
      .from('tickets')
      .insert({
        project_id: body.projectId || null,
        organization_id: organizationId,
        title: body.issueTitle,
        description: body.issueDescription,
        status: 'new',
        priority: priorityMap[body.priority] ?? 'media',
        reporter_name: body.name,
        reporter_email: body.email,
        incident_time: body.incidentTime || null,
      })
      .select('id')
      .single();

    if (ticketError) throw ticketError;

    const uploadedUrls = [];
    for (const f of files) {
      if (!f?.size) continue;
      if (f.size > MAX_BYTES) {
        return NextResponse.json({ error: `Archivo ${f.name} excede 10MB` }, { status: 400 });
      }
      const uploaded = await uploadOpsFile(f, `tickets/${ticket.id}`);
      uploadedUrls.push(uploaded.url);
      await admin.from('ticket_attachments').insert({
        ticket_id: ticket.id,
        file_path: uploaded.path,
        file_url: uploaded.url,
        file_name: f.name || 'attachment',
      });
    }

    await logActivity({
      entityType: 'ticket',
      entityId: ticket.id,
      action: 'created',
      metadata: { source: 'form' },
    });

    await sendConfirmationEmail({
      to: body.email,
      name: body.name,
      subject: `Ticket recibido: ${body.issueTitle}`,
      body: 'Hemos registrado tu solicitud de soporte. Te contactaremos pronto.',
    });

    await notifyStaff({
      subject: `[Ticket] ${body.priority} · ${body.issueTitle}`,
      text: [
        `Empresa: ${body.company}`,
        `Reportado por: ${body.name} <${body.email}>`,
        body.incidentTime ? `Hora: ${body.incidentTime}` : null,
        body.issueDescription,
        uploadedUrls.length ? `Adjuntos: ${uploadedUrls.length}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    });

    return NextResponse.json({ ok: true, ticketId: ticket.id, files: uploadedUrls }, { status: 201 });
  } catch (err) {
    console.error('POST /api/ticket:', err);
    const message = err?.message ? err.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
