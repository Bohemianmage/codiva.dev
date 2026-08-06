/**
 * One-off: envía una muestra de cada plantilla transaccional.
 * Uso: npx tsx --env-file=.env.local scripts/send-test-emails.ts
 */
import { Resend } from 'resend';
import {
  templateLeadConfirmation,
  templateTicketConfirmation,
  templatePasswordRecoveryHtml,
  templatePortalPasswordRecoveryHtml,
  templatePortalInviteNewUser,
  templatePortalInviteExistingUser,
  templateQuoteSent,
  templateLeadQuoteSent,
  templateLegalReacceptance,
  templateStaffAlert,
  templateContactInboxStaff,
} from '../lib/ops/email-templates';

const TO = process.argv[2] || 'jeanclaudes.1992@gmail.com';
const apiKey = process.env.RESEND_API_KEY;
const from =
  process.env.RESEND_FROM_NOREPLY ||
  process.env.RESEND_FROM ||
  'Codiva.dev <noreply@codiva.dev>';
const replyTo = process.env.RESEND_REPLY_TO || 'hello@codiva.dev';

if (!apiKey) {
  console.error('Falta RESEND_API_KEY');
  process.exit(1);
}

const resend = new Resend(apiKey);
const fakeLogin = 'https://portal.codiva.dev/p/byd/login';
const fakeQuote = 'https://portal.codiva.dev/p/byd/cotizacion';
const fakePublicQuote = 'https://ops.codiva.dev/q/demo-token-test';
const fakeAccept = 'https://portal.codiva.dev/p/byd/aceptar';
const fakeRecovery = 'https://ops.codiva.dev/auth/callback?type=recovery&token=demo';

const samples: { subject: string; html: string; fromOps?: boolean }[] = [
  {
    subject: '[TEST] Lead confirmation',
    html: templateLeadConfirmation('Jean Claude'),
  },
  {
    subject: '[TEST] Ticket confirmation',
    html: templateTicketConfirmation('Jean Claude', 'No puedo ver la cotización BYD'),
  },
  {
    subject: '[TEST] Password recovery (Ops)',
    html: templatePasswordRecoveryHtml(fakeRecovery),
  },
  {
    subject: '[TEST] Portal password recovery',
    html: templatePortalPasswordRecoveryHtml('BYD Sitio Web', fakeRecovery),
  },
  {
    subject: '[TEST] Portal invite — nuevo usuario',
    html: templatePortalInviteNewUser('BYD Sitio Web', TO, 'TempPass-Demo-123', fakeLogin, {
      partnerName: 'Miguel Alonso',
      endClientLabel: 'BYD',
    }),
  },
  {
    subject: '[TEST] Portal invite — usuario existente',
    html: templatePortalInviteExistingUser('BYD Sitio Web', fakeLogin, {
      partnerName: 'Miguel Alonso',
      endClientLabel: 'BYD',
    }),
  },
  {
    subject: '[TEST] Quote sent (portal)',
    html: templateQuoteSent('BYD Sitio Web', fakeQuote, {
      partnerName: 'Miguel Alonso',
      endClientLabel: 'BYD',
    }),
  },
  {
    subject: '[TEST] Lead quote sent (link público)',
    html: templateLeadQuoteSent('BYD', fakePublicQuote, {
      partnerName: 'Miguel Alonso',
      endClientLabel: 'BYD',
    }),
  },
  {
    subject: '[TEST] Legal reacceptance',
    html: templateLegalReacceptance('BYD Sitio Web', fakeAccept, '2026.08.06'),
  },
  {
    subject: '[TEST] Staff alert',
    html: templateStaffAlert('Lead creado en Ops - BYD', [
      'Origen: referral',
      'Nombre: Miguel Alonso',
      `Email: ${TO}`,
      'Empresa: BYD',
    ]),
    fromOps: true,
  },
  {
    subject: '[TEST] Contact inbox (staff)',
    html: templateContactInboxStaff(
      'Jean Claude',
      TO,
      'Hola, quisiera revisar la propuesta del sitio BYD y agendar una llamada.'
    ),
    fromOps: true,
  },
];

const opsFrom = process.env.RESEND_FROM_OPS || `Codiva Ops <${replyTo}>`;

async function main() {
  console.log(`Enviando ${samples.length} correos de prueba → ${TO}`);
  console.log(`From (noreply): ${from}`);
  console.log(`Reply-To: ${replyTo}\n`);

  const results: { subject: string; ok: boolean; id?: string; error?: string }[] = [];

  for (const sample of samples) {
    const { data, error } = await resend.emails.send({
      from: sample.fromOps ? opsFrom : from,
      to: [TO],
      replyTo,
      subject: sample.subject,
      html: sample.html,
    });

    if (error) {
      console.error(`✗ ${sample.subject}: ${error.message}`);
      results.push({ subject: sample.subject, ok: false, error: error.message });
    } else {
      console.log(`✓ ${sample.subject} (${data?.id ?? 'ok'})`);
      results.push({ subject: sample.subject, ok: true, id: data?.id });
    }

    // Evitar rate limit agresivo
    await new Promise((r) => setTimeout(r, 400));
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\nListo: ${results.length - failed.length}/${results.length} enviados`);
  if (failed.length) {
    console.error('Fallidos:', failed.map((f) => f.subject).join(', '));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
