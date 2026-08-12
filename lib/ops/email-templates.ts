import { escapeHtml } from '@/utils/escapeHtml';
import { opsBaseUrl, marketingBaseUrl } from '@/lib/ops/host';
import { BRAND_EMAIL, CODIVA_BRAND } from '@/lib/brand';

const BRAND = BRAND_EMAIL;
const BRAND_NAME = CODIVA_BRAND.name;
const CONTACT_EMAIL = CODIVA_BRAND.urls.email;
const FONT_BODY = `'Inter', Arial, Helvetica, sans-serif`;
const FONT_DISPLAY = `'Plus Jakarta Sans', Inter, Arial, Helvetica, sans-serif`;
const CTA_RADIUS = '12px';
/** Mark oficial: primary teal sobre fondo transparente. */
const LOGO_URL = `${CODIVA_BRAND.urls.site.replace(/\/$/, '')}/logo.svg`;

/** Wordmark Codiva.dev: tipografía display + colores de marca (no uppercase genérico). */
function brandWordmarkHtml(): string {
  return `<p style="margin:0;font-family:${FONT_DISPLAY};font-size:22px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:${BRAND.text};">
    Codiva<span style="font-weight:500;color:${BRAND.primary};">.dev</span>
  </p>`;
}

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
          <td style="border-radius:${CTA_RADIUS};background:${BRAND.primary};">
            <a href="${cta.href}" target="_blank" rel="noopener noreferrer"
               style="display:inline-block;padding:14px 28px;font-family:${FONT_BODY};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:${CTA_RADIUS};">
              ${escapeHtml(cta.label)}
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:12px 0 0;font-family:${FONT_BODY};font-size:12px;line-height:1.5;color:${BRAND.muted};word-break:break-all;">
        Si el botón no funciona, copia este enlace:<br/>
        <a href="${cta.href}" style="color:${BRAND.primary};">${escapeHtml(cta.href)}</a>
      </p>`
    : '';

  const previewText = preview
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>`
    : '';

  const defaultFooter = CODIVA_BRAND.tagline;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet"/>
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;background:${BRAND.background};">
  ${previewText}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.background};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td bgcolor="${BRAND.card}" style="background:${BRAND.card};padding:24px 32px 20px;border-bottom:1px solid ${BRAND.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="${LOGO_URL}" alt="" width="36" height="36" style="display:block;border:0;outline:none;"/>
                  </td>
                  <td style="vertical-align:middle;">
                    ${brandWordmarkHtml()}
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;font-family:${FONT_DISPLAY};font-size:22px;line-height:1.3;font-weight:700;color:${BRAND.text};">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-family:${FONT_BODY};font-size:15px;line-height:1.65;color:${BRAND.text};">
                ${bodyHtml}
              </div>
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${BRAND.border};">
              <p style="margin:0;font-family:${FONT_BODY};font-size:12px;line-height:1.5;color:${BRAND.muted};">
                ${footerNote ? escapeHtml(footerNote) : escapeHtml(defaultFooter)}
              </p>
              <p style="margin:8px 0 0;font-family:${FONT_BODY};font-size:12px;line-height:1.5;">
                <a href="mailto:${CONTACT_EMAIL}" style="color:${BRAND.primary};text-decoration:none;">${CONTACT_EMAIL}</a>
                <span style="color:${BRAND.muted};"> · </span>
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

export type QuoteEmailContext = {
  recipientName?: string;
  partnerName?: string;
  endClientLabel?: string;
};

