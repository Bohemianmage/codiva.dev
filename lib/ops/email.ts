import { Resend } from 'resend';

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
}) {
  const client = resend();
  const to = process.env.STAFF_NOTIFICATION_EMAIL ?? 'hello@codiva.dev';
  const from = process.env.RESEND_FROM ?? 'Codiva Ops <hello@codiva.dev>';
  if (!client) return { skipped: true };
  await client.emails.send({ from, to: [to], subject, text });
  return { skipped: false };
}

export async function sendClientEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const client = resend();
  const from = process.env.RESEND_FROM ?? 'Codiva <hello@codiva.dev>';
  if (!client) return { skipped: true };
  await client.emails.send({ from, to: [to], subject, html });
  return { skipped: false };
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
