import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { notifyStaff, sendLeadConfirmationEmail } from '@/lib/ops/email';
import { templateStaffAlert } from '@/lib/ops/email-templates';
import { logActivity } from '@/lib/ops/activity';
import { NextResponse } from 'next/server';

export async function POST(request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Servicio no configurado' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const admin = createAdminClient();

    const { data: lead, error } = await admin
      .from('leads')
      .insert({
        status: 'new',
        source: 'web_cotiza',
        name: body.name || 'Sin nombre',
        company: body.company || '',
        email: body.email || '',
        phone: body.phone || '',
        need: body.need || '',
        sections: body.sections ?? [],
        functionalities: body.functionalities ?? [],
        has_content: body.hasContent || null,
        has_domain: body.hasDomain || null,
        has_hosting: body.hasHosting || null,
        delivery_date: body.deliveryDate || null,
        budget: body.budget ? parseFloat(body.budget) : null,
        reference_site: body.referenceSite || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    await logActivity({
      entityType: 'lead',
      entityId: lead.id,
      action: 'created',
      metadata: { source: 'web_cotiza' },
    });

    await sendLeadConfirmationEmail({
      to: body.email,
      name: body.name || 'Cliente',
    }).catch(() => {});

    await notifyStaff({
      subject: `[Lead] ${body.company || body.name}`,
      html: templateStaffAlert(`Nuevo lead - ${body.company || body.name}`, [
        `Nombre: ${body.name}`,
        body.company ? `Empresa: ${body.company}` : null,
        `Email: ${body.email}`,
        body.phone ? `Tel: ${body.phone}` : null,
        body.need ? `Necesidad: ${body.need}` : null,
      ].filter(Boolean)),
    });

    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/leads:', err);
    return NextResponse.json({ error: 'Error al registrar solicitud' }, { status: 500 });
  }
}
