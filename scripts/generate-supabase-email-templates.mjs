import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCodivaEmail } from './supabase-email-layout.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'supabase', 'email-templates');

const templates = [
  {
    file: 'recovery.html',
    subject: 'Restablecer contraseña — Codiva Ops',
    title: 'Restablecer contraseña',
    preview: 'Restablece tu contraseña de Codiva Ops',
    paragraphs: [
      'Recibimos una solicitud para restablecer tu contraseña.',
      'Haz clic en el botón para crear una nueva. El enlace expira en breve por seguridad.',
    ],
    ctaLabel: 'Crear nueva contraseña',
    disclaimer: 'Si no solicitaste esto, puedes ignorar este correo.',
  },
  {
    file: 'confirmation.html',
    subject: 'Confirma tu cuenta — Codiva',
    title: 'Confirma tu cuenta',
    preview: 'Confirma tu correo para activar tu cuenta en Codiva',
    paragraphs: [
      'Gracias por registrarte en Codiva.',
      'Confirma tu correo electrónico para activar tu cuenta y continuar.',
    ],
    ctaLabel: 'Confirmar email',
  },
  {
    file: 'invite.html',
    subject: 'Invitación al portal — Codiva',
    title: 'Invitación al portal',
    preview: 'Has sido invitado a un portal de proyecto en Codiva',
    paragraphs: [
      'Has sido invitado a acceder al portal de un proyecto en Codiva Ops.',
      'Acepta la invitación para configurar tu acceso.',
    ],
    ctaLabel: 'Aceptar invitación',
  },
  {
    file: 'magic-link.html',
    subject: 'Tu enlace de acceso — Codiva Ops',
    title: 'Iniciar sesión',
    preview: 'Usa este enlace para iniciar sesión en Codiva Ops',
    paragraphs: [
      'Solicitaste un enlace mágico para iniciar sesión.',
      'Haz clic en el botón para entrar. El enlace expira en breve.',
    ],
    ctaLabel: 'Iniciar sesión',
    disclaimer: 'Si no solicitaste esto, ignora este correo.',
  },
  {
    file: 'email-change.html',
    subject: 'Confirma tu nuevo email — Codiva',
    title: 'Confirmar cambio de email',
    preview: 'Confirma tu nuevo correo electrónico en Codiva',
    paragraphs: [
      'Recibimos una solicitud para cambiar el correo de tu cuenta.',
      'Confirma tu nuevo email haciendo clic en el botón.',
    ],
    ctaLabel: 'Confirmar nuevo email',
    disclaimer: 'Si no solicitaste este cambio, ignora este correo.',
  },
];

for (const tpl of templates) {
  const html = buildCodivaEmail(tpl);
  writeFileSync(join(outDir, tpl.file), html, 'utf8');
  console.log(`✓ ${tpl.file}`);
}

console.log('\nPlantillas generadas en supabase/email-templates/');
console.log('Pega cada HTML en Supabase → Authentication → Email Templates (usa el Subject del comentario inicial).');
