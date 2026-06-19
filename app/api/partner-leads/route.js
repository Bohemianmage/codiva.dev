import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { notifyStaff } from '@/lib/ops/email';
import { templateStaffAlert } from '@/lib/ops/email-templates';
import { logActivity } from '@/lib/ops/activity';
import { NextResponse } from 'next/server';

export async function POST(request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Servicio no configurado' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const partnerName = String(body.partnerName || '').trim();
    const partnerEmail = String(body.partnerEmail || '').trim().toLowerCase();
    const partnerCompany = String(body.partnerCompany || '').trim();
    const need = String(body.need || '').trim();

    if (!partnerName || !partnerEmail || !partnerCompany || !need) {
      return NextResponse.json({ error: 'Completa los campos obligatorios' }, { status: 400 });
    }

    const admin = createAdminClient();
    const serviceType = String(body.serviceType || 'Web').trim();
    const needWithType = `[${serviceType}] ${need}`;

    const { data: lead, error } = await admin
      .from('leads')
      .insert({
        status: 'new',
        source: 'referral',
        name: partnerName,
        company: partnerCompany,
        email: partnerEmail,
        phone: String(body.phone || '').trim(),
        need: needWithType,
        delivery_date: body.deliveryDate || null,
        budget: body.budget ? parseFloat(body.budget) : null,
        reference_site: body.referenceSite || null,
        partner_name: partnerName,
        partner_email: partnerEmail,
        partner_company: partnerCompany,
        end_client_name: String(body.endClientName || '').trim() || null,
        end_client_company: String(body.endClientCompany || '').trim() || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    await logActivity({
      entityType: 'lead',
      entityId: lead.id,
      action: 'created',
      metadata: { source: 'referral', channel: 'partner_form' },
    });

    await notifyStaff({
      subject: `[Partner] ${partnerCompany}${body.endClientCompany ? ` → ${body.endClientCompany}` : ''}`,
      html: templateStaffAlert(`Nueva solicitud de partner - ${partnerCompany}`, [
        `Intermediario: ${partnerName}`,
        `Email: ${partnerEmail}`,
        body.endClientCompany ? `Cliente final: ${body.endClientCompany}` : null,
        body.endClientName ? `Contacto cliente: ${body.endClientName}` : null,
        `Tipo: ${serviceType}`,
        `Alcance: ${need}`,
        body.budget ? `Presupuesto ref.: ${body.budget}` : null,
      ].filter(Boolean)),
    });

    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/partner-leads:', err);
    return NextResponse.json({ error: 'Error al registrar solicitud' }, { status: 500 });
  }
}
