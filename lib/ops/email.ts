import { Resend } from 'resend';

export type EmailResult =
  | { ok: true }
  | { ok: false; skipped?: boolean; error: string };

const resend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
};

export async function notifyStaff({
  subject,
  text,
}: {
  subject: string;
  text: string;
}): Promise<EmailResult> {
  const client = resend();
  const to = process.env.STAFF_NOTIFICATION_EMAIL ?? 'hello@codiva.dev';
  const from = process.env.RESEND_FROM ?? 'Codiva Ops <hello@codiva.dev>';
  if (!client) return { ok: false, skipped: true, error: 'RESEND_API_KEY no configurada' };

  const { error } = await client.emails.send({ from, to: [to], subject, text });
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
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const client = resend();
  const from = process.env.RESEND_FROM ?? 'Codiva <hello@codiva.dev>';
  if (!client) return { ok: false, skipped: true, error: 'RESEND_API_KEY no configurada' };

  const { error } = await client.emails.send({ from, to: [to], subject, html });
  if (error) {
    console.error('Resend sendClientEmail:', error, { to, from });
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function sendConfirmationEmail({
  to,
  name,
  subject,
  body,
}: {
  to: string;
  name: string;
  subject: string;
  body: string;
}) {
  return sendClientEmail({
    to,
    subject,
    html: `<p>Hola ${name},</p><p>${body}</p><p>— Codiva</p>`,
  });
}