export function templateLeadConfirmation(name: string): string {
  return emailLayout({
    preview: `Recibimos tu solicitud de cotización en ${BRAND_NAME}`,
    title: 'Recibimos tu solicitud',
    bodyHtml: `
      ${greeting(name)}
      <p style="margin:0 0 12px;">Gracias por contactarnos. Hemos recibido tu solicitud de cotización y nuestro equipo la revisará pronto.</p>
      <p style="margin:0;">Te responderemos a la brevedad. Si necesitas escribirnos, usa <a href="mailto:${CONTACT_EMAIL}" style="color:${BRAND.primary};">${CONTACT_EMAIL}</a>.</p>
    `,
    footerNote: 'Mensaje automático de Codiva.dev. Las respuestas a noreply no se monitorean; escribe a hello@codiva.dev.',
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
    preview: 'Restablece tu contraseña de Codiva.dev',
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

function projectAccessBlock(projectName: string): string {
  const names = projectName
    .split(/\s+y\s+/)
    .flatMap((part) => part.split(/,\s*/))
    .map((n) => n.trim())
    .filter(Boolean);
  if (names.length <= 1) {
    return `<p style="margin:0 0 12px;">Se creó tu acceso al portal de <strong>${escapeHtml(BRAND_NAME)}</strong> para el proyecto <strong>${escapeHtml(projectName)}</strong>.</p>`;
  }
  const list = names.map((n) => `<li style="margin:0 0 4px;"><strong>${escapeHtml(n)}</strong></li>`).join('');
  return `<p style="margin:0 0 12px;">Se creó tu acceso al portal de <strong>${escapeHtml(BRAND_NAME)}</strong> para estos proyectos:</p><ul style="margin:0 0 12px;padding-left:20px;">${list}</ul>`;
}

function projectAccessBlockExisting(projectName: string): string {
  const names = projectName
    .split(/\s+y\s+/)
    .flatMap((part) => part.split(/,\s*/))
    .map((n) => n.trim())
    .filter(Boolean);
  if (names.length <= 1) {
    return `<p style="margin:0 0 12px;">Se te otorgó acceso al portal de <strong>${escapeHtml(BRAND_NAME)}</strong> para el proyecto <strong>${escapeHtml(projectName)}</strong>.</p>`;
  }
  const list = names.map((n) => `<li style="margin:0 0 4px;"><strong>${escapeHtml(n)}</strong></li>`).join('');
  return `<p style="margin:0 0 12px;">Se te otorgó acceso al portal de <strong>${escapeHtml(BRAND_NAME)}</strong> para estos proyectos:</p><ul style="margin:0 0 12px;padding-left:20px;">${list}</ul>`;
}

export function templatePortalInviteNewUser(
  projectName: string,
  email: string,
  tempPassword: string,
  loginUrl: string,
  options?: QuoteEmailContext
): string {
  const hello = options?.recipientName ? greeting(options.recipientName) : '';
  const clientLine = options?.endClientLabel
    ? `<p style="margin:0 0 12px;">Cliente: <strong>${escapeHtml(options.endClientLabel)}</strong>.</p>`
    : '';

  return emailLayout({
    preview: `Tu acceso al portal: ${projectName}`,
    title: 'Bienvenido a tu portal',
    bodyHtml: `
      ${hello}
      ${projectAccessBlock(projectName)}
      ${clientLine}
      <p style="margin:0 0 12px;">Ahí podrás revisar la propuesta, la arquitectura y la cotización cuando estén publicadas. Si tienes más de un proyecto, verás el listado al entrar.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;background:${BRAND.background};border-radius:8px;">
        <tr>
          <td style="padding:16px;font-family:${FONT_BODY};font-size:14px;line-height:1.6;">
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

export function templatePortalInviteExistingUser(
  projectName: string,
  loginUrl: string,
  options?: QuoteEmailContext
): string {
  const hello = options?.recipientName ? greeting(options.recipientName) : '';
  const clientLine = options?.endClientLabel
    ? `<p style="margin:0 0 12px;">Cliente: <strong>${escapeHtml(options.endClientLabel)}</strong>.</p>`
    : '';

  return emailLayout({
    preview: `Tienes acceso al portal: ${projectName}`,
    title: 'Acceso al portal',
    bodyHtml: `
      ${hello}
      ${projectAccessBlockExisting(projectName)}
      ${clientLine}
      <p style="margin:0 0 12px;">Usa tu correo y contraseña habituales. En el portal encontrarás propuesta, arquitectura y cotización.</p>
      <p style="margin:0;">Si necesitas ayuda, escribe a <a href="mailto:${CONTACT_EMAIL}" style="color:${BRAND.primary};">${CONTACT_EMAIL}</a>.</p>
    `,
    cta: { label: 'Entrar al portal', href: loginUrl },
  });
}

export function templateStaffInviteNewUser(
  fullName: string,
  email: string,
  tempPassword: string,
  loginUrl: string,
  roleLabel: string
): string {
  const hello = fullName ? greeting(fullName) : '';
  return emailLayout({
    preview: `Acceso a Codiva.dev`,
    title: 'Bienvenido al equipo',
    bodyHtml: `
      ${hello}
      <p style="margin:0 0 12px;">Se creó tu acceso a <strong>${escapeHtml(BRAND_NAME)}</strong> con rol <strong>${escapeHtml(roleLabel)}</strong>.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;background:${BRAND.background};border-radius:8px;">
        <tr>
          <td style="padding:16px;font-family:${FONT_BODY};font-size:14px;line-height:1.6;">
            <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p style="margin:0;"><strong>Contraseña temporal:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;">${escapeHtml(tempPassword)}</code></p>
          </td>
        </tr>
      </table>
      <p style="margin:0;color:${BRAND.muted};font-size:14px;">Cambia tu contraseña al ingresar.</p>
    `,
    cta: { label: 'Entrar a Codiva.dev', href: loginUrl },
  });
}

export function templateStaffInviteExistingUser(
  fullName: string,
  loginUrl: string,
  roleLabel: string
): string {
  const hello = fullName ? greeting(fullName) : '';
  return emailLayout({
    preview: `Acceso a Codiva.dev`,
    title: 'Acceso a Codiva.dev',
    bodyHtml: `
      ${hello}
      <p style="margin:0 0 12px;">Se te otorgó acceso a <strong>${escapeHtml(BRAND_NAME)}</strong> con rol <strong>${escapeHtml(roleLabel)}</strong>.</p>
      <p style="margin:0;">Usa tu correo y contraseña habituales.</p>
    `,
    cta: { label: 'Entrar a Codiva.dev', href: loginUrl },
  });
}

export function templateQuoteSent(
  projectName: string,
  portalUrl: string,
  options?: QuoteEmailContext
): string {
  const hello = options?.recipientName
    ? greeting(options.recipientName)
    : options?.partnerName
      ? greeting(options.partnerName)
      : '';
  const clientLine = options?.endClientLabel
    ? `<p style="margin:0 0 12px;">Cliente de referencia: <strong>${escapeHtml(options.endClientLabel)}</strong>.</p>`
    : '';

  return emailLayout({
    preview: `Nueva cotización disponible: ${projectName}`,
    title: 'Nueva propuesta comercial',
    bodyHtml: `
      ${hello}
      <p style="margin:0 0 12px;">Tienes una nueva propuesta comercial de <strong>${escapeHtml(BRAND_NAME)}</strong> para el proyecto <strong>${escapeHtml(projectName)}</strong>.</p>
      ${clientLine}
      <p style="margin:0 0 12px;">Revisa alcance, arquitectura y montos en tu portal. Si estás de acuerdo, puedes aceptarla desde ahí.</p>
      <p style="margin:0;">Dudas comerciales: <a href="mailto:${CONTACT_EMAIL}" style="color:${BRAND.primary};">${CONTACT_EMAIL}</a>.</p>
    `,
    cta: { label: 'Ver cotización', href: portalUrl },
  });
}

export function templateLeadQuoteSent(
  subjectLabel: string,
  quoteUrl: string,
  options?: QuoteEmailContext
): string {
  const hello = options?.partnerName
    ? greeting(options.partnerName)
    : options?.recipientName
      ? greeting(options.recipientName)
      : '';
  const clientLine = options?.endClientLabel
    ? `<p style="margin:0 0 12px;">Cliente de referencia: <strong>${escapeHtml(options.endClientLabel)}</strong>.</p>`
    : '';

  return emailLayout({
    preview: `Propuesta comercial: ${subjectLabel}`,
    title: 'Propuesta comercial disponible',
    bodyHtml: `
      ${hello}
      <p style="margin:0 0 12px;">Te compartimos una propuesta comercial de <strong>${escapeHtml(BRAND_NAME)}</strong> para <strong>${escapeHtml(subjectLabel)}</strong>.</p>
      ${clientLine}
      <p style="margin:0;">Puedes consultar el detalle completo en el enlace. Si tienes dudas, escribe a <a href="mailto:${CONTACT_EMAIL}" style="color:${BRAND.primary};">${CONTACT_EMAIL}</a>.</p>
    `,
    cta: { label: 'Ver propuesta', href: quoteUrl },
    footerNote: 'Documento informativo. Consulta únicamente.',
  });
}

export function templateLegalReacceptance(
  projectName: string,
  acceptUrl: string,
  versionCode: string
): string {
  return emailLayout({
    preview: `Actualización legal - ${projectName}`,
    title: 'Debes aceptar los documentos legales actualizados',
    bodyHtml: `
      <p style="margin:0 0 12px;">Actualizamos los términos, el aviso de privacidad y/o el NDA del portal del proyecto <strong>${escapeHtml(projectName)}</strong> (versión <strong>${escapeHtml(versionCode)}</strong>).</p>
      <p style="margin:0;">Para seguir usando el portal, acepta los documentos vigentes en tu próximo acceso.</p>
    `,
    cta: { label: 'Revisar y aceptar', href: acceptUrl },
    footerNote: 'Si ya no participas en este proyecto, ignora este mensaje o avisa a Codiva.dev.',
  });
}

export function templateStaffAlert(title: string, lines: string[]): string {
  const rows = lines
    .map(
      (line) =>
        `<p style="margin:0 0 8px;font-family:${FONT_BODY};font-size:14px;line-height:1.5;color:${BRAND.text};">${escapeHtml(line)}</p>`
    )
    .join('');

  return emailLayout({
    preview: title,
    title,
    bodyHtml: rows,
    cta: { label: 'Abrir Codiva.dev', href: `${opsBaseUrl()}/dashboard` },
    footerNote: 'Notificación interna · Codiva.dev',
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
    cta: { label: 'Ver inbox', href: `${opsBaseUrl()}/inbox` },
    footerNote: 'Responde directamente a este correo para contactar al remitente.',
  });
}

export function templateCareerApplicationStaff({
  name,
  email,
  phone,
  jobTitle,
  coverLetter,
  opsHref,
}: {
  name: string;
  email: string;
  phone?: string;
  jobTitle: string;
  coverLetter?: string;
  opsHref: string;
}): string {
  return emailLayout({
    preview: `${name} postul\u00f3 a ${jobTitle}`,
    title: 'Nueva postulaci\u00f3n',
    bodyHtml: `
      <p style="margin:0 0 8px;"><strong>Vacante:</strong> ${escapeHtml(jobTitle)}</p>
      <p style="margin:0 0 8px;"><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p style="margin:0 0 8px;"><strong>Correo:</strong> <a href="mailto:${escapeHtml(email)}" style="color:${BRAND.primary};">${escapeHtml(email)}</a></p>
      ${phone ? `<p style="margin:0 0 8px;"><strong>Tel\u00e9fono:</strong> ${escapeHtml(phone)}</p>` : ''}
      ${
        coverLetter
          ? `<p style="margin:16px 0 8px;"><strong>Mensaje:</strong></p>
      <p style="margin:0;padding:16px;background:${BRAND.background};border-radius:8px;white-space:pre-line;">${escapeHtml(coverLetter)}</p>`
          : ''
      }
    `,
    cta: { label: 'Ver postulaciones', href: opsHref },
    footerNote: 'Notificaci\u00f3n interna \u00b7 Bolsa de trabajo Codiva.dev',
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
