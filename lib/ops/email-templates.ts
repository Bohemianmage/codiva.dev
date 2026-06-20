import { escapeHtml } from '@/utils/escapeHtml';
import { opsBaseUrl, marketingBaseUrl } from '@/lib/ops/host';
import { BRAND_EMAIL } from '@/lib/brand';

const BRAND = BRAND_EMAIL;

type LayoutOptions = {
  preview?: string;
  title: string;
  bodyHtml: string;
  footerNote?: string;
  cta?: { label: string; href: string };
};

function emailLayout({ preview, title, bodyHtml, footerNote, cta }: LayoutOptions): string {
  const ctaBlock = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
        <tr>
          <td style="border-radius:8px;background:${BRAND.primary};">
            <a href="${cta.href}" target="_blank" rel="noopener noreferrer"
               style="display:inline-block;padding:14px 28px;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
              ${escapeHtml(cta.label)}
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:12px 0 0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};word-break:break-all;">
        Si el botón no funciona, copia este enlace:<br/>
        <a href="${cta.href}" style="color:${BRAND.primary};">${escapeHtml(cta.href)}</a>
      </p>`
    : '';

  const previewText = preview
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.background};">
  ${previewText}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.background};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:${BRAND.primary};padding:24px 32px;">
              <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Codiva</p>
              <h1 style="margin:8px 0 0;font-family:Inter,Arial,sans-serif;font-size:22px;line-height:1.3;font-weight:700;color:#ffffff;">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.65;color:${BRAND.text};">
                ${bodyHtml}
              </div>
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${BRAND.border};">
              <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};">
                ${footerNote ? escapeHtml(footerNote) : 'Codiva - software a la medida y productos digitales'}
              </p>
              <p style="margin:8px 0 0;font-family:Inter,Arial,sans-serif;font-size:12px;">
                <a href="${marketingBaseUrl()}" style="color:${BRAND.primary};text-decoration:none;">codiva.dev</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function greeting(name: string): string {
  return `<p style="margin:0 0 16px;">Hola <strong>${escapeHtml(name)}</strong>,</p>`;
}

export function templateLeadConfirmation(name: string): string {
  return emailLayout({
    preview: 'Recibimos tu solicitud de cotización en Codiva.dev',
    title: 'Recibimos tu solicitud',
    bodyHtml: `
      ${greeting(name)}
      <p style="margin:0 0 12px;">Gracias por contactarnos. Hemos recibido tu solicitud de cotización y nuestro equipo la revisará pronto.</p>
      <p style="margin:0;">Te responderemos a la brevedad por este mismo correo.</p>
    `,
    footerNote: 'Este es un mensaje automático. No respondas a este correo.',
  });
}

export function templateTicketConfirmation(name: string, ticketTitle: string): string {
  return emailLayout({
    preview: `Ticket recibido: ${ticketTitle}`,
    title: 'Ticket de soporte recibido',
    bodyHtml: `
      ${greeting(name)}
      <p style="margin:0 0 12px;">Hemos registrado tu solicitud de soporte:</p>
      <p style="margin:0 0 16px;padding:12px 16px;background:${BRAND.background};border-radius:8px;border-left:4px solid ${BRAND.primary};">
        <strong>${escapeHtml(ticketTitle)}</strong>
      </p>
      <p style="margin:0;">Te contactaremos pronto con novedades.</p>
    `,
  });
}

export function templatePasswordRecovery(): string {
  return emailLayout({
    preview: 'Restablece tu contraseña de Codiva Ops',
    title: 'Restablecer contraseña',
    bodyHtml: `
      <p style="margin:0 0 12px;">Recibimos una solicitud para restablecer tu contraseña.</p>
      <p style="margin:0 0 12px;">Haz clic en el botón para crear una nueva. El enlace expira en breve por seguridad.</p>
      <p style="margin:0;color:${BRAND.muted};font-size:14px;">Si no solicitaste esto, puedes ignorar este correo.</p>
    `,
    cta: { label: 'Crear nueva contraseña', href: '{{RECOVERY_LINK}}' },
  });
}

export function templatePortalPasswordRecovery(projectName: string): string {
  return emailLayout({
    preview: `Restablece tu acceso al portal: ${projectName}`,
    title: 'Restablecer acceso al portal',
    bodyHtml: `
      <p style="margin:0 0 12px;">Recibimos una solicitud para restablecer tu contraseña del portal del proyecto <strong>${escapeHtml(projectName)}</strong>.</p>
      <p style="margin:0;color:${BRAND.muted};font-size:14px;">Si no solicitaste esto, ignora este correo.</p>
    `,
    cta: { label: 'Restablecer contraseña', href: '{{RECOVERY_LINK}}' },
  });
}

export function templatePortalInviteNewUser(
  projectName: string,
  email: string,
  tempPassword: string,
  loginUrl: string
): string {
  return emailLayout({
    preview: `Tu acceso al portal del proyecto ${projectName}`,
    title: 'Bienvenido a tu portal',
    bodyHtml: `
      <p style="margin:0 0 12px;">Se creó tu acceso al portal del proyecto <strong>${escapeHtml(projectName)}</strong>.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;background:${BRAND.background};border-radius:8px;">
        <tr>
          <td style="padding:16px;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;">
            <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p style="margin:0;"><strong>Contraseña temporal:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;">${escapeHtml(tempPassword)}</code></p>
          </td>
        </tr>
      </table>
      <p style="margin:0;color:${BRAND.muted};font-size:14px;">Te recomendamos cambiar tu contraseña al ingresar.</p>
    `,
    cta: { label: 'Entrar al portal', href: loginUrl },
  });
}

export function templatePortalInviteExistingUser(projectName: string, loginUrl: string): string {
  return emailLayout({
    preview: `Tienes acceso al portal: ${projectName}`,
    title: 'Acceso al portal del proyecto',
    bodyHtml: `
      <p style="margin:0 0 12px;">Se te otorgó acceso al portal del proyecto <strong>${escapeHtml(projectName)}</strong>.</p>
      <p style="margin:0;">Usa tu correo y contraseña habituales para entrar.</p>
    `,
    cta: { label: 'Entrar al portal', href: loginUrl },
  });
}

export function templateQuoteSent(projectName: string, portalUrl: string): string {
  return emailLayout({
    preview: `Nueva cotización disponible: ${projectName}`,
    title: 'Nueva propuesta comercial',
    bodyHtml: `
      <p style="margin:0 0 12px;">Tienes una nueva propuesta disponible para el proyecto <strong>${escapeHtml(projectName)}</strong>.</p>
      <p style="margin:0;">Revisa los detalles y, si estás de acuerdo, puedes aceptarla desde tu portal.</p>
    `,
    cta: { label: 'Ver cotización', href: portalUrl },
  });
}

export function templateLeadQuoteSent(
  subjectLabel: string,
  quoteUrl: string,
  options?: { partnerName?: string; endClientLabel?: string }
): string {
  const greeting = options?.partnerName
    ? `<p style="margin:0 0 12px;">Hola <strong>${escapeHtml(options.partnerName)}</strong>,</p>`
    : '';
  const clientLine = options?.endClientLabel
    ? `<p style="margin:0 0 12px;">Cliente de referencia: <strong>${escapeHtml(options.endClientLabel)}</strong>.</p>`
    : '';

  return emailLayout({
    preview: `Propuesta comercial: ${subjectLabel}`,
    title: 'Propuesta comercial disponible',
    bodyHtml: `
      ${greeting}
      <p style="margin:0 0 12px;">Te compartimos una propuesta comercial de Codiva para <strong>${escapeHtml(subjectLabel)}</strong>.</p>
      ${clientLine}
      <p style="margin:0;">Puedes consultar el detalle completo en el enlace siguiente. Si tienes dudas, responde a este correo.</p>
    `,
    cta: { label: 'Ver propuesta', href: quoteUrl },
    footerNote: 'Documento informativo - consulta únicamente.',
  });
}

export function templateStaffAlert(title: string, lines: string[]): string {
  const rows = lines
    .map(
      (line) =>
        `<p style="margin:0 0 8px;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.5;color:${BRAND.text};">${escapeHtml(line)}</p>`
    )
    .join('');

  return emailLayout({
    preview: title,
    title,
    bodyHtml: rows,
    cta: { label: 'Abrir Codiva Ops', href: `${opsBaseUrl()}/dashboard` },
    footerNote: 'Notificación interna - Codiva Ops',
  });
}

export function templateContactInboxStaff(name: string, email: string, message: string): string {
  return emailLayout({
    preview: `Nuevo mensaje de contacto de ${name}`,
    title: 'Nuevo mensaje de contacto',
    bodyHtml: `
      <p style="margin:0 0 8px;"><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p style="margin:0 0 16px;"><strong>Correo:</strong> <a href="mailto:${escapeHtml(email)}" style="color:${BRAND.primary};">${escapeHtml(email)}</a></p>
      <p style="margin:0 0 8px;"><strong>Mensaje:</strong></p>
      <p style="margin:0;padding:16px;background:${BRAND.background};border-radius:8px;white-space:pre-line;">${escapeHtml(message)}</p>
    `,
    cta: { label: 'Ver inbox en Ops', href: `${opsBaseUrl()}/inbox` },
    footerNote: 'Responde directamente a este correo para contactar al remitente.',
  });
}

/** Reemplaza placeholder de recovery link en plantilla Supabase o post-proceso */
export function applyRecoveryLink(html: string, link: string): string {
  return html.replace(/\{\{RECOVERY_LINK\}\}/g, link);
}

export function templatePasswordRecoveryHtml(link: string): string {
  return applyRecoveryLink(templatePasswordRecovery(), link);
}

export function templatePortalPasswordRecoveryHtml(projectName: string, link: string): string {
  return applyRecoveryLink(templatePortalPasswordRecovery(projectName), link);
}
