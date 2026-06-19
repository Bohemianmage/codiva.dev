/** Layout HTML de marca Codiva para plantillas de Supabase Auth (Go templates). */

const BRAND = {
  primary: '#104E4E',
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#18181B',
  muted: '#6B7280',
  border: '#E5E7EB',
};

const CONFIRMATION_URL = '{{ .ConfirmationURL }}';

export function buildCodivaEmail({
  subject,
  title,
  preview,
  paragraphs = [],
  ctaLabel,
  disclaimer,
  footerNote = 'Codiva — software a la medida y productos digitales',
}) {
  const previewBlock = preview
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>`
    : '';

  const body = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 12px;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.65;color:${BRAND.text};">${p}</p>`
    )
    .join('');

  const disclaimerBlock = disclaimer
    ? `<p style="margin:16px 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.5;color:${BRAND.muted};">${disclaimer}</p>`
    : '';

  return `<!-- Subject: ${subject} -->
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.background};">
  ${previewBlock}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.background};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:${BRAND.primary};padding:24px 32px;">
              <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Codiva</p>
              <h1 style="margin:8px 0 0;font-family:Inter,Arial,sans-serif;font-size:22px;line-height:1.3;font-weight:700;color:#ffffff;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${body}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
                <tr>
                  <td style="border-radius:8px;background:${BRAND.primary};">
                    <a href="${CONFIRMATION_URL}" target="_blank" rel="noopener noreferrer"
                       style="display:inline-block;padding:14px 28px;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};word-break:break-all;">
                Si el botón no funciona, copia este enlace:<br/>
                <a href="${CONFIRMATION_URL}" style="color:${BRAND.primary};text-decoration:none;">${CONFIRMATION_URL}</a>
              </p>
              ${disclaimerBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${BRAND.border};">
              <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};">${footerNote}</p>
              <p style="margin:8px 0 0;font-family:Inter,Arial,sans-serif;font-size:12px;">
                <a href="https://codiva.dev" style="color:${BRAND.primary};text-decoration:none;">codiva.dev</a>
                ·
                <a href="https://ops.codiva.dev" style="color:${BRAND.primary};text-decoration:none;">ops.codiva.dev</a>
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
