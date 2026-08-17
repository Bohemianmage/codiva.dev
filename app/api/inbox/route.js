import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { notifyStaffSafe } from '@/lib/ops/email';
import { templateContactInboxStaff } from '@/lib/ops/email-templates';
import { logActivity } from '@/lib/ops/activity';
import { parseHuntCookieHeader } from '@/lib/careers/hunt/cookie';
import { classifyInboxLane, lookupInboxLaneSignals } from '@/lib/ops/inbox-lane';
import { NextResponse } from 'next/server';
import {
  PUBLIC_RL_FORM,
  PUBLIC_RL_FORM_EMAIL,
  consumeIpRateLimit,
  consumeRateLimit,
  rateLimitJsonResponse,
} from '@/lib/rate-limit';

export async function POST(request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Servicio no configurado' }, { status: 503 });
  }

  const ipRl = consumeIpRateLimit(request, 'public_inbox', PUBLIC_RL_FORM.windowMs, PUBLIC_RL_FORM.max);
  if (!ipRl.ok) return rateLimitJsonResponse(ipRl.retryAfterMs);

  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const safeName = String(name).trim();
    const safeMessage = String(message).trim();
    const emailKey = String(email).trim().toLowerCase();
    if (!safeName || !emailKey || !safeMessage) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const emailRl = consumeRateLimit(
      `public_inbox_email:${emailKey}`,
      PUBLIC_RL_FORM_EMAIL.windowMs,
      PUBLIC_RL_FORM_EMAIL.max
    );
    if (!emailRl.ok) return rateLimitJsonResponse(emailRl.retryAfterMs);

    const admin = createAdminClient();
    const huntToken = parseHuntCookieHeader(request.headers.get('cookie'));
    const signals = await lookupInboxLaneSignals(admin, { email: emailKey, huntToken });
    const classified = classifyInboxLane({
      name: safeName,
      email: emailKey,
      message: safeMessage,
      hasHuntSession: signals.hasHuntSession,
      matchedCandidate: signals.matchedCandidate,
    });

    const { data: inbox, error } = await admin
      .from('inbox_messages')
      .insert({
        name: safeName,
        email: emailKey,
        message: safeMessage,
        status: 'unread',
        lane: classified.lane,
        lane_reason: classified.reason,
      })
      .select('id')
      .single();

    if (error) throw error;

    await logActivity({
      entityType: 'inbox',
      entityId: inbox.id,
      action: 'created',
      metadata: { lane: classified.lane, reason: classified.reason },
    });

    if (classified.lane !== 'test') {
      const subject =
        classified.lane === 'other' ? `[Inbox · otro] ${safeName}` : `[Inbox] ${safeName}`;
      await notifyStaffSafe({
        subject,
        html: templateContactInboxStaff(safeName, emailKey, safeMessage),
        replyTo: emailKey,
      });
    }

    return NextResponse.json({ success: true, id: inbox.id }, { status: 200 });
  } catch (err) {
    console.error('POST /api/inbox:', err);
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
  }
}
