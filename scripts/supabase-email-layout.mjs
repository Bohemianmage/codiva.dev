/** Layout HTML de marca Codiva.dev para plantillas de Supabase Auth (Go templates). */

import brand from '../lib/brand.json' with { type: 'json' };

const BRAND = {
  primary: brand.colors.primary,
  background: brand.colors.background,
  card: brand.colors.card,
  text: brand.colors.text,
  muted: brand.colors.textEmailMuted,
  border: brand.colors.border,
};

const BRAND_NAME = brand.name;
const CONTACT_EMAIL = brand.urls.email;
/** Mark oficial: primary teal sobre fondo transparente. */
const LOGO_URL = `${brand.urls.site.replace(/\/$/, '')}/logo.svg`;
const FONT_BODY = `'Inter', Arial, Helvetica, sans-serif`;
const FONT_DISPLAY = `'Plus Jakarta Sans', Inter, Arial, Helvetica, sans-serif`;
const CTA_RADIUS = '12px';
const CONFIRMATION_URL = '{{ .ConfirmationURL }}';

function brandWordmarkHtml(sizePx = 22, as = 'p') {
  const display = as === 'p' ? 'block' : 'inline';
  return `<${as} style="display:${display};margin:0;font-family:${FONT_DISPLAY};font-size:${sizePx}px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:${BRAND.text};white-space:nowrap;">Codiva<span style="font-weight:500;color:${BRAND.primary};">.dev</span></${as}>`;
}

function paintBrandName(html, sizePx = 15) {
  const mark = brandWordmarkHtml(sizePx, 'span');
  return html.replaceAll(`<strong>${BRAND_NAME}</strong>`, mark).replaceAll(BRAND_NAME, mark);
}

export function buildCodivaEmail({
  subject,
  title,
  preview,
  paragraphs = [],
  ctaLabel,
  disclaimer,
  footerNote = brand.tagline,
}) {
  const previewBlock = preview
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>`
    : '';

  const body = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 12px;font-family:${FONT_BODY};font-size:15px;line-height:1.65;color:${BRAND.text};">${paintBrandName(p)}</p>`
    )
    .join('');

  const disclaimerBlock = disclaimer
    ? `<p style="margin:16px 0 0;font-family:${FONT_BODY};font-size:14px;line-height:1.5;color:${BRAND.muted};">${disclaimer}</p>`
    : '';

  return `<!-- Subject: ${subject} -->
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet"/>
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;background:${BRAND.background};">
  ${previewBlock}
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
              <h1 style="margin:0;font-family:${FONT_DISPLAY};font-size:22px;line-height:1.3;font-weight:700;color:${BRAND.text};">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${body}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
                <tr>
                  <td style="border-radius:${CTA_RADIUS};background:${BRAND.primary};">
                    <a href="${CONFIRMATION_URL}" target="_blank" rel="noopener noreferrer"
                       style="display:inline-block;padding:14px 28px;font-family:${FONT_BODY};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:${CTA_RADIUS};">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-family:${FONT_BODY};font-size:12px;line-height:1.5;color:${BRAND.muted};word-break:break-all;">
                Si el botón no funciona, copia este enlace:<br/>
                <a href="${CONFIRMATION_URL}" style="color:${BRAND.primary};text-decoration:none;">${CONFIRMATION_URL}</a>
              </p>
              ${disclaimerBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${BRAND.border};">
              <p style="margin:0;font-family:${FONT_BODY};font-size:12px;line-height:1.5;color:${BRAND.muted};">${footerNote}</p>
              <p style="margin:8px 0 0;font-family:${FONT_BODY};font-size:12px;line-height:1.5;">
                <a href="mailto:${CONTACT_EMAIL}" style="color:${BRAND.primary};text-decoration:none;">${CONTACT_EMAIL}</a>
                <span style="color:${BRAND.muted};"> · </span>
                <a href="https://codiva.dev" style="color:${BRAND.primary};text-decoration:none;">codiva.dev</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
