import { Resend } from 'resend';
import {
  templateLeadConfirmation,
  templateTicketConfirmation,
} from '@/lib/ops/email-templates';

export type EmailResult =
  | { ok: true }
  | { ok: false; skipped?: boolean; error: string };

function escapeHtmlForEmail(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const resend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
};

function fromAddress(kind: 'ops' | 'client' = 'client'): string {
  return process.env.RESEND_FROM ?? (kind === 'ops' ? 'Codiva Ops <hello@codiva.dev>' : 'Codiva <hello@codiva.dev>');
}

export async function notifyStaff({
  subject,
  text,
  html,
  replyTo,
}: {
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const client = resend();
  const to = process.env.STAFF_NOTIFICATION_EMAIL ?? 'hello@codiva.dev';
  if (!client) return { ok: false, skipped: true, error: 'RESEND_API_KEY no configurada' };

  const payload = {
    from: fromAddress('ops'),
    to: [to],
    subject,
    html: html ?? `<p>${escapeHtmlForEmail(text ?? subject)}</p>`,
    ...(replyTo ? { reply_to: replyTo } : {}),
  };

  const { error } = await client.emails.send(payload);
  if (error) {
    console.error('Resend notifyStaff:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function sendClientEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const client = resend();
  if (!client) return { ok: false, skipped: true, error: 'RESEND_API_KEY no configurada' };

  const { error } = await client.emails.send({
    from: fromAddress('client'),
    to: [to],
    subject,
    html,
    ...(replyTo ? { reply_to: replyTo } : {}),
  });
  if (error) {
    console.error('Resend sendClientEmail:', error, { to });
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function sendLeadConfirmationEmail({ to, name }: { to: string; name: string }) {
  return sendClientEmail({
    to,
    subject: 'Hemos recibido tu solicitud en Codiva.dev',
    html: templateLeadConfirmation(name),
  });
}

export async function sendTicketConfirmationEmail({
  to,
  name,
  ticketTitle,
}: {
  to: string;
  name: string;
  ticketTitle: string;
}) {
  return sendClientEmail({
    to,
    subject: `Ticket recibido: ${ticketTitle}`,
    html: templateTicketConfirmation(name, ticketTitle),
  });
}

/** @deprecated Usa sendLeadConfirmationEmail o sendTicketConfirmationEmail */
export async function sendConfirmationEmail({
  to,
  name,
  subject,
  body,
  ticketTitle,
}: {
  to: string;
  name: string;
  subject: string;
  body?: string;
  ticketTitle?: string;
}) {
  if (ticketTitle) {
    return sendTicketConfirmationEmail({ to, name, ticketTitle });
  }
  return sendClientEmail({
    to,
    subject,
    html: templateLeadConfirmation(name),
  });
}
