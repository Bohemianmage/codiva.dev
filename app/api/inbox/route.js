import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { notifyStaff } from '@/lib/ops/email';
import { logActivity } from '@/lib/ops/activity';
import { NextResponse } from 'next/server';
import { escapeHtml } from '@/utils/escapeHtml';

export async function POST(request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Servicio no configurado' }, { status: 503 });
  }

  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: inbox, error } = await admin
      .from('inbox_messages')
      .insert({ name, email, message, status: 'unread' })
      .select('id')
      .single();

    if (error) throw error;

    await logActivity({
      entityType: 'inbox',
      entityId: inbox.id,
      action: 'created',
    });

    await notifyStaff({
      subject: `[Inbox] ${name}`,
      text: `Nuevo mensaje de contacto\n\n${name} <${email}>\n\n${message}`,
    });

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      const from = process.env.RESEND_FROM || 'Codiva.dev <hello@codiva.dev>';
      const safeName = escapeHtml(name);
      const safeEmail = escapeHtml(email);
      const safeMessage = escapeHtml(message);
      await resend.emails.send({
        from,
        to: 'hello@codiva.dev',
        subject: `Nuevo mensaje de contacto – ${name}`,
        reply_to: email,
        html: `<h2>Nuevo mensaje</h2><p><strong>Nombre:</strong> ${safeName}</p><p><strong>Correo:</strong> ${safeEmail}</p><p><strong>Mensaje:</strong></p><p style="white-space: pre-line;">${safeMessage}</p>`,
      });
    }

    return NextResponse.json({ success: true, id: inbox.id }, { status: 200 });
  } catch (err) {
    console.error('POST /api/inbox:', err);
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
  }
}
