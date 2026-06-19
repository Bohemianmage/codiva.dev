import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { notifyStaff } from '@/lib/ops/email';
import { templateContactInboxStaff } from '@/lib/ops/email-templates';
import { logActivity } from '@/lib/ops/activity';
import { NextResponse } from 'next/server';

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
      html: templateContactInboxStaff(name, email, message),
      replyTo: email,
    });

    return NextResponse.json({ success: true, id: inbox.id }, { status: 200 });
  } catch (err) {
    console.error('POST /api/inbox:', err);
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
  }
}
