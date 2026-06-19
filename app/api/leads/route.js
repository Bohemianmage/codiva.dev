import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { notifyStaff, sendConfirmationEmail } from '@/lib/ops/email';
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

    await sendConfirmationEmail({
      to: body.email,
      name: body.name || 'Cliente',
      subject: 'Hemos recibido tu solicitud en Codiva.dev',
      body: 'Gracias por contactarnos. Pronto nos pondremos en contacto contigo.',
    });

    await notifyStaff({
      subject: `[Lead] ${body.company || body.name}`,
      text: `Nuevo lead desde /cotiza\n\nNombre: ${body.name}\nEmpresa: ${body.company}\nEmail: ${body.email}\nTel: ${body.phone}\n\nVer en Ops: leads`,
    });

    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/leads:', err);
    return NextResponse.json({ error: 'Error al registrar solicitud' }, { status: 500 });
  }
}
